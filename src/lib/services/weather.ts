import type { WeatherInfo, WeatherForecast } from "@/lib/types";

// ============ WEATHER SERVICE ============
// Uses Open-Meteo API (free, no key required) with fallback to mock data

export async function getWeather(lat: number, lng: number, locationName: string): Promise<WeatherInfo> {
  try {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=Asia%2FDhaka&forecast_days=7`,
      { next: { revalidate: 1800 } } // Cache for 30 minutes
    );

    if (!response.ok) throw new Error("Weather API failed");

    const data = await response.json();
    const current = data.current;
    const daily = data.daily;

    const forecasts: WeatherForecast[] = daily.time.map((date: string, i: number) => ({
      date,
      tempMax: daily.temperature_2m_max[i],
      tempMin: daily.temperature_2m_min[i],
      description: getWeatherDescription(daily.weather_code[i]),
      icon: getWeatherIcon(daily.weather_code[i]),
      precipitation: daily.precipitation_sum[i],
    }));

    return {
      location: locationName,
      temperature: Math.round(current.temperature_2m),
      feelsLike: Math.round(current.apparent_temperature),
      humidity: current.relative_humidity_2m,
      description: getWeatherDescription(current.weather_code),
      icon: getWeatherIcon(current.weather_code),
      windSpeed: Math.round(current.wind_speed_10m),
      forecast: forecasts,
      dataStatus: "LIVE",
    };
  } catch {
    return getMockWeather(locationName);
  }
}

function getWeatherDescription(code: number): string {
  const descriptions: Record<number, string> = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Foggy",
    48: "Rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    71: "Slight snow",
    73: "Moderate snow",
    75: "Heavy snow",
    80: "Rain showers",
    81: "Moderate showers",
    82: "Violent showers",
    95: "Thunderstorm",
    96: "Thunderstorm with hail",
    99: "Thunderstorm with heavy hail",
  };
  return descriptions[code] || "Unknown";
}

function getWeatherIcon(code: number): string {
  if (code === 0 || code === 1) return "☀️";
  if (code === 2) return "⛅";
  if (code === 3) return "☁️";
  if (code >= 45 && code <= 48) return "🌫️";
  if (code >= 51 && code <= 67) return "🌧️";
  if (code >= 71 && code <= 77) return "❄️";
  if (code >= 80 && code <= 82) return "🌦️";
  if (code >= 95) return "⛈️";
  return "🌤️";
}

function getMockWeather(locationName: string): WeatherInfo {
  // Generate dates relative to today so they never go stale
  const today = new Date();
  const makeDate = (offset: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() + offset);
    return d.toISOString().slice(0, 10);
  };
  return {
    location: locationName,
    temperature: 30,
    feelsLike: 34,
    humidity: 75,
    description: "Partly cloudy",
    icon: "⛅",
    windSpeed: 12,
    forecast: [
      { date: makeDate(0), tempMax: 32, tempMin: 26, description: "Partly cloudy", icon: "⛅", precipitation: 2 },
      { date: makeDate(1), tempMax: 31, tempMin: 25, description: "Rain showers", icon: "🌦️", precipitation: 8 },
      { date: makeDate(2), tempMax: 30, tempMin: 25, description: "Thunderstorm", icon: "⛈️", precipitation: 15 },
      { date: makeDate(3), tempMax: 29, tempMin: 24, description: "Moderate rain", icon: "🌧️", precipitation: 12 },
      { date: makeDate(4), tempMax: 31, tempMin: 25, description: "Partly cloudy", icon: "⛅", precipitation: 3 },
      { date: makeDate(5), tempMax: 32, tempMin: 26, description: "Mainly clear", icon: "☀️", precipitation: 0 },
      { date: makeDate(6), tempMax: 33, tempMin: 26, description: "Clear sky", icon: "☀️", precipitation: 0 },
    ],
    dataStatus: "ESTIMATED",
  };
}

export function getBestTravelMonths(): { month: string; rating: number; description: string }[] {
  return [
    { month: "January", rating: 5, description: "Cool and dry, perfect for exploring" },
    { month: "February", rating: 5, description: "Pleasant weather, great for beaches" },
    { month: "March", rating: 4, description: "Warming up, still comfortable" },
    { month: "April", rating: 3, description: "Hot, Pohela Boishakh celebrations" },
    { month: "May", rating: 2, description: "Very hot, pre-monsoon" },
    { month: "June", rating: 2, description: "Monsoon begins, heavy rainfall" },
    { month: "July", rating: 1, description: "Peak monsoon, flooding possible" },
    { month: "August", rating: 2, description: "Monsoon continues" },
    { month: "September", rating: 3, description: "Monsoon receding" },
    { month: "October", rating: 4, description: "Post-monsoon, lush greenery" },
    { month: "November", rating: 5, description: "Cool and dry, ideal season" },
    { month: "December", rating: 5, description: "Winter, best time to visit" },
  ];
}
