require('dotenv').config();
// Apply default headers to all axios HTTP requests
const axios = require('axios');
axios.defaults.headers.common['sec-fetch-site'] = 'same-origin';
axios.defaults.headers.common['user-agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36';

const express = require('express');
const { fetchAndSaveData } = require('./services/fetcher');
const { syncAllUbigeos } = require('./services/ubigeos');

const app = express();
const POLLING_INTERVAL = process.env.POLLING_INTERVAL || 10; // seconds
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

console.log('╔════════════════════════════════════════════════════╗');
console.log('║   Electoral Results Tracker - Peru (ONPE)          ║');
console.log('║   Guardando histórico de resultados electorales    ║');
console.log('╚════════════════════════════════════════════════════╝\n');

console.log(`Configuration:`);
console.log(`  API Base URL: ${process.env.API_BASE_URL}`);
console.log(`  Database: ${process.env.DB_PATH}`);
console.log(`  Polling interval: ${POLLING_INTERVAL} seconds`);
console.log(`  Server port: ${PORT}\n`);

// ============ ROUTES ============

/**
 * POST /api/sync-ubigeos - Sync all ubigeos (departamentos, provincias, distritos)
 */
app.post('/api/sync-ubigeos', async (req, res) => {
  try {
    const result = await syncAllUbigeos();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/health - Health check
 */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Electoral Results Tracker is running' });
});

// ============ POLLING ============

// Initial fetch on startup
console.log('🚀 Starting initial data fetch...');
fetchAndSaveData();

// Schedule periodic checks
console.log(`⏰ Scheduled to run every ${POLLING_INTERVAL} second(s)\n`);

setInterval(() => {
  fetchAndSaveData();
}, POLLING_INTERVAL * 1000);

// ============ START SERVER ============

app.listen(PORT, () => {
  console.log(`✓ Server running at http://localhost:${PORT}`);
  console.log(`✓ Endpoint: POST /api/sync-ubigeos - Sync ubigeos`);
  console.log(`✓ Endpoint: GET /api/health - Health check`);
  console.log(`✓ Application is running. Press Ctrl+C to stop.\n`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n👋 Shutting down gracefully...');
  process.exit(0);
});
