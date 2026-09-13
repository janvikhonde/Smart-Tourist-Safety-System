'use client'
import { useWeather } from '@/hooks/useWeather'
import Spinner from '@/components/shared/Spinner'

const MOCK_DAYS = [
  { day: 'Mon', icon: '⛅', hi: 34, lo: 24, rain: 10 },
  { day: 'Tue', icon: '☀️', hi: 36, lo: 25, rain: 5  },
  { day: 'Wed', icon: '🌩️', hi: 29, lo: 22, rain: 80 },
]

export default function WeatherWidget() {
  const { weather, loading } = useWeather()

  const days = weather?.forecast?.slice(0, 3).map((d, i) => ({
    day:  d.dayName.slice(0, 3),
    icon: d.icon,
    hi:   d.tempMax,
    lo:   d.tempMin,
    rain: d.rainChance,
  })) ?? MOCK_DAYS

  return (
    <div
      className="rounded-2xl p-4"
      style={{
        background: '#111d35',
        border: '1px solid rgba(56,189,248,0.1)',
      }}
    >
      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-syne font-bold text-white text-sm">Weather</h2>
        <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Aurangabad
        </div>
      </div>

      {/* Current temp */}
      {!loading && (
        <div className="flex items-center gap-3 mb-3">
          <span className="text-3xl">{weather?.icon ?? '⛅'}</span>
          <div>
            <p className="font-syne font-bold text-2xl text-white leading-none">
              {weather?.temp ?? 34}°C
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5 capitalize">
              {weather?.description ?? 'Partly Cloudy'}
            </p>
          </div>
          <div className="ml-auto text-right text-[10px] text-slate-600 space-y-0.5">
            <p>💧 {weather?.humidity ?? 62}%</p>
            <p>💨 {weather?.windSpeed ?? 14} km/h</p>
          </div>
        </div>
      )}

      {/* 3-day forecast */}
      {loading ? (
        <div className="flex justify-center py-4">
          <Spinner size="sm" />
        </div>
      ) : (
        <div
          className="grid grid-cols-3 gap-1.5 pt-3"
          style={{ borderTop: '1px solid rgba(56,189,248,0.08)' }}
        >
          {days.map((d, i) => (
            <div
              key={i}
              className="flex flex-col items-center gap-1.5 py-2 rounded-xl"
              style={{ background: 'rgba(56,189,248,0.04)' }}
            >
              <p className="text-[10px] text-slate-500 font-medium">{d.day}</p>
              <span className="text-lg">{d.icon}</span>
              <div className="text-[10px] text-center">
                <p className="text-white font-bold">{d.hi}°</p>
                <p className="text-slate-600">{d.lo}°</p>
              </div>
              {d.rain > 30 && (
                <span className="text-[9px] font-semibold" style={{ color: '#38bdf8' }}>
                  💧{d.rain}%
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}