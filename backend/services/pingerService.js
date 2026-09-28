const cron = require('node-cron');
const axios = require('axios');

/**
 * Pinger Service for BUG-01: Render Backend Sleep / Cold-Start
 * Keeps the backend instance warm by making a periodic lightweight GET request to /health.
 * Render free tier sleeps after 15 minutes of inactivity; we ping every 14 minutes.
 */

const getHealthUrl = () => {
  if (process.env.RENDER_EXTERNAL_URL) {
    return `${process.env.RENDER_EXTERNAL_URL.replace(/\/$/, '')}/health`;
  }
  if (process.env.BACKEND_URL) {
    return `${process.env.BACKEND_URL.replace(/\/$/, '')}/health`;
  }
  const port = process.env.PORT || 8080;
  return `http://localhost:${port}/health`;
};

const pingHealth = async () => {
  const url = getHealthUrl();
  const startTime = Date.now();
  try {
    const response = await axios.get(url, {
      timeout: 5000,
      headers: { 'User-Agent': 'Render-KeepWarm-Pinger/1.0' }
    });
    const duration = Date.now() - startTime;
    console.log(`[Pinger] 🟢 Keep-warm ping to ${url} succeeded (${duration}ms) - Status: ${response.status}`);
    return { success: true, duration, status: response.status };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.warn(`[Pinger] ⚠️ Keep-warm ping to ${url} notice (${duration}ms):`, error.message);
    return { success: false, duration, error: error.message };
  }
};

const initPingerService = () => {
  const url = getHealthUrl();
  console.log(`[Pinger] Initializing Keep-Warm Pinger for: ${url}`);

  // Schedule ping every 14 minutes: '*/14 * * * *'
  cron.schedule('*/14 * * * *', async () => {
    await pingHealth();
  });

  // Perform an initial self-ping after 15 seconds to ensure instance is warm on startup
  setTimeout(() => {
    pingHealth();
  }, 15000);
};

module.exports = {
  initPingerService,
  pingHealth,
  getHealthUrl
};
