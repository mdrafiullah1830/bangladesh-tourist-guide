"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

type Place = { slug: string; name: string; daily_cost: number; score: number; distance_km: number; category: string };
type Device = { id: string; name: string; simulated: boolean; stale: boolean; recorded_at: string | null; latitude: number | null; longitude: number | null; temperature: number | null; humidity: number | null };
type Alert = { id: number; name: string; kind: string; status: string; simulated: boolean; recorded_at: string };
type Safety = { devices: Device[]; alerts: Alert[] };
type Report = { warning: string; places: number; weather_features: string; models: Record<string, { random_forest: { mae: number; r2: number }; mean_baseline: { mae: number }; test_rows: number }>; extensions: Record<string, { model_type?: string; silhouette?: number; mae?: number; r2?: number; random_forest?: { mae: number; r2: number }; ridge?: { mae: number; r2: number }; logistic_regression?: { mae: number; accuracy: number }; isolation_forest?: { precision: number; recall: number }; decision_tree?: { accuracy: number }; mean_baseline?: { mae?: number; accuracy?: number }; clusters?: Array<{ cluster_id: number; name: string; count: number }>; train_rows?: number; test_rows?: number }> };
type ExtensionKey = "clustering" | "demand" | "hotel_price" | "sentiment" | "anomaly" | "season";

