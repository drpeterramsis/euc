import { useState, useEffect } from 'react';
import { 
  Compass, 
  Calendar,
  RefreshCw,
  Droplets,
  Wind,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface WeatherData {
  current: {
    temp: number;
    feelsLike: number;
    humidity: number;
    windSpeed: number;
    precipitation: number;
    weatherCode: number;
    description: string;
  };
  daily: Array<{
    dayName: string;
    dateStr: string;
    dateLabel: string;
    tempMax: number;
    tempMin: number;
    weatherCode: number;
    precipProb: number;
    description: string;
  }>;
}

// Map WMO weather codes to internal animated weather keys
function getWeatherKey(code: number): 'Sunny' | 'PartlyCloudy' | 'Cloudy' | 'Rainy' | 'Stormy' | 'Snowy' {
  if (code === 0) return 'Sunny';
  if (code === 1 || code === 2) return 'PartlyCloudy';
  if (code === 3) return 'Cloudy';
  if (code >= 51 && code <= 57) return 'Rainy';
  if (code >= 61 && code <= 67) return 'Rainy';
  if (code >= 71 && code <= 77) return 'Snowy';
  if (code >= 80 && code <= 82) return 'Rainy';
  if (code >= 95 && code <= 99) return 'Stormy';
  return 'Cloudy';
}

function getWeatherDescription(code: number): string {
  if (code === 0) return 'Sunny';
  if (code === 1 || code === 2) return 'Partly Cloudy';
  if (code === 3) return 'Cloudy';
  if (code >= 51 && code <= 57) return 'Light Drizzle';
  if (code >= 61 && code <= 67) return 'Rainy';
  if (code >= 71 && code <= 77) return 'Snowy';
  if (code >= 80 && code <= 82) return 'Rain Showers';
  if (code >= 95 && code <= 99) return 'Thunderstorm';
  return 'Cloudy';
}

const FALLBACK_WEATHER: WeatherData = {
  current: {
    temp: 23,
    feelsLike: 23,
    humidity: 56,
    windSpeed: 12,
    precipitation: 0,
    weatherCode: 1,
    description: 'Partly Cloudy'
  },
  daily: [
    { dayName: 'Today', dateStr: 'Tue', dateLabel: '23 Jun', tempMax: 29, tempMin: 19, weatherCode: 1, precipProb: 8, description: 'Partly Cloudy' },
    { dayName: 'Wednesday', dateStr: 'Wed', dateLabel: '24 Jun', tempMax: 31, tempMin: 18, weatherCode: 0, precipProb: 0, description: 'Sunny' },
    { dayName: 'Thursday', dateStr: 'Thu', dateLabel: '25 Jun', tempMax: 33, tempMin: 19, weatherCode: 0, precipProb: 5, description: 'Sunny' },
    { dayName: 'Friday', dateStr: 'Fri', dateLabel: '26 Jun', tempMax: 34, tempMin: 19, weatherCode: 0, precipProb: 0, description: 'Sunny' },
    { dayName: 'Saturday', dateStr: 'Sat', dateLabel: '27 Jun', tempMax: 36, tempMin: 21, weatherCode: 1, precipProb: 12, description: 'Partly Cloudy' },
    { dayName: 'Sunday', dateStr: 'Sun', dateLabel: '28 Jun', tempMax: 37, tempMin: 22, weatherCode: 1, precipProb: 18, description: 'Partly Cloudy' },
    { dayName: 'Monday', dateStr: 'Mon', dateLabel: '29 Jun', tempMax: 36, tempMin: 22, weatherCode: 61, precipProb: 56, description: 'Rainy' },
  ]
};

// Custom rendered and animated components with styled inline keyframes
const AnimatedWeatherIcon = ({ weatherCode, size = "large" }: { weatherCode: number; size?: "large" | "small" }) => {
  const key = getWeatherKey(weatherCode);
  const sizeClass = size === "large" ? "w-16 h-16" : "w-8 h-8";

  // Sunny state SVG
  if (key === 'Sunny') {
    return (
      <div className={`relative ${sizeClass} flex items-center justify-center animate-[float_4s_easeInOut_infinite]`}>
        <svg className="w-full h-full text-amber-500 animate-[spin_20s_linear_infinite]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="5" fill="currentColor" className="text-amber-400" />
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
        </svg>
      </div>
    );
  }

  // Partly Cloudy state SVG
  if (key === 'PartlyCloudy') {
    return (
      <div className={`relative ${sizeClass} flex items-center justify-center animate-[float_4s_easeInOut_infinite]`}>
        {/* Peaking Sun */}
        <svg className="absolute -top-1 -right-1 w-[55%] h-[55%] text-amber-500 animate-[spin_25s_linear_infinite]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="5" fill="currentColor" className="text-amber-400" />
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2" />
        </svg>
        {/* Soft Front Cloud */}
        <svg className="absolute bottom-0 left-0 w-[80%] h-[80%] text-slate-300 drop-shadow-[0_4px_6px_rgba(0,0,0,0.3)]" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.5">
          <path d="M17.5 19A3.5 3.5 0 0 0 21 15.5c0-1.74-1.28-3.18-2.95-3.44A5.5 5.5 0 0 0 8 11.5c0 .34.03.67.09 1C5.97 12.82 4.5 14.49 4.5 16.5A3.5 3.5 0 0 0 8 20h9.5z" />
        </svg>
      </div>
    );
  }

  // Rain state SVG
  if (key === 'Rainy') {
    return (
      <div className={`relative ${sizeClass} flex flex-col items-center justify-center animate-[float_4s_easeInOut_infinite]`}>
        <svg className="w-[80%] h-[65%] text-slate-400" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.5">
          <path d="M17.5 19A3.5 3.5 0 0 0 21 15.5c0-1.74-1.28-3.18-2.95-3.44A5.5 5.5 0 0 0 8 11.5c0 .34.03.67.09 1C5.97 12.82 4.5 14.49 4.5 16.5A3.5 3.5 0 0 0 8 20h9.5z" />
        </svg>
        {/* Animated Rain drops */}
        <div className="absolute bottom-0 w-[60%] h-[30%] flex justify-around px-0.5 overflow-hidden">
          <span className="w-[2px] h-3 bg-sky-400 rounded-full animate-[rain_0.8s_linear_infinite]" style={{ animationDelay: '0s' }}></span>
          <span className="w-[2px] h-3 bg-sky-400 rounded-full animate-[rain_0.8s_linear_infinite]" style={{ animationDelay: '0.25s' }}></span>
          <span className="w-[2px] h-3 bg-sky-400 rounded-full animate-[rain_0.8s_linear_infinite]" style={{ animationDelay: '0.5s' }}></span>
        </div>
      </div>
    );
  }

  // Storm state SVG
  if (key === 'Stormy') {
    return (
      <div className={`relative ${sizeClass} flex items-center justify-center animate-[float_4s_easeInOut_infinite]`}>
        <svg className="w-[80%] h-[70%] text-slate-500" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.5">
          <path d="M17.5 19A3.5 3.5 0 0 0 21 15.5c0-1.74-1.28-3.18-2.95-3.44A5.5 5.5 0 0 0 8 11.5c0 .34.03.67.09 1C5.97 12.82 4.5 14.49 4.5 16.5A3.5 3.5 0 0 0 8 20h9.5z" />
        </svg>
        <svg className="absolute bottom-0 text-yellow-400 w-[35%] h-[45%] animate-[lightning_2s_steps(2)_infinite]" viewBox="0 0 24 24" fill="currentColor">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
      </div>
    );
  }

  // Snowy state SVG
  if (key === 'Snowy') {
    return (
      <div className={`relative ${sizeClass} flex items-center justify-center animate-[float_5s_easeInOut_infinite]`}>
        <svg className="w-full h-full text-sky-200 animate-[spin_40s_linear_infinite]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="2" x2="12" y2="22" stroke="currentColor" strokeWidth="2" />
          <line x1="17" y1="5" x2="7" y2="19" stroke="currentColor" strokeWidth="2" />
          <line x1="19" y1="12" x2="5" y2="12" stroke="currentColor" strokeWidth="2" />
          <line x1="17" y1="19" x2="7" y2="5" stroke="currentColor" strokeWidth="2" />
        </svg>
      </div>
    );
  }

  // General Cloudy SVG
  return (
    <div className={`relative ${sizeClass} flex items-center justify-center animate-[float_4s_easeInOut_infinite]`}>
      <svg className="w-[85%] h-[85%] text-slate-400" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.5">
        <path d="M17.5 19A3.5 3.5 0 0 0 21 15.5c0-1.74-1.28-3.18-2.95-3.44A5.5 5.5 0 0 0 8 11.5c0 .34.03.67.09 1C5.97 12.82 4.5 14.49 4.5 16.5A3.5 3.5 0 0 0 8 20h9.5z" />
      </svg>
    </div>
  );
};

export default function WeatherForecast() {
  const [weather, setWeather] = useState<WeatherData>(FALLBACK_WEATHER);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'temp' | 'precip' | 'wind'>('temp');
  const [mobileExpanded, setMobileExpanded] = useState<boolean>(false);

  const fetchWeather = async () => {
    try {
      setLoading(true);
      // Latitude and longitude for Prague, Czechia
      const res = await fetch(
        'https://api.open-meteo.com/v1/forecast?latitude=50.0755&longitude=14.4378&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Europe%2FPrague'
      );
      if (!res.ok) throw new Error('API request failed');
      const data = await res.json();
      
      const currentCode = data.current.weather_code;
      const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      
      const dailyMapped = data.daily.time.map((timeStr: string, index: number) => {
        const dateObj = new Date(timeStr);
        const dayIdx = dateObj.getDay();
        const rawDayName = index === 0 ? 'Today' : dateObj.toLocaleDateString('en-US', { weekday: 'long' });
        const dayOfMonth = dateObj.getDate();
        const monthShort = dateObj.toLocaleDateString('en-US', { month: 'short' });
        
        return {
          dayName: rawDayName,
          dateStr: weekdays[dayIdx],
          dateLabel: `${dayOfMonth} ${monthShort}`,
          tempMax: Math.round(data.daily.temperature_2m_max[index]),
          tempMin: Math.round(data.daily.temperature_2m_min[index]),
          weatherCode: data.daily.weather_code[index],
          precipProb: data.daily.precipitation_probability_max[index] ?? 0,
          description: getWeatherDescription(data.daily.weather_code[index])
        };
      });

      setWeather({
        current: {
          temp: Math.round(data.current.temperature_2m),
          feelsLike: Math.round(data.current.apparent_temperature),
          humidity: data.current.relative_humidity_2m,
          windSpeed: Math.round(data.current.wind_speed_10m),
          precipitation: data.current.precipitation,
          weatherCode: currentCode,
          description: getWeatherDescription(currentCode)
        },
        daily: dailyMapped
      });
    } catch (err) {
      console.warn('Weather service query failed, loading baseline data:', err);
      setWeather(FALLBACK_WEATHER);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather();
  }, []);

  return (
    <div className="mb-2 w-full">
      {/* CSS Animation Keyframes Injector */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-3px); }
        }
        @keyframes rain {
          0% { transform: translateY(-3px); opacity: 0; }
          40% { opacity: 1; }
          100% { transform: translateY(7px); opacity: 0; }
        }
        @keyframes lightning {
          0%, 90%, 100% { opacity: 0.1; }
          95% { opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-5px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Mobile Slim Widget View (Click to toggle expansion) */}
      <div 
        onClick={() => setMobileExpanded(!mobileExpanded)}
        className="md:hidden block bg-gradient-to-r from-[#0b1120] to-[#0f172a] text-white rounded-2xl border border-slate-800 shadow-lg p-3 cursor-pointer hover:border-slate-700 transition-all duration-300 active:scale-[0.99]"
      >
        <div className="flex items-center justify-between gap-3">
          {/* Weather Icon & Temperature */}
          <div className="flex items-center gap-3">
            <div className="p-1.5 w-11 h-11 bg-slate-900/80 rounded-xl border border-slate-800/85 flex items-center justify-center flex-shrink-0">
              <AnimatedWeatherIcon weatherCode={weather.current.weatherCode} size="small" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-baseline leading-none">
                <span className="text-lg font-extrabold tracking-tight">{weather.current.temp}</span>
                <span className="text-xs font-bold text-amber-500 ml-0.5">°C</span>
              </div>
              <span className="text-[10px] text-slate-400 font-semibold mt-0.5">{weather.current.description}</span>
            </div>
          </div>

          {/* Location & Pulse Badge */}
          <div className="flex flex-col items-end text-right">
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-bold tracking-tight text-white">Prague, CZ</span>
            </div>
            <span className="text-[9px] text-slate-500 font-semibold mt-0.5">Feels {weather.current.feelsLike}°C</span>
          </div>

          {/* Chevron Indicator */}
          <div className="pl-1.5 border-l border-slate-800/80 flex items-center h-8">
            {mobileExpanded ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400 animate-pulse" />
            )}
          </div>
        </div>

        {/* Nested Expanded Content for Mobile - beautifully compact and matching styling */}
        {mobileExpanded && (
          <div className="mt-3 pt-3 border-t border-slate-800/60 space-y-3 animate-[fadeIn_0.2s_ease-out]">
            {/* Quick stats row */}
            <div className="grid grid-cols-3 gap-2 text-center bg-slate-900/50 p-2 rounded-xl border border-slate-800/45">
              <div>
                <span className="text-[8px] uppercase tracking-wider text-slate-500 font-extrabold block">Range</span>
                <span className="text-[10px] font-bold text-slate-200">{weather.daily[0]?.tempMax}° / {weather.daily[0]?.tempMin}°</span>
              </div>
              <div>
                <span className="text-[8px] uppercase tracking-wider text-slate-500 font-extrabold block">Humidity</span>
                <span className="text-[10px] font-bold text-slate-200 flex items-center justify-center gap-0.5">
                  <Droplets className="w-2.5 h-2.5 text-blue-400" />
                  {weather.current.humidity}%
                </span>
              </div>
              <div>
                <span className="text-[8px] uppercase tracking-wider text-slate-500 font-extrabold block">Wind Speed</span>
                <span className="text-[10px] font-bold text-slate-200 flex items-center justify-center gap-0.5">
                  <Wind className="w-2.5 h-2.5 text-teal-400" />
                  {weather.current.windSpeed} km/h
                </span>
              </div>
            </div>

            {/* Compact 4-Day mini forecast for mobile */}
            <div className="space-y-1.5">
              <p className="text-[8px] font-extrabold tracking-widest uppercase text-slate-400 px-0.5">Upcoming Days</p>
              <div className="grid grid-cols-4 gap-1.5">
                {weather.daily.slice(0, 4).map((day, idx) => (
                  <div key={idx} className="bg-slate-900/40 border border-slate-850/60 p-2 rounded-xl flex flex-col items-center">
                    <span className="text-[9px] font-bold text-slate-400">{idx === 0 ? "Today" : day.dateStr}</span>
                    <div className="my-1">
                      <AnimatedWeatherIcon weatherCode={day.weatherCode} size="small" />
                    </div>
                    <span className="text-[10px] font-black text-slate-200">{day.tempMax}°</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Desktop Detailed Forecast View */}
      <div className="hidden md:block bg-[#0b1120] text-white rounded-2xl border border-slate-800 shadow-xl overflow-hidden transition-all duration-300">
        {/* Header with City & Pulsing live badge */}
        <div className="p-5 pb-3 flex items-center justify-between border-b border-slate-850">
          <div className="flex items-center gap-2">
            <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight text-white">Prague, Czechia</h3>
              <p className="text-[9px] text-slate-400 font-bold tracking-widest uppercase">REAL-TIME SCIENTIFIC FORECAST</p>
            </div>
          </div>
          <button 
            onClick={fetchWeather}
            disabled={loading}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Refresh forecast"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="p-5 md:p-6 pb-6">
          {/* Main Banner Block */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Left Large Current block */}
            <div className="md:col-span-6 flex items-center gap-5">
              <div className="relative p-3 w-20 h-20 bg-slate-900/60 rounded-2xl border border-slate-800 shadow-inner flex items-center justify-center flex-shrink-0">
                <AnimatedWeatherIcon weatherCode={weather.current.weatherCode} size="large" />
              </div>
              
              <div>
                <div className="flex items-start">
                  <span className="text-4xl font-black tracking-tighter text-slate-50">{weather.current.temp}</span>
                  <span className="text-lg font-bold text-amber-500 mt-0.5 ml-0.5">°C</span>
                </div>
                <p className="text-sm font-black text-slate-200 capitalize mt-0.5 leading-none">
                  {weather.current.description}
                </p>
                <p className="text-[10px] font-bold text-slate-400 font-sans mt-1">
                  Feels like <strong className="text-slate-350 font-bold">{weather.current.feelsLike}°C</strong>
                </p>
              </div>
            </div>

            {/* Right Parameters stats with Tab Switchers */}
            <div className="md:col-span-6 space-y-3.5 p-4 bg-slate-900/30 rounded-xl border border-slate-800">
              <div className="flex border-b border-slate-800 pb-2">
                <button 
                  onClick={() => setActiveTab('temp')} 
                  className={`flex-1 text-center text-[10px] font-bold uppercase tracking-wider pb-1 transition-all ${activeTab === 'temp' ? 'text-amber-500 border-b-2 border-amber-550 font-extrabold' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  Temperature
                </button>
                <button 
                  onClick={() => setActiveTab('precip')} 
                  className={`flex-1 text-center text-[10px] font-bold uppercase tracking-wider pb-1 transition-all ${activeTab === 'precip' ? 'text-amber-500 border-b-2 border-amber-550 font-extrabold' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  Precipitation
                </button>
                <button 
                  onClick={() => setActiveTab('wind')} 
                  className={`flex-1 text-center text-[10px] font-bold uppercase tracking-wider pb-1 transition-all ${activeTab === 'wind' ? 'text-amber-500 border-b-2 border-amber-550 font-extrabold' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  Wind
                </button>
              </div>

              {activeTab === 'temp' && (
                <div className="grid grid-cols-2 gap-3 pt-0.5">
                  <div className="space-y-1">
                    <span className="text-[9px] font-extrabold tracking-widest uppercase text-slate-500 block">Today's Range</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xs font-black text-slate-100">{weather.daily[0]?.tempMax}°C</span>
                      <span className="text-xs text-slate-500 font-semibold">/</span>
                      <span className="text-xs text-slate-400 font-bold">{weather.daily[0]?.tempMin}°C</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-extrabold tracking-widest uppercase text-slate-500 block">RH Humidity</span>
                    <span className="text-xs font-black text-slate-100 flex items-center gap-1">
                      <Droplets className="w-3 h-3 text-blue-400 flex-shrink-0 animate-pulse" />
                      {weather.current.humidity}%
                    </span>
                  </div>
                </div>
              )}

              {activeTab === 'precip' && (
                <div className="grid grid-cols-2 gap-3 pt-0.5">
                  <div className="space-y-1">
                    <span className="text-[9px] font-extrabold tracking-widest uppercase text-slate-500 block">Precip Amount</span>
                    <span className="text-xs font-black text-slate-100">{weather.current.precipitation} mm</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-extrabold tracking-widest uppercase text-slate-500 block">Probability</span>
                    <span className="text-xs font-black text-sky-400">{weather.daily[0]?.precipProb}%</span>
                  </div>
                </div>
              )}

              {activeTab === 'wind' && (
                <div className="grid grid-cols-2 gap-3 pt-0.5">
                  <div className="space-y-1">
                    <span className="text-[9px] font-extrabold tracking-widest uppercase text-slate-500 block">Velocity</span>
                    <span className="text-xs font-black text-slate-100 flex items-center gap-1">
                      <Wind className="w-3 h-3 text-teal-400 flex-shrink-0" />
                      {weather.current.windSpeed} km/h
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-extrabold tracking-widest uppercase text-slate-500 block">Direction</span>
                    <span className="text-xs font-black text-slate-100 flex items-center gap-1">
                      <Compass className="w-3 h-3 text-teal-500 flex-shrink-0 animate-pulse" />
                      ENE
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 7-Day Forecast Grid */}
          <div className="mt-6 pt-5 border-t border-slate-850">
            <p className="text-[10px] font-bold tracking-widest uppercase text-slate-400 mb-3.5 flex items-center gap-1.5 leading-none">
              <Calendar className="w-3.5 h-3.5 text-amber-500" />
              Upcoming Prague Forecast
            </p>
            
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
              {weather.daily.map((day, idx) => {
                return (
                  <div 
                    key={idx} 
                    className={`p-2.5 py-3 rounded-xl border flex flex-col items-center justify-between transition-all duration-300 ${idx === 0 ? 'bg-slate-900/80 border-amber-500/30 ring-1 ring-amber-550/15' : 'bg-slate-900/35 border-slate-850/60 hover:bg-slate-900/60 hover:border-slate-800'}`}
                  >
                    <span className="text-[10px] font-extrabold text-slate-400 leading-none">{day.dateStr}</span>
                    <span className="text-[8px] font-bold text-slate-500 mt-1 font-sans">{day.dateLabel}</span>
                    
                    <div className="my-2.5">
                      <AnimatedWeatherIcon weatherCode={day.weatherCode} size="small" />
                    </div>
                    
                    <div className="flex flex-col items-center">
                      <span className="text-xs font-bold text-slate-100">{day.tempMax}°</span>
                      <span className="text-[9px] font-semibold text-slate-500 mt-0.5">{day.tempMin}°</span>
                    </div>

                    {day.precipProb > 5 ? (
                      <span className="text-[8px] font-extrabold text-sky-400 mt-1.5 font-mono">{day.precipProb}%</span>
                    ) : (
                      <span className="text-[8px] font-semibold text-transparent mt-1.5 font-mono">0%</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
