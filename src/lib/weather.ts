export interface WeatherNow {
  temp: number;
  code: number;
  wind: number;
  high: number;
  low: number;
  city: string;
}

const WMO: Record<number, { es: string; en: string }> = {
  0: { es: "Despejado", en: "Clear" },
  1: { es: "Mayormente despejado", en: "Mostly clear" },
  2: { es: "Parcialmente nublado", en: "Partly cloudy" },
  3: { es: "Nublado", en: "Overcast" },
  45: { es: "Niebla", en: "Fog" },
  48: { es: "Niebla helada", en: "Rime fog" },
  51: { es: "Llovizna", en: "Drizzle" },
  61: { es: "Lluvia", en: "Rain" },
  71: { es: "Nieve", en: "Snow" },
  80: { es: "Chubascos", en: "Showers" },
  95: { es: "Tormenta", en: "Thunder" },
};

export function weatherLabel(code: number, locale: "es" | "en") {
  const exact = WMO[code];
  if (exact) return exact[locale];
  const base = Math.floor(code / 10) * 10;
  return WMO[base]?.[locale] ?? (locale === "es" ? "Cielo mixto" : "Mixed skies");
}

export async function geocodeCity(name: string) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1&language=es&format=json`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = (await res.json()) as {
    results?: { latitude: number; longitude: number; name: string; country?: string }[];
  };
  const hit = data.results?.[0];
  if (!hit) return null;
  return { lat: hit.latitude, lon: hit.longitude, label: hit.country ? `${hit.name}` : hit.name };
}

export async function fetchWeather(lat: number, lon: number, city: string): Promise<WeatherNow> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min&timezone=auto`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("weather");
  const data = (await res.json()) as {
    current: { temperature_2m: number; weather_code: number; wind_speed_10m: number };
    daily: { temperature_2m_max: number[]; temperature_2m_min: number[] };
  };
  return {
    temp: Math.round(data.current.temperature_2m),
    code: data.current.weather_code,
    wind: Math.round(data.current.wind_speed_10m),
    high: Math.round(data.daily.temperature_2m_max[0] ?? data.current.temperature_2m),
    low: Math.round(data.daily.temperature_2m_min[0] ?? data.current.temperature_2m),
    city,
  };
}