export default function SmartPage() {
  const [token, setToken] = useState("");
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [interests, setInterests] = useState("beach nature");
  const [budget, setBudget] = useState(3000);
  const [days, setDays] = useState(3);
  const [travellers, setTravellers] = useState(1);
  const [distance, setDistance] = useState(200);
  const [visitDate, setVisitDate] = useState(new Date().toISOString().slice(0, 10));
  const [rain, setRain] = useState(0);
  const [places, setPlaces] = useState<Place[] | null>(null);
  const [cost, setCost] = useState<{ estimated_bdt: number; test_mae_bdt: number } | null>(null);
  const [crowd, setCrowd] = useState<{ index: number } | null>(null);
  const [selected, setSelected] = useState("");
  const [report, setReport] = useState<Report | null>(null);
  const [safety, setSafety] = useState<Safety>({ devices: [], alerts: [] });
  const [consent, setConsent] = useState(false);
  const [deviceName, setDeviceName] = useState("Demo wristband");
  const [simulated, setSimulated] = useState(true);
  const [credential, setCredential] = useState<{ id: string; token: string; simulated: boolean } | null>(null);
  const [message, setMessage] = useState("");
  const [revokeTarget, setRevokeTarget] = useState<{ id: string; name: string } | null>(null);

  const [clusterDays, setClusterDays] = useState(5);
  const [clusterTravellers, setClusterTravellers] = useState(2);
  const [clusterBudget, setClusterBudget] = useState(2500);
  const [clusterDistance, setClusterDistance] = useState(150);
  const [clusterResult, setClusterResult] = useState<{ cluster_id: number; cluster_name: string } | null>(null);

  const [hotelSlug, setHotelSlug] = useState("");
  const [hotelStars, setHotelStars] = useState(3);
  const [hotelDistance, setHotelDistance] = useState(3);
  const [hotelSeason, setHotelSeason] = useState("winter");
  const [hotelRoom, setHotelRoom] = useState("standard");
  const [hotelResult, setHotelResult] = useState<{ estimated_bdt: number } | null>(null);

  const [sentimentText, setSentimentText] = useState("The view was amazing and the staff were friendly");
  const [sentimentResult, setSentimentResult] = useState<{ predicted_score: number; class_probabilities: Record<string, number> } | null>(null);

  const [anomalyTemp, setAnomalyTemp] = useState(31);
  const [anomalyHumidity, setAnomalyHumidity] = useState(72);
  const [anomalyLat, setAnomalyLat] = useState(22.0);
  const [anomalyLon, setAnomalyLon] = useState(91.0);
  const [anomalyResult, setAnomalyResult] = useState<{ anomaly: boolean; decision_score: number } | null>(null);

  const [demandSlug, setDemandSlug] = useState("");
  const [demandMonth, setDemandMonth] = useState(new Date().getMonth() + 1);
  const [demandLag1, setDemandLag1] = useState(2000);
  const [demandLag12, setDemandLag12] = useState(2000);
  const [demandResult, setDemandResult] = useState<{ estimated_visitors: number } | null>(null);

  const [seasonResult, setSeasonResult] = useState<{ peak_month: number; peak_label: string } | null>(null);

  async function api<T>(path: string, method = "GET", body?: unknown, bearer = token): Promise<T> {
    const response = await fetch(`/api/smart/${path}`, {
      method, headers: { "Authorization": `Bearer ${bearer}`, "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body), cache: "no-store",
    });
    if (!response.ok) {
      const detail = await response.json().catch(() => ({}));
      throw new Error(typeof detail.detail === "string" ? detail.detail : `Request failed (${response.status}). Check inputs and that the backend is running.`);
    }
    return response.status === 204 ? undefined as T : response.json();
  }

  async function action(task: () => Promise<void>) {
    setBusy(true); setError(""); setMessage("");
    try { await task(); } catch (failure) { setError(failure instanceof Error ? failure.message : "Request failed"); }
    finally { setBusy(false); }
  }

  async function connect(event: FormEvent) {
    event.preventDefault();
    await action(async () => {
      const [modelReport, state] = await Promise.all([api<Report>("models"), api<Safety>("safety")]);
      setReport(modelReport); setSafety(state); setConnected(true);
    });
  }

  useEffect(() => {
    if (!connected) return;
    let active = true;
    const controller = new AbortController();
    const interval = setInterval(async () => {
      try {
        const response = await fetch("/api/smart/safety", { headers: { Authorization: `Bearer ${token}` }, cache: "no-store", signal: controller.signal });
        if (!response.ok) throw new Error("Safety feed unavailable; displayed readings may be stale.");
        const state = await response.json();
        if (active) setSafety(state);
      } catch (failure) {
        if (active) {
          setError(failure instanceof Error ? failure.message : "Safety feed unavailable");
          setSafety(previous => ({ ...previous, devices: previous.devices.map(device => ({ ...device, stale: true })) }));
        }
      }
    }, 5000);
    return () => { active = false; clearInterval(interval); controller.abort(); };
  }, [connected, token]);

  async function recommend(event: FormEvent) {
    event.preventDefault();
    await action(async () => {
      setCost(null); setSelected("");
      const response = await api<{ items: Place[] }>("recommend", "POST", { interests, daily_budget: budget });
      setPlaces(response.items);
      if (response.items.length) setHotelSlug(response.items[0].slug);
      if (response.items.length) setDemandSlug(response.items[0].slug);
    });
  }

  function extensionSummary(key: ExtensionKey): string {
    const ext = report?.extensions?.[key];
    if (!ext) return "—";
    if (key === "clustering" && ext.silhouette !== undefined) return `Silhouette ${ext.silhouette}`;
    if (key === "anomaly" && ext.isolation_forest) return `Precision ${ext.isolation_forest.precision} · Recall ${ext.isolation_forest.recall}`;
    if (key === "sentiment" && ext.logistic_regression) return `Accuracy ${Math.round(ext.logistic_regression.accuracy * 100)}%`;
    if (key === "season" && ext.decision_tree) return `Accuracy ${Math.round(ext.decision_tree.accuracy * 100)}%`;
    // demand and hotel_price metrics come as {mae, r2} directly (not nested under ridge/random_forest)
    if (ext.mae != null && ext.r2 != null) return `R² ${ext.r2} · MAE ${ext.mae}`;
    if (ext.random_forest) return `R² ${ext.random_forest.r2} · MAE ${ext.random_forest.mae}`;
    return ext.model_type ?? "";
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><p className="text-bangladesh-green font-semibold text-sm">BANGLADESH GUIDE · RESEARCH PROTOTYPE</p><h1 className="text-3xl font-bold mt-2">Travel intelligence & safety</h1><p className="text-gray-600 mt-2">Trained recommendations, transparent estimates, and consent-based device monitoring.</p></div>
        <Link href="/plan" className="text-bangladesh-green underline">Existing trip planner →</Link>
      </div>
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">All cost, crowd, demand, hotel, sentiment, anomaly and clustering outputs use SYNTHETIC targets. The model card describes the dataset, split and metric for each. GPS is only live when a real device sends it. SOS is recorded on this dashboard; nobody is automatically called or dispatched. This prototype cannot guarantee safety.</div>
      {error && <div role="alert" className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg">{error}</div>}
      {message && <p role="status" className="bg-green-50 text-green-900 p-4 rounded-lg">{message}</p>}
      {!connected ? <Card className="p-6 max-w-xl">
        <h2 className="font-bold text-xl mb-3">Connect your local project</h2>
        <p className="text-sm text-gray-600 mb-4">Use the operator token from .env.safety, created by setup. It stays in memory for this tab only. The existing demo login does not grant safety access.</p>
        <form onSubmit={connect} className="space-y-4"><Input label="Operator token" type="password" autoComplete="off" value={token} onChange={event => setToken(event.target.value)} required minLength={32}/><Button type="submit" disabled={busy}>Connect</Button></form>
      </Card> : <>
        <div className="flex justify-between items-center text-sm"><p className="text-bangladesh-green">Connected · Safety refreshes every 5 seconds</p><button className="underline" onClick={() => { setConnected(false); setToken(""); setCredential(null); setSafety({ devices: [], alerts: [] }); }}>Disconnect</button></div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="p-6 space-y-4">
            <div className="flex items-start justify-between gap-3"><h2 className="font-bold text-xl">01 · Find your destination</h2><span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700">TF-IDF + budget filter</span></div>
            <form onSubmit={recommend} className="space-y-4">
              <Input label="Interests (English keywords)" value={interests} onChange={event => setInterests(event.target.value)} required maxLength={160}/>
              <Input label="Daily budget per person (BDT)" type="number" min={100} max={100000} value={budget} onChange={event => setBudget(Number(event.target.value))} required/>
              <p className="text-xs text-gray-500">Starting point: Dhaka. Distances are straight-line, not driving routes. Budget filters unverified catalog estimates.</p>
              <Button type="submit" disabled={busy}>Find matches</Button>
            </form>
            {places?.length === 0 && <p>No destinations fit this budget. Increase it and try again.</p>}
            {places?.map(place => <div key={place.slug} className="border-t pt-3 flex items-center justify-between gap-3"><div><Link href={`/destinations/${place.slug}`} className="font-semibold text-bangladesh-green">{place.name}</Link><p className="text-sm text-gray-600">৳{place.daily_cost}/day · {place.distance_km} km · {place.category}</p><p className="text-xs text-gray-500">Ranking score {place.score} (not a probability)</p></div><Button disabled={busy} variant="outline" onClick={() => action(async () => { setCost(null); setSelected(place.name); setCost(await api("predict/cost", "POST", { slug: place.slug, days, travellers, distance_km: distance })); })}>Estimate</Button></div>)}
          </Card>

          <Card className="p-6 space-y-4">
            <div className="flex items-start justify-between gap-3"><h2 className="font-bold text-xl">02 · Explore scenarios</h2><span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700">RF cost + crowd</span></div>
            <div className="grid grid-cols-2 gap-3"><Input label="Days (1–14)" type="number" min={1} max={14} value={days} onChange={event => { setDays(Number(event.target.value)); setCost(null); }}/><Input label="Travellers (1–6)" type="number" min={1} max={6} value={travellers} onChange={event => { setTravellers(Number(event.target.value)); setCost(null); }}/></div>
            <Input label="Transport distance assumption (km, 0–600)" type="number" min={0} max={600} value={distance} onChange={event => { setDistance(Number(event.target.value)); setCost(null); }}/>
            {cost ? <div className="bg-green-50 p-4 rounded-lg"><p>{selected} · synthetic cost estimate</p><p className="font-bold text-3xl">৳{cost.estimated_bdt.toLocaleString()}</p><p className="text-xs mt-2">Synthetic test MAE: ৳{cost.test_mae_bdt}. This is not a confidence interval or a booking quote.</p></div> : <p className="text-sm text-gray-500">Choose “Estimate” on a matching destination.</p>}
            <form onSubmit={event => { event.preventDefault(); action(async () => { setCrowd(await api("predict/crowd", "POST", { date: visitDate, rain_mm: rain })); }); }} className="space-y-3 border-t pt-4">
              <p className="font-semibold">Cox’s Bazar crowd simulation</p><Input label="Visit date" type="date" value={visitDate} onChange={event => { setVisitDate(event.target.value); setCrowd(null); }} required/><Input label="Assumed rainfall (mm)" type="number" min={0} max={100} value={rain} onChange={event => { setRain(Number(event.target.value)); setCrowd(null); }} required/><Button disabled={busy} type="submit" variant="outline">Run crowd scenario</Button>
              {crowd && <p className="font-semibold">Synthetic crowd index: {crowd.index}/100</p>}
            </form>
          </Card>
        </div>

        <Card className="p-6 space-y-4">
          <div className="flex items-start justify-between gap-3"><h2 className="font-bold text-xl">03 · Traveler cluster & hotel pricing</h2><span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700">K-Means · RandomForest</span></div>
          <p className="text-sm text-gray-600">Cluster your trip style, then estimate a hotel price for the chosen destination. All outputs are based on synthetic training data.</p>
          <div className="grid md:grid-cols-2 gap-6">
            <form className="space-y-3" onSubmit={event => { event.preventDefault(); action(async () => { setClusterResult(await api("predict/cluster", "POST", { days: clusterDays, travellers: clusterTravellers, daily_budget: clusterBudget, distance_km: clusterDistance })); }); }}>
              <p className="font-semibold">Cluster your trip</p>
              <Input label="Days" type="number" min={1} max={30} value={clusterDays} onChange={event => setClusterDays(Number(event.target.value))} required/>
              <Input label="Travellers" type="number" min={1} max={10} value={clusterTravellers} onChange={event => setClusterTravellers(Number(event.target.value))} required/>
              <Input label="Daily budget per person (BDT)" type="number" min={100} max={50000} value={clusterBudget} onChange={event => setClusterBudget(Number(event.target.value))} required/>
              <Input label="Distance (km)" type="number" min={0} max={2000} value={clusterDistance} onChange={event => setClusterDistance(Number(event.target.value))} required/>
              <Button type="submit" variant="outline" disabled={busy}>Identify cluster</Button>
              {clusterResult && <div className="bg-emerald-50 p-4 rounded-lg"><p className="font-semibold">{clusterResult.cluster_name}</p><p className="text-xs text-gray-600">Cluster id {clusterResult.cluster_id} (synthetic segmentation)</p></div>}
            </form>
            <form className="space-y-3" onSubmit={event => { event.preventDefault(); action(async () => { setHotelResult(await api("predict/hotel", "POST", { slug: hotelSlug || (places?.[0]?.slug ?? "coxs-bazar"), stars: hotelStars, distance_center_km: hotelDistance, baseline_daily_cost: 2500, season: hotelSeason, room_type: hotelRoom })); }); }}>
              <p className="font-semibold">Estimate hotel price</p>
              <label className="text-sm block">Destination<select className="block w-full border rounded-lg p-3 mt-1" value={hotelSlug || (places?.[0]?.slug ?? "coxs-bazar")} onChange={event => setHotelSlug(event.target.value)}>{places?.map(place => <option key={place.slug} value={place.slug}>{place.name}</option>) ?? <option value="coxs-bazar">Cox's Bazar</option>}</select></label>
              <div className="grid grid-cols-2 gap-3"><Input label="Stars (1-5)" type="number" min={1} max={5} value={hotelStars} onChange={event => setHotelStars(Number(event.target.value))} required/><Input label="Distance from center (km)" type="number" min={0} max={100} value={hotelDistance} onChange={event => setHotelDistance(Number(event.target.value))} required/></div>
              <label className="text-sm block">Season<select className="block w-full border rounded-lg p-3 mt-1" value={hotelSeason} onChange={event => setHotelSeason(event.target.value)}><option value="winter">Winter</option><option value="summer">Summer</option><option value="monsoon">Monsoon</option><option value="autumn">Autumn</option></select></label>
              <label className="text-sm block">Room type<select className="block w-full border rounded-lg p-3 mt-1" value={hotelRoom} onChange={event => setHotelRoom(event.target.value)}><option value="standard">Standard</option><option value="deluxe">Deluxe</option><option value="suite">Suite</option></select></label>
              <Button type="submit" variant="outline" disabled={busy}>Estimate hotel</Button>
              {hotelResult && <div className="bg-emerald-50 p-4 rounded-lg"><p className="font-semibold">৳{hotelResult.estimated_bdt.toLocaleString()} / night</p><p className="text-xs text-gray-600">Synthetic RandomForest estimate; not a booking quote.</p></div>}
            </form>
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <div className="flex items-start justify-between gap-3"><h2 className="font-bold text-xl">04 · Review sentiment & seasonality</h2><span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700">LogisticRegression · DecisionTree</span></div>
          <div className="grid md:grid-cols-2 gap-6">
            <form className="space-y-3" onSubmit={event => { event.preventDefault(); action(async () => { setSentimentResult(await api("predict/sentiment", "POST", { text: sentimentText })); }); }}>
              <p className="font-semibold">Predict review score</p>
              <label className="text-sm block">Review text<textarea className="block w-full border rounded-lg p-3 mt-1" rows={4} value={sentimentText} onChange={event => setSentimentText(event.target.value)} required maxLength={1000}/></label>
              <Button type="submit" variant="outline" disabled={busy}>Score review</Button>
              {sentimentResult && <div className="bg-emerald-50 p-4 rounded-lg"><p className="font-semibold">Predicted score: {sentimentResult.predicted_score}/5</p><div className="mt-2 space-y-1">{Object.entries(sentimentResult.class_probabilities).map(([score, probability]) => <div key={score} className="flex items-center gap-2 text-xs"><span className="w-8">{score}★</span><div className="flex-1 h-2 bg-gray-200 rounded"><div className="h-2 bg-emerald-500 rounded" style={{ width: `${Math.round(Number(probability) * 100)}%` }} /></div><span>{Math.round(Number(probability) * 100)}%</span></div>)}</div></div>}
            </form>
            <form className="space-y-3" onSubmit={event => { event.preventDefault(); action(async () => { const slug = hotelSlug || (places?.[0]?.slug ?? "coxs-bazar"); const place = places?.find(place => place.slug === slug); setSeasonResult(await api("predict/season", "POST", { slug, avg_daily_cost: place?.daily_cost ?? 2500, category: place?.category ?? "beach" })); }); }}>
              <p className="font-semibold">Best season for a destination</p>
              <label className="text-sm block">Destination<select className="block w-full border rounded-lg p-3 mt-1" value={hotelSlug || (places?.[0]?.slug ?? "coxs-bazar")} onChange={event => setHotelSlug(event.target.value)}>{places?.map(place => <option key={place.slug} value={place.slug}>{place.name}</option>) ?? <option value="coxs-bazar">Cox's Bazar</option>}</select></label>
              <Button type="submit" variant="outline" disabled={busy}>Predict peak month</Button>
              {seasonResult && <div className="bg-emerald-50 p-4 rounded-lg"><p className="font-semibold">{seasonResult.peak_label}</p><p className="text-xs text-gray-600">DecisionTree over per-destination synthetic demand peaks; not a substitute for actual seasonality research.</p></div>}
            </form>
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <div className="flex items-start justify-between gap-3"><h2 className="font-bold text-xl">05 · Telemetry anomaly & demand forecast</h2><span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700">IsolationForest · Ridge</span></div>
          <div className="grid md:grid-cols-2 gap-6">
            <form className="space-y-3" onSubmit={event => { event.preventDefault(); action(async () => { setAnomalyResult(await api("predict/anomaly", "POST", { temperature: anomalyTemp, humidity: anomalyHumidity, latitude: anomalyLat, longitude: anomalyLon })); }); }}>
              <p className="font-semibold">Anomaly detection (synthetic)</p>
              <div className="grid grid-cols-2 gap-3"><Input label="Temperature °C" type="number" min={-40} max={85} value={anomalyTemp} onChange={event => setAnomalyTemp(Number(event.target.value))} required/><Input label="Humidity %" type="number" min={0} max={100} value={anomalyHumidity} onChange={event => setAnomalyHumidity(Number(event.target.value))} required/></div>
              <div className="grid grid-cols-2 gap-3"><Input label="Latitude" type="number" min={-90} max={90} value={anomalyLat} onChange={event => setAnomalyLat(Number(event.target.value))} required/><Input label="Longitude" type="number" min={-180} max={180} value={anomalyLon} onChange={event => setAnomalyLon(Number(event.target.value))} required/></div>
              <Button type="submit" variant="outline" disabled={busy}>Check telemetry</Button>
              {anomalyResult && <div className={`p-4 rounded-lg ${anomalyResult.anomaly ? "bg-red-50" : "bg-emerald-50"}`}><p className="font-semibold">{anomalyResult.anomaly ? "Flagged as anomaly" : "Within baseline"}</p><p className="text-xs text-gray-600">Decision score {anomalyResult.decision_score} (lower = more anomalous)</p></div>}
            </form>
            <form className="space-y-3" onSubmit={event => { event.preventDefault(); action(async () => { const slug = demandSlug || (places?.[0]?.slug ?? "coxs-bazar"); const place = places?.find(place => place.slug === slug); setDemandResult(await api("predict/demand", "POST", { slug, month: demandMonth, avg_daily_cost: place?.daily_cost ?? 2500, visitors_count_lag1: demandLag1, visitors_count_lag12: demandLag12 })); }); }}>
              <p className="font-semibold">Monthly visitor forecast</p>
              <label className="text-sm block">Destination<select className="block w-full border rounded-lg p-3 mt-1" value={demandSlug || (places?.[0]?.slug ?? "coxs-bazar")} onChange={event => setDemandSlug(event.target.value)}>{places?.map(place => <option key={place.slug} value={place.slug}>{place.name}</option>) ?? <option value="coxs-bazar">Cox's Bazar</option>}</select></label>
              <Input label="Month (1–12)" type="number" min={1} max={12} value={demandMonth} onChange={event => setDemandMonth(Number(event.target.value))} required/>
              <div className="grid grid-cols-2 gap-3"><Input label="Previous month visitors" type="number" min={0} max={10_000_000} value={demandLag1} onChange={event => setDemandLag1(Number(event.target.value))} required/><Input label="Same month last year" type="number" min={0} max={10_000_000} value={demandLag12} onChange={event => setDemandLag12(Number(event.target.value))} required/></div>
              <Button type="submit" variant="outline" disabled={busy}>Forecast visitors</Button>
              {demandResult && <div className="bg-emerald-50 p-4 rounded-lg"><p className="font-semibold">{demandResult.estimated_visitors.toLocaleString()} visitors</p><p className="text-xs text-gray-600">Synthetic Ridge forecast with month + lag features; not actual visitor counts.</p></div>}
            </form>
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <h2 className="font-bold text-xl">06 · GPS & SOS monitoring</h2>
          <p className="text-sm text-gray-600">Seven-day telemetry retention. Deleting a device revokes its token and erases its readings and alerts. Do not enter passport details or sensitive identities.</p>
          <form className="grid md:grid-cols-2 gap-4" onSubmit={event => { event.preventDefault(); action(async () => { setCredential(await api("devices", "POST", { name: deviceName, simulated, consent })); setSafety(await api("safety")); }); }}>
            <Input label="Device nickname" value={deviceName} onChange={event => setDeviceName(event.target.value)} required maxLength={60}/>
            <label className="text-sm">Device type<select className="block w-full border rounded-lg p-3 mt-1" value={String(simulated)} onChange={event => setSimulated(event.target.value === "true")}><option value="true">Simulated demo device</option><option value="false">Real ESP32 prototype</option></select></label>
            <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={consent} onChange={event => setConsent(event.target.checked)} required/>I consent to this device’s location and sensor data being stored for this prototype.</label><Button type="submit" disabled={busy || !consent}>Register device</Button>
          </form>
          {credential && <div className="bg-gray-50 p-4 rounded-lg space-y-3"><p className="font-semibold">New device token · shown only in this tab</p><input aria-label="Device token" type="password" readOnly value={credential.token} className="w-full p-2 border rounded" onFocus={event => { event.target.type = "text"; event.target.select(); }} onBlur={event => { event.target.type = "password"; }}/><p className="text-xs">Copy into the ESP32 configuration. Treat it as a password.</p>{credential.simulated && <div className="flex gap-3 flex-wrap">{[false, true].map(sos => <Button key={String(sos)} disabled={busy} variant={sos ? "danger" : "outline"} onClick={() => action(async () => { await api("telemetry", "POST", { event_id: crypto.randomUUID(), recorded_at: new Date().toISOString(), latitude: 21.4272, longitude: 92.0058, temperature: 31, humidity: 76, sos }, credential.token); setSafety(await api("safety")); setMessage(sos ? "Simulated SOS recorded locally. No emergency service was contacted." : "Simulated sensor reading stored."); })}>{sos ? "Simulate SOS" : "Send sample reading"}</Button>)}</div>}</div>}
          <div className="grid md:grid-cols-2 gap-4">{safety.devices.length === 0 && <p className="text-gray-500">No registered devices yet.</p>}{safety.devices.map(device => <div key={device.id} className="border rounded-xl p-4 space-y-2"><p className="font-semibold">{device.name} <span className="text-xs font-normal">{device.simulated ? "SIMULATED" : "HARDWARE"} · {device.stale ? "STALE / NO DATA" : "RECENT"}</span></p><p className="text-sm">{device.temperature ?? "—"} °C · {device.humidity ?? "—"}% humidity</p><p className="text-sm">GPS: {device.latitude ?? "no fix"}, {device.longitude ?? "no fix"}</p>{device.latitude !== null && device.longitude !== null && <a className="text-sm underline" href={`https://www.openstreetmap.org/?mlat=${device.latitude}&mlon=${device.longitude}#map=15/${device.latitude}/${device.longitude}`} target="_blank" rel="noreferrer">View location on OpenStreetMap (shares coordinates)</a>}<p className="text-xs text-gray-500">{device.recorded_at ? new Date(device.recorded_at).toLocaleString() : "Waiting for first reading"}</p><button className="text-red-700 underline text-sm" disabled={busy} onClick={() => setRevokeTarget({ id: device.id, name: device.name })}>Revoke &amp; erase device</button></div>)}</div>
          <h3 className="font-semibold pt-3">Recent alerts</h3>{safety.alerts.length === 0 && <p className="text-sm text-gray-500">No alerts received.</p>}
          {safety.alerts.map(alert => <div key={alert.id} className="flex justify-between items-center gap-3 border-t pt-3"><div><p className="font-semibold">{alert.kind} · {alert.name}</p><p className="text-xs text-gray-500">{alert.simulated ? "Simulated" : "Hardware"} · {new Date(alert.recorded_at).toLocaleString()} · {alert.status}</p></div>{alert.status === "open" && <Button disabled={busy} variant="outline" onClick={() => action(async () => { await api(`alerts/${alert.id}/ack`, "POST"); setSafety(await api("safety")); })}>Acknowledge locally</Button>}</div>)}
        </Card>

        {report && <Card className="p-6">
          <h2 className="font-bold text-xl mb-3">Model evidence</h2>
          <p className="text-sm mb-3">{report.places} catalog destinations · Weather features: {report.weather_features}</p>
          <div className="overflow-x-auto mb-6"><table className="w-full text-sm text-left"><thead><tr><th className="p-2">Core synthetic target</th><th>Test rows</th><th>Model MAE</th><th>Mean baseline MAE</th><th>R²</th></tr></thead><tbody>{Object.entries(report.models).map(([name, model]) => <tr key={name} className="border-t"><td className="p-2">{name} ({name === "cost" ? "BDT" : "index points"})</td><td>{model.test_rows}</td><td>{model.random_forest.mae}</td><td>{model.mean_baseline.mae}</td><td>{model.random_forest.r2}</td></tr>)}</tbody></table></div>
          <div className="overflow-x-auto"><table className="w-full text-sm text-left"><thead><tr><th className="p-2">Extension</th><th>Model</th><th>Summary</th></tr></thead><tbody>{(["clustering", "demand", "hotel_price", "sentiment", "anomaly", "season"] as ExtensionKey[]).map(key => <tr key={key} className="border-t"><td className="p-2 font-medium">{key.replace("_", " ")}</td><td>{report.extensions?.[key]?.model_type ?? "—"}</td><td>{extensionSummary(key)}</td></tr>)}</tbody></table></div>
          <p className="text-sm text-amber-900 mt-3">{report.warning}</p>
        </Card>}
      </>}

      <ConfirmDialog
        open={revokeTarget !== null}
        title="Revoke device"
        message={`Revoke "${revokeTarget?.name}" and permanently delete its readings and alerts? This cannot be undone.`}
        confirmLabel="Revoke & erase"
        danger
        onConfirm={() => {
          if (!revokeTarget) return;
          const target = revokeTarget;
          setRevokeTarget(null);
          action(async () => {
            await api(`devices/${target.id}`, "DELETE");
            if (credential?.id === target.id) setCredential(null);
            setSafety(await api("safety"));
          });
        }}
        onCancel={() => setRevokeTarget(null)}
      />
    </div>
  );
}