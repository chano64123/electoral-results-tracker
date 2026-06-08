const axios = require('axios');

const apiClient = axios.create({
  baseURL: process.env.API_BASE_URL || 'https://resultadosegundavuelta.onpe.gob.pe/presentacion-backend',
  headers: {
    'sec-fetch-site': 'same-origin',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36'
  },
  timeout: 10000
});

/**
 * Get summary/totals data
 * @returns {Promise} Response from API
 */
async function getSummaryData() {
  try {
    const response = await apiClient.get(
      '/resumen-general/totales',
      {
        params: {
          idEleccion: 10,
          tipoFiltro: 'ambito_geografico',
          idAmbitoGeografico: 1
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching summary data:', error.message);
    throw error;
  }
}

/**
 * Get candidates/participants data
 * @returns {Promise} Response from API
 */
async function getCandidatesData() {
  try {
    const response = await apiClient.get(
      '/resumen-general/participantes',
      {
        params: {
          idEleccion: 10,
          tipoFiltro: 'eleccion'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching candidates data:', error.message);
    throw error;
  }
}

module.exports = {
  apiClient,
  getSummaryData,
  getCandidatesData
};
