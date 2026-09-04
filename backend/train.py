import hashlib
import json
import re
from datetime import datetime, timezone
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
import sklearn
from sklearn.cluster import KMeans
from sklearn.dummy import DummyRegressor
from sklearn.ensemble import IsolationForest, RandomForestRegressor
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression, Ridge
from sklearn.metrics import (
    accuracy_score,
    mean_absolute_error,
    r2_score,
    silhouette_score,
)
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.tree import DecisionTreeClassifier
from sklearn.compose import ColumnTransformer

ROOT = Path(__file__).resolve().parents[1]
ARTIFACTS = ROOT / 'data' / 'models'
FEATURES = {
    'cost': ['days', 'travellers', 'daily_cost', 'distance_km'],
    'crowd': ['month', 'weekend', 'rain_mm'],
    'demand': ['month', 'avg_daily_cost', 'visitors_count_lag1', 'visitors_count_lag12'],
    'hotel_price': ['stars', 'distance_center_km', 'baseline_daily_cost', 'season_winter', 'season_monsoon', 'room_type_deluxe', 'room_type_suite'],
}


def metrics(actual, predicted):
    return {'mae': round(float(mean_absolute_error(actual, predicted)), 3),
            'r2': round(float(r2_score(actual, predicted)), 3)}


def train_existing_models(places: pd.DataFrame, real_weather: bool, vectorizer: TfidfVectorizer, matrix) -> dict:
    """Existing TF-IDF + RF cost/crowd. Reproduces the original report."""
    rng = np.random.default_rng(42)
    cost = pd.DataFrame({
        'days': rng.integers(1, 15, 2400),
        'travellers': rng.integers(1, 7, 2400),
        'daily_cost': rng.choice(places.daily_cost, 2400),
        'distance_km': rng.uniform(0, 600, 2400),
    })
    cost['target'] = ((cost.days * cost.daily_cost + cost.distance_km * 4) * cost.travellers * rng.lognormal(0, .12, len(cost))).round()
    dates = pd.date_range('2022-01-01', '2025-12-31')
    crowd = pd.DataFrame({'date': dates.astype(str), 'month': dates.month,
                          'weekend': (dates.dayofweek.isin([4, 5])).astype(int),
                          'rain_mm': rng.gamma(1.2, 5, len(dates))})
    weather_path = ROOT / 'data' / 'raw' / 'weather.json'
    if real_weather:
        raw = pd.DataFrame(json.loads(weather_path.read_text())['daily'])
        raw = raw.rename(columns={'time': 'date', 'precipitation_sum': 'rain_mm'})
        raw = raw.drop_duplicates('date').dropna(subset=['rain_mm'])
        crowd = crowd.drop(columns='rain_mm').merge(raw[['date', 'rain_mm']], on='date', validate='one_to_one').sort_values('date')
    crowd['target'] = np.clip(40 + 22 * crowd.weekend + 18 * crowd.month.isin([11, 12, 1, 2]) - .8 * crowd.rain_mm + rng.normal(0, 9, len(crowd)), 0, 100)

    models = {}
    report = {'split': {}, 'baseline': {}, 'random_forest': {}}
    for name, frame in [('cost', cost), ('crowd', crowd)]:
        frame.to_csv(ROOT / 'data' / f'{name}-synthetic.csv', index=False)
        if name == 'cost':
            train_set, test_set = train_test_split(frame, test_size=.2, random_state=42)
            split = '80/20 random holdout of independent synthetic trips'
        else:
            train_set = frame[frame.date < '2025-01-01']
            test_set = frame[frame.date >= '2025-01-01']
            split = 'chronological: 2022-2024 train, 2025 test; contemporaneous rain input, not a weather forecast'
        columns = FEATURES[name]
        model = RandomForestRegressor(n_estimators=100, max_depth=12, min_samples_leaf=3, random_state=42, n_jobs=1)
        model.fit(train_set[columns], train_set.target)
        baseline = DummyRegressor(strategy='mean').fit(train_set[columns], train_set.target)
        models[name] = model
        report['split'][name] = split
        report['baseline'][name] = metrics(test_set.target, baseline.predict(test_set[columns]))
        report['random_forest'][name] = {
            'mae': round(float(mean_absolute_error(test_set.target, model.predict(test_set[columns]))), 3),
            'r2': round(float(r2_score(test_set.target, model.predict(test_set[columns]))), 3),
            'test_rows': int(len(test_set)),
            'train_rows': int(len(train_set)),
        }
    return models, report


def train_clustering(places: pd.DataFrame) -> dict:
    """K-Means traveler segmentation on synthetic itineraries."""
    frame = pd.read_csv(ROOT / 'data' / 'itineraries-synthetic.csv')
    columns = ['days', 'travellers', 'daily_budget', 'distance_km']
    scaler = StandardScaler().fit(frame[columns])
    matrix = scaler.transform(frame[columns])
    kmeans = KMeans(n_clusters=4, n_init=10, random_state=42).fit(matrix)
    centers = kmeans.cluster_centers_
    sorted_idx = np.argsort(centers[:, 2])  # by daily_budget
    label_map = {old: new for new, old in enumerate(sorted_idx)}
    labels = np.array([label_map[label] for label in kmeans.labels_])
    names = ['Budget backpacker', 'Family comfort', 'Adventure premium', 'Short city break']
    cluster_names = [names[label] for label in sorted_idx]
    sil = float(silhouette_score(matrix, kmeans.labels_))
    inertia = float(kmeans.inertia_)
    cluster_summary = []
    for new_label, old_label in enumerate(sorted_idx):
        mask = labels == new_label
        cluster_summary.append({
            'cluster_id': int(new_label),
            'name': names[new_label],
            'count': int(mask.sum()),
            'avg_days': round(float(frame.loc[mask, 'days'].mean()), 2),
            'avg_travellers': round(float(frame.loc[mask, 'travellers'].mean()), 2),
            'avg_daily_budget': round(float(frame.loc[mask, 'daily_budget'].mean()), 2),
            'avg_distance_km': round(float(frame.loc[mask, 'distance_km'].mean()), 2),
        })
    return {
        'model': Pipeline([('scaler', scaler), ('kmeans', KMeans(n_clusters=4, n_init=10, random_state=42).fit(matrix))]),
        'label_map': label_map,
        'cluster_names': cluster_names,
        'silhouette': round(sil, 3),
        'inertia': round(inertia, 3),
        'summary': cluster_summary,
        'features': columns,
    }


def train_demand(places: pd.DataFrame) -> dict:
    """Ridge regression for monthly destination visitors with lag features."""
    frame = pd.read_csv(ROOT / 'data' / 'demand-synthetic.csv')
    frame = frame.sort_values(['slug', 'date']).reset_index(drop=True)
    frame['visitors_count_lag1'] = frame.groupby('slug')['visitors'].shift(1)
    frame['visitors_count_lag12'] = frame.groupby('slug')['visitors'].shift(12)
    frame = frame.dropna().reset_index(drop=True)
    train_set = frame[frame.date < '2025-01-01']
    test_set = frame[frame.date >= '2025-01-01']
    model = Ridge(alpha=1.0, random_state=42).fit(train_set[FEATURES['demand']], train_set['visitors'])
    baseline = DummyRegressor(strategy='mean').fit(train_set[FEATURES['demand']], train_set['visitors'])
    test_pred = model.predict(test_set[FEATURES['demand']])
    test_pred = np.clip(test_pred, 0, None)
    baseline_pred = np.clip(baseline.predict(test_set[FEATURES['demand']]), 0, None)
    return {
        'model': model,
        'metrics': {
            'ridge': metrics(test_set['visitors'], test_pred),
            'mean_baseline': metrics(test_set['visitors'], baseline_pred),
            'train_rows': int(len(train_set)),
            'test_rows': int(len(test_set)),
            'split': 'chronological: 2022-2024 train, 2025 test',
        },
    }


