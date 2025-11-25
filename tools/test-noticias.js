const axios = require('axios');

const BASE = process.env.API_URL || 'http://localhost:3000/api';

(async () => {
  try {
    console.log('Probando GET', `${BASE}/noticias`);
    const res = await axios.get(`${BASE}/noticias`, { timeout: 5000 });
    console.log('Status:', res.status);
    console.log('Body sample:', Array.isArray(res.data?.data) ? `${res.data.data.length} items` : JSON.stringify(res.data).slice(0, 200));
  } catch (err) {
    console.error('Error al probar /noticias:', err.message || err);
    if (err.response) {
      console.error('Response status:', err.response.status, 'data:', err.response.data);
    }
  }
})();
