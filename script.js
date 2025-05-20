const apiKey = 'YOUR_OPENWEATHER_API_KEY'; // 🔑 Replace with your OpenWeather API key
let chartInstance = null;

// Fetch weather by city name or passed city
async function getWeather(city = null) {
  const cityInput = city || document.getElementById('cityInput').value.trim();
  if (!cityInput) return;

  const currentURL = `https://api.openweathermap.org/data/2.5/weather?q=${cityInput}&appid=${apiKey}&units=metric`;
  const forecastURL = `https://api.openweathermap.org/data/2.5/forecast?q=${cityInput}&appid=${apiKey}&units=metric`;

  try {
    const [currentRes, forecastRes] = await Promise.all([fetch(currentURL), fetch(forecastURL)]);
    const currentData = await currentRes.json();
    const forecastData = await forecastRes.json();

    if (currentData.cod === 200) {
      document.getElementById('errorMsg').classList.add('hidden');

      document.getElementById('cityName').textContent = `${currentData.name}, ${currentData.sys.country}`;
      document.getElementById('description').textContent = currentData.weather[0].description;
      document.getElementById('weatherIcon').src = `https://openweathermap.org/img/wn/${currentData.weather[0].icon}@2x.png`;
      document.getElementById('temperature').textContent = `${currentData.main.temp}°C`;
      document.getElementById('weatherResult').classList.remove('hidden');

      renderForecastChart(forecastData);
    } else {
      showError('City not found');
    }
  } catch (error) {
    showError('Unable to fetch weather data');
  }
}

// Get weather from user's location
function getLocationWeather() {
  if ('geolocation' in navigator) {
    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.name) getWeather(data.name);
    });
  } else {
    showError('Geolocation not supported');
  }
}

// Render 5-day forecast chart
function renderForecastChart(forecastData) {
  const forecast = forecastData.list.filter((_, i) => i % 8 === 0); // Every ~24h
  const labels = forecast.map(item => new Date(item.dt_txt).toLocaleDateString());
  const temps = forecast.map(item => item.main.temp);

  if (chartInstance) chartInstance.destroy();

  const ctx = document.getElementById('forecastChart').getContext('2d');
  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Temp (°C)',
        data: temps,
        backgroundColor: 'rgba(99, 102, 241, 0.2)',
        borderColor: 'rgba(99, 102, 241, 1)',
        borderWidth: 2,
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false }
      }
    }
  });

  document.getElementById('forecastContainer').classList.remove('hidden');
}

// Toggle Dark/Light Mode
function toggleTheme() {
  const body = document.getElementById('body');
  const toggle = document.getElementById('themeToggle');
  const isDark = body.classList.toggle('bg-gray-900');
  body.classList.toggle('text-white');
  toggle.textContent = isDark ? '☀️' : '🌙';
}

// Save to favorite cities
function saveFavoriteCity() {
  const city = document.getElementById('cityInput').value.trim();
  if (!city) return;

  let favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
  if (!favorites.includes(city)) {
    favorites.push(city);
    localStorage.setItem('favorites', JSON.stringify(favorites));
    displayFavorites();
  }
}

// Load favorite cities
function displayFavorites() {
  const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
  const list = document.getElementById('favoriteCities');
  list.innerHTML = '';
  favorites.forEach(city => {
    const li = document.createElement('li');
    li.textContent = city;
    li.classList.add('cursor-pointer', 'hover:underline');
    li.onclick = () => getWeather(city);
    list.appendChild(li);
  });
}

// Show error message
function showError(msg) {
  const err = document.getElementById('errorMsg');
  err.textContent = msg;
  err.classList.remove('hidden');
}

// Initialize
displayFavorites();