def train_hotel_price(places: pd.DataFrame) -> dict:
    """RandomForest hotel price estimator with engineered categorical features."""
    frame = pd.read_csv(ROOT / 'data' / 'hotels-synthetic.csv')
    engineered = frame.assign(
        season_winter=(frame['season'] == 'winter').astype(int),
        season_monsoon=(frame['season'] == 'monsoon').astype(int),
        room_type_deluxe=(frame['room_type'] == 'deluxe').astype(int),
        room_type_suite=(frame['room_type'] == 'suite').astype(int),
    )
    train_set, test_set = train_test_split(engineered, test_size=0.2, random_state=42)
    model = RandomForestRegressor(n_estimators=120, max_depth=14, min_samples_leaf=3, random_state=42, n_jobs=1)
    model.fit(train_set[FEATURES['hotel_price']], train_set['price_bdt'])
    baseline = DummyRegressor(strategy='mean').fit(train_set[FEATURES['hotel_price']], train_set['price_bdt'])
    pred = model.predict(test_set[FEATURES['hotel_price']])
    baseline_pred = baseline.predict(test_set[FEATURES['hotel_price']])
    return {
        'model': model,
        'metrics': {
            'random_forest': metrics(test_set['price_bdt'], pred),
            'mean_baseline': metrics(test_set['price_bdt'], baseline_pred),
            'train_rows': int(len(train_set)),
            'test_rows': int(len(test_set)),
            'split': '80/20 random holdout of independent synthetic hotel quotes',
        },
    }


def train_sentiment(places: pd.DataFrame) -> dict:
    """LogisticRegression review score classifier on TF-IDF review text."""
    frame = pd.read_csv(ROOT / 'data' / 'reviews-synthetic.csv')
    cleaned = frame['text'].astype(str).map(lambda text: re.sub(r'[^a-zA-Z\s]', ' ', text).lower().strip())
    train_set, test_set = train_test_split(pd.DataFrame({'text': cleaned, 'score': frame['score']}),
                                            test_size=0.2, random_state=42, stratify=frame['score'])
    pipeline = Pipeline([
        ('tfidf', TfidfVectorizer(ngram_range=(1, 2), sublinear_tf=True, min_df=1)),
        ('clf', LogisticRegression(max_iter=400, C=1.0, random_state=42)),
    ])
    pipeline.fit(train_set['text'], train_set['score'])
    pred = pipeline.predict(test_set['text'])
    mae = float(mean_absolute_error(test_set['score'], pred))
    accuracy = float(accuracy_score(test_set['score'], pred))
    baseline_pred = np.full(len(test_set), int(round(train_set['score'].mean())))
    baseline_mae = float(mean_absolute_error(test_set['score'], baseline_pred))
    return {
        'model': pipeline,
        'metrics': {
            'logistic_regression': {'mae': round(mae, 3), 'accuracy': round(accuracy, 3)},
            'mean_baseline': {'mae': round(baseline_mae, 3)},
            'train_rows': int(len(train_set)),
            'test_rows': int(len(test_set)),
            'split': '80/20 stratified random holdout of synthetic labeled reviews',
        },
    }


def train_anomaly() -> dict:
    """IsolationForest trained on synthetic telemetry baseline."""
    frame = pd.read_csv(ROOT / 'data' / 'telemetry-baseline-synthetic.csv')
    features = ['temperature', 'humidity', 'latitude', 'longitude']
    model = IsolationForest(n_estimators=120, contamination=0.05, random_state=42)
    model.fit(frame[features])
    rng = np.random.default_rng(SEED := 99)
    test_normal = frame.sample(n=200, random_state=7)[features]
    test_anomaly = pd.DataFrame({
        'temperature': rng.normal(46, 2, 30),
        'humidity': rng.normal(5, 2, 30),
        'latitude': rng.normal(0, 1, 30),
        'longitude': rng.normal(0, 1, 30),
    })
    test = pd.concat([test_normal, test_anomaly], ignore_index=True)
    test['truth'] = [0] * 200 + [1] * 30
    scores = model.decision_function(test[features])
    preds = (model.predict(test[features]) == -1).astype(int)
    tp = int(((preds == 1) & (test['truth'] == 1)).sum())
    fp = int(((preds == 1) & (test['truth'] == 0)).sum())
    fn = int(((preds == 0) & (test['truth'] == 1)).sum())
    precision = tp / max(tp + fp, 1)
    recall = tp / max(tp + fn, 1)
    return {
        'model': model,
        'features': features,
        'metrics': {
            'isolation_forest': {'precision': round(precision, 3), 'recall': round(recall, 3), 'contamination': 0.05},
            'split': '1200 synthetic baseline training rows; 230 mixed test rows',
            'train_rows': int(len(frame)),
            'test_rows': int(len(test)),
        },
    }


