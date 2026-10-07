import { useState, useEffect } from 'react'
import './App.css'

const POPULAR_CITIES = ['Delhi', 'Mumbai', 'Bangalore', 'New York', 'London', 'Tokyo', 'Paris', 'Dubai']

function App() {
  const [city, setCity] = useState('')
  const [units, setUnits] = useState('metric')
  const [weather, setWeather] = useState(null)
  const [forecast, setForecast] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [suggest, setSuggest] = useState([])

  const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY || 'YOUR_OPENWEATHER_API_KEY'
  const unitSymbol = units === 'metric' ? '°C' : '°F'

  const handleChange = (e) => {
    const val = e.target.value
    setCity(val)
    setSuggest(
      val.length > 1
        ? POPULAR_CITIES.filter(c => c.toLowerCase().startsWith(val.toLowerCase())).slice(0, 4)
        : []
    )
  }

  const handleSuggest = (name) => {
    setCity(name)
    setSuggest([])
    fetchWeatherForCity(name)
  }

  const fetchWeatherForCity = async (name, forceUnit = units) => {
    const query = name.trim()
    if (!query) return

    setLoading(true)
    setError(null)
    setWeather(null)
    setForecast([])

    try {
      const [cur, fc] = await Promise.all([
        fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(query)}&appid=${apiKey}&units=${forceUnit}`),
        fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(query)}&appid=${apiKey}&units=${forceUnit}`)
      ])

      const cdata = await cur.json()
      if (cdata.cod !== 200) throw new Error(cdata.message || 'City not found')

      setWeather({
        name: cdata.name,
        country: cdata.sys.country,
        temp: Math.round(cdata.main.temp),
        feels: Math.round(cdata.main.feels_like),
        condition: cdata.weather[0].main,
        description: cdata.weather[0].description,
        humidity: cdata.main.humidity,
        wind: cdata.wind.speed,
        pressure: cdata.main.pressure,
        visibility: (cdata.visibility / 1000).toFixed(1),
        icon: `https://openweathermap.org/img/wn/${cdata.weather[0].icon}@4x.png`
      })

      const f = fc.json().then(fd => {
        const daily = []
        const seen = new Set()
        fd.list.forEach(item => {
          const day = item.dt_txt.split(' ')[0]
          if (!seen.has(day) && daily.length < 5) {
            seen.add(day)
            daily.push({
              day: new Date(item.dt * 1000).toLocaleDateString(undefined, { weekday: 'short' }),
              icon: `https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png`,
              min: Math.round(item.main.temp_min),
              max: Math.round(item.main.temp_max),
              pop: Math.round(item.pop * 100)
            })
          }
        })
        setForecast(daily)
      })
      await f
    } catch (e) {
      setError(e.message === 'Not Found' ? 'City not found' : e.message || 'Failed to fetch')
    } finally {
      setLoading(false)
    }
  }

  const submit = (e) => {
    e.preventDefault()
    setSuggest([])
    fetchWeatherForCity(city)
  }

  useEffect(() => {
    if (weather) fetchWeatherForCity(weather.name, units)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [units])

  return (
    <div className="app">
      <div className="orb orb-1"></div>
      <div className="orb orb-2"></div>
      <div className="shell">
        <header className="header">
          <div className="brand">
            <div className="brand-mark">
              <svg className="brand-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 12a5.5 5.5 0 0 0-4.9 3H7a4 4 0 1 0 0 8h9.5a5.5 5.5 0 0 0 1-10.9 4 4 0 0 0-4.1-4A4.2 4.2 0 0 0 9.8 7 5.5 5.5 0 0 0 2 12.5a5.5 5.5 0 0 0 5.5 5.5H12a5.5 5.5 0 0 0 5.5-6Z"/></svg>
            </div>
            <div>
              <h1 className="brand-name">Forecastly</h1>
              <p className="brand-tag">Real-time weather insights</p>
            </div>
          </div>
          <div className="unit-toggle">
            <button className={units === 'metric' ? 'active' : ''} onClick={() => setUnits('metric')}>°C</button>
            <button className={units === 'imperial' ? 'active' : ''} onClick={() => setUnits('imperial')}>°F</button>
          </div>
        </header>

        <form className="search" onSubmit={submit} autoComplete="off">
          <svg className="search-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M10 4a6 6 0 0 1 4.6 9.7l4.4 4.4-1.4 1.4-4.4-4.4A6 6 0 1 1 10 4m0 2a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z"/></svg>
          <input className="search-input" value={city} onChange={handleChange} placeholder="Search city, e.g. Delhi" />
          {city && (
            <button type="button" className="clear-btn" onClick={() => { setCity(''); setWeather(null); setForecast([]); setError(null); setSuggest([]); }}>
              <svg viewBox="0 0 20 20" fill="currentColor"><path d="M10 1a9 9 0 1 0 9 9 9 9 0 0 0-9-9m3.5 11.6-1.4 1.4L10 11.4l-2.1 2.1-1.4-1.4L8.6 10 6.5 7.9l1.4-1.4L10 8.6l2.1-2.1 1.4 1.4L11.4 10Z"/></svg>
            </button>
          )}
          <button className="search-btn" disabled={loading}>
            {loading ? <span className="spinner"></span> : 'Search'}
          </button>
        </form>

        {suggest.length > 0 && (
          <div className="chips">
            {suggest.map(s => <button key={s} className="chip" onClick={() => handleSuggest(s)}>{s}</button>)}
          </div>
        )}

        <main className="content">
          {!weather && !loading && !error && (
            <section className="state-card welcome">
              <div className="state-emoji"><svg className="state-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M6 14a4 4 0 0 1 3.9-4 5 5 0 0 1 9.2 2 4 4 0 0 1-.1 8H7a4 4 0 0 1-1-7.9Zm6-10 1.4 3.5L17 9l-3.6 1.5L12 14l-1.4-3.5L7 9l3.6-1.5Z"/></svg></div>
              <h2 className="state-title">Find your forecast</h2>
              <p className="state-text">Search any city to see current conditions, feels-like, humidity, wind & 5-day outlook.</p>
              <div className="chips">
                {POPULAR_CITIES.slice(0, 4).map(c => <button key={c} className="chip" onClick={() => handleSuggest(c)}>{c}</button>)}
              </div>
            </section>
          )}

          {loading && (
            <section className="weather-card skeleton">
              <div className="sk sk-title"></div>
              <div className="sk sk-temp"></div>
              <div className="sk sk-line"></div>
              <div className="detail-grid">
                {[...Array(4)].map((_, i) => <div key={i} className="sk sk-stat"></div>)}
              </div>
            </section>
          )}

          {error && (
            <section className="state-card">
              <div className="state-emoji"><svg className="state-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2 1 21h22Zm0 4 7.5 13h-15ZM11 10h2v5h-2Zm0 6h2v2h-2Z"/></svg></div>
              <h2 className="state-title">Something went wrong</h2>
              <p className="state-text">{error}</p>
            </section>
          )}

          {weather && (
            <section className="weather-card">
              <header className="card-head">
                <div>
                  <h2 className="city-name">
                    <svg className="city-pin" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a7 7 0 0 1 7 7c0 5-7 13-7 13S5 14 5 9a7 7 0 0 1 7-7m0 2a5 5 0 0 0-5 5c0 3.6 5 9.8 5 9.8s5-6.2 5-9.8a5 5 0 0 0-5-5m0 2.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5Z"/></svg>
                    {weather.name} <span className="country">{weather.country}</span>
                  </h2>
                  <p className="local-time">{new Date().toLocaleString(undefined, { weekday: 'long', hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}</p>
                </div>
                <span className="condition-pill">{weather.description}</span>
              </header>

              <div className="hero">
                <img className="weather-icon" src={weather.icon} alt={weather.description} />
                <div className="temp-block">
                  <p className="temperature">
                    {weather.temp}<span className="unit">{unitSymbol}</span>
                  </p>
                  <p className="condition">{weather.condition}</p>
                  <p className="feels">Feels like {weather.feels}{unitSymbol}</p>
                </div>
              </div>

              <div className="detail-grid">
                <article className="stat">
                  <div className="stat-icon"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4M12 6a6 6 0 1 1 0 12 6 6 0 0 1 0-12Z"/></svg></div>
                  <span className="stat-label">Humidity</span>
                  <span className="stat-value">{weather.humidity}%</span>
                </article>
                <article className="stat">
                  <div className="stat-icon"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 10h12a4 4 0 0 1 0 8h-2v2h-2v-2H6v2H4v-2H4a4 4 0 0 1 0-8m0 2a2 2 0 0 0 0 4h12a2 2 0 0 0 0-4M14 2v6h-2V4l-3 3-1.4-1.4L13 2Z"/></svg></div>
                  <span className="stat-label">Wind</span>
                  <span className="stat-value">{weather.wind} {units === 'metric' ? 'm/s' : 'mph'}</span>
                </article>
                <article className="stat">
                  <div className="stat-icon"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 3h10v2H7Zm2 4h6v2H9Zm-4 4h14v2H5Zm-2 4h18v2H3Zm4 4h10v2H7Z"/></svg></div>
                  <span className="stat-label">Pressure</span>
                  <span className="stat-value">{weather.pressure} hPa</span>
                </article>
                <article className="stat">
                  <div className="stat-icon"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 2a7 7 0 0 1 7 7c0 4.4-3.6 8-7 8S2 13.4 2 9a7 7 0 0 1 7-7m0 2a5 5 0 0 0-5 5c0 3.3 2.7 6 5 6s5-2.7 5-6a5 5 0 0 0-5-5m10 12 2.9 3.1-1.4 1.4L17.6 17H13v-2h4.6l3-3.1 1.4 1.4Z"/></svg></div>
                  <span className="stat-label">Visibility</span>
                  <span className="stat-value">{weather.visibility} km</span>
                </article>
              </div>
            </section>
          )}

          {forecast.length > 0 && (
            <section className="forecast">
              <h3 className="forecast-title">5-Day Forecast</h3>
              <div className="forecast-row">
                {forecast.map(f => (
                  <article key={f.day} className="forecast-day">
                    <span className="forecast-name">{f.day}</span>
                    <img className="forecast-icon" src={f.icon} alt={f.day} />
                    <div className="forecast-temps">
                      <b>{f.max}{unitSymbol}</b>
                      <i>{f.min}{unitSymbol}</i>
                    </div>
                    {f.pop > 0 && <span className="forecast-pop">{f.pop}% rain</span>}
                  </article>
                ))}
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  )
}

export default App