def train_season(places: pd.DataFrame) -> dict:
    """DecisionTree classifying best month bucket for each destination."""
    frame = pd.read_csv(ROOT / 'data' / 'demand-synthetic.csv')
    frame['best_quarter'] = (frame['month'] - 1) // 3  # 0..3
    monthly = frame.groupby(['slug', 'category', 'avg_daily_cost', 'month'])['visitors'].mean().reset_index()
    rows = []
    for slug, group in monthly.groupby('slug'):
        peak_idx = int(group['visitors'].idxmax())
        peak_month = int(group.loc[peak_idx, 'month'])
        rows.append({
            'slug': slug,
            'category': group['category'].iloc[0],
            'avg_daily_cost': float(group['avg_daily_cost'].iloc[0]),
            'peak_month': peak_month,
        })
    target = pd.DataFrame(rows)
    train_set, test_set = train_test_split(target, test_size=0.25, random_state=42, stratify=target['peak_month'])
    features = ['avg_daily_cost', 'category']
    preprocessor = ColumnTransformer([('cat', OneHotEncoder(handle_unknown='ignore'), ['category'])],
                                     remainder='passthrough')
    pipeline = Pipeline([
        ('pre', preprocessor),
        ('clf', DecisionTreeClassifier(max_depth=6, min_samples_leaf=2, random_state=42)),
    ])
    pipeline.fit(train_set[features], train_set['peak_month'])
    pred = pipeline.predict(test_set[features])
    accuracy = float(accuracy_score(test_set['peak_month'], pred))
    baseline_pred = np.full(len(test_set), int(round(train_set['peak_month'].mean())))
    baseline_accuracy = float(accuracy_score(test_set['peak_month'], baseline_pred))
    return {
        'model': pipeline,
        'metrics': {
            'decision_tree': {'accuracy': round(accuracy, 3)},
            'mean_baseline': {'accuracy': round(baseline_accuracy, 3)},
            'train_rows': int(len(train_set)),
            'test_rows': int(len(test_set)),
            'split': 'stratified 75/25 holdout of per-destination synthetic demand peaks',
        },
        'target_names': {1: 'Jan-Feb (winter peak)', 4: 'Apr-Jun', 7: 'Jul-Sep', 10: 'Oct-Dec (autumn)'},
    }


def train():
    ARTIFACTS.mkdir(parents=True, exist_ok=True)
    places = pd.read_json(ROOT / 'data' / 'places.json').drop_duplicates('slug')
    places = places.dropna(subset=['slug', 'category', 'daily_cost', 'latitude', 'longitude'])
    places = places[places.latitude.between(20, 27) & places.longitude.between(88, 93)]
    places = places.sort_values('slug').reset_index(drop=True)
    vectorizer = TfidfVectorizer(ngram_range=(1, 2), sublinear_tf=True)
    matrix = vectorizer.fit_transform(places['category'] + ' ' + places['tags'].fillna('') + ' ' + places['description'].fillna(''))
    real_weather = (ROOT / 'data' / 'raw' / 'weather.json').exists()

    existing_models, existing_report = train_existing_models(places, real_weather, vectorizer, matrix)

    clustering = train_clustering(places)
    demand = train_demand(places)
    hotels = train_hotel_price(places)
    sentiment = train_sentiment(places)
    anomaly = train_anomaly()
    season = train_season(places)

    checks = []
    for category in sorted(places.category.unique()):
        scores = (matrix @ vectorizer.transform([category]).T).toarray().ravel()
        top = scores.argsort()[::-1][:3]
        checks.append(float((places.iloc[top].category == category).mean()))

    report = {
        'created_at': datetime.now(timezone.utc).isoformat(),
        'seed': 42,
        'sklearn_version': sklearn.__version__,
        'places': len(places),
        'warning': 'All cost / crowd / demand / hotel / sentiment / anomaly / season targets are SYNTHETIC. Scores measure generated-data fit, not real-world accuracy. Anomaly baseline is a 5% injected synthetic contamination for metric calculation only.',
        'weather_features': 'Open-Meteo reanalysis' if real_weather else 'synthetic offline fallback',
        'models': {
            'cost': {
                'features': FEATURES['cost'],
                'train_rows': existing_report['random_forest']['cost']['train_rows'],
                'test_rows': existing_report['random_forest']['cost']['test_rows'],
                'split': existing_report['split']['cost'],
                'random_forest': {'mae': existing_report['random_forest']['cost']['mae'],
                                  'r2': existing_report['random_forest']['cost']['r2']},
                'mean_baseline': existing_report['baseline']['cost'],
                'model_type': 'RandomForestRegressor',
            },
            'crowd': {
                'features': FEATURES['crowd'],
                'train_rows': existing_report['random_forest']['crowd']['train_rows'],
                'test_rows': existing_report['random_forest']['crowd']['test_rows'],
                'split': existing_report['split']['crowd'],
                'random_forest': {'mae': existing_report['random_forest']['crowd']['mae'],
                                  'r2': existing_report['random_forest']['crowd']['r2']},
                'mean_baseline': existing_report['baseline']['crowd'],
                'model_type': 'RandomForestRegressor',
            },
        },
        'extensions': {
            'clustering': {
                'model_type': 'KMeans (k=4) + StandardScaler',
                'silhouette': clustering['silhouette'],
                'inertia': clustering['inertia'],
                'clusters': clustering['summary'],
            },
            'demand': {**demand['metrics'], 'features': FEATURES['demand'], 'model_type': 'Ridge regression with lag features'},
            'hotel_price': {**hotels['metrics'], 'features': FEATURES['hotel_price'], 'model_type': 'RandomForestRegressor'},
            'sentiment': {**sentiment['metrics'], 'model_type': 'LogisticRegression + TF-IDF'},
            'anomaly': {**anomaly['metrics'], 'features': anomaly['features'], 'model_type': 'IsolationForest'},
            'season': {**season['metrics'], 'features': ['avg_daily_cost', 'category'], 'model_type': 'DecisionTreeClassifier'},
        },
        'recommendation': {
            'method': 'fitted TF-IDF cosine similarity plus explicit budget/distance ranking',
            'category_precision_at_3': round(float(np.mean(checks)), 3),
            'evaluation': 'category sanity check on catalog metadata; NOT held-out user relevance evaluation',
        },
        'places_sha256': hashlib.sha256((ROOT / 'data' / 'places.json').read_bytes()).hexdigest(),
    }

    bundle = {
        'places': places.to_dict('records'),
        'vectorizer': vectorizer,
        'matrix': matrix,
        'models': existing_models,
        'extension_models': {
            'clustering': clustering['model'],
            'clustering_meta': {'names': clustering['cluster_names']},
            'demand': demand['model'],
            'hotel_price': hotels['model'],
            'sentiment': sentiment['model'],
            'anomaly': anomaly['model'],
            'season': season['model'],
            'season_labels': season['target_names'],
        },
    }
    joblib.dump(bundle, ARTIFACTS / 'bundle.joblib', compress=3)
    (ARTIFACTS / 'metrics.json').write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps(report, indent=2))


if __name__ == '__main__':
    train()