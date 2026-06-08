const crypto = require('crypto');
const { getSummaryData, getCandidatesData } = require('../api/client');
const db = require('../database/db');

/**
 * Calculate hash of candidates data
 * @param {Array} candidates - Array of candidate objects
 * @returns {string} SHA256 hash
 */
function calculateCandidatesHash(candidates) {
  const candidatesJson = JSON.stringify(candidates);
  return crypto.createHash('sha256').update(candidatesJson).digest('hex');
}

/**
 * Check if there's a new update available
 * @param {string} endpoint - API endpoint identifier
 * @param {number} nuevaFechaActualizacion - New update timestamp
 * @returns {Promise<boolean>} True if there's a new update
 */
function checkForUpdates(endpoint, nuevaFechaActualizacion) {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT fechaActualizacion FROM last_update WHERE endpoint = ?',
      [endpoint],
      (err, row) => {
        if (err) {
          reject(err);
        } else if (!row) {
          // First time checking this endpoint
          resolve(true);
        } else {
          // Compare timestamps
          resolve(row.fechaActualizacion !== nuevaFechaActualizacion);
        }
      }
    );
  });
}

/**
 * Check if candidates data has changed
 * @param {Array} candidates - Array of candidate objects
 * @returns {Promise<boolean>} True if there's a change
 */
function checkCandidatesForUpdates(candidates) {
  return new Promise((resolve, reject) => {
    const newHash = calculateCandidatesHash(candidates);

    db.get(
      'SELECT fechaActualizacion FROM last_update WHERE endpoint = ?',
      ['candidates'],
      (err, row) => {
        if (err) {
          reject(err);
        } else if (!row) {
          // First time checking candidates
          resolve(true);
        } else {
          // Compare hashes (stored in fechaActualizacion field for candidates)
          resolve(row.fechaActualizacion !== newHash);
        }
      }
    );
  });
}

/**
 * Update the last known update timestamp
 * @param {string} endpoint - API endpoint identifier
 * @param {number} fechaActualizacion - Update timestamp
 */
function updateLastCheck(endpoint, fechaActualizacion) {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT OR REPLACE INTO last_update (endpoint, fechaActualizacion)
       VALUES (?, ?)`,
      [endpoint, fechaActualizacion],
      (err) => {
        if (err) reject(err);
        else resolve();
      }
    );
  });
}

/**
 * Save summary data to database
 * @param {Object} summaryData - Summary data from API
 * @returns {Promise<number>} The ID of the inserted summary record
 */
function saveSummaryData(summaryData) {
  return new Promise((resolve, reject) => {
    const data = summaryData.data;
    db.run(
      `INSERT INTO summary_history (
        actasContabilizadas, contabilizadas, totalActas, participacionCiudadana,
        actasEnviadasJee, enviadasJee, actasPendientesJee, pendientesJee,
        fechaActualizacion, totalVotosEmitidos, totalVotosValidos,
        porcentajeVotosEmitidos, porcentajeVotosValidos, raw_response
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.actasContabilizadas,
        data.contabilizadas,
        data.totalActas,
        data.participacionCiudadana,
        data.actasEnviadasJee,
        data.enviadasJee,
        data.actasPendientesJee,
        data.pendientesJee,
        data.fechaActualizacion,
        data.totalVotosEmitidos,
        data.totalVotosValidos,
        data.porcentajeVotosEmitidos,
        data.porcentajeVotosValidos,
        JSON.stringify(summaryData)
      ],
      function (err) {
        if (err) {
          reject(err);
        } else {
          console.log('✓ Summary data saved to database');
          resolve(this.lastID);
        }
      }
    );
  });
}

/**
 * Save candidates data to database
 * @param {Object} candidatesData - Candidates data from API
 * @param {number} summary_id - ID of the summary record
 * @param {number} fechaActualizacion - Update timestamp from summary data
 */
function saveCandidatesData(candidatesData, summary_id, fechaActualizacion) {
  return new Promise((resolve, reject) => {
    const candidates = candidatesData.data;

    const stmt = db.prepare(
      `INSERT INTO candidates_history (
        summary_id, nombreAgrupacionPolitica, codigoAgrupacionPolitica, nombreCandidato,
        dniCandidato, totalVotosValidos, porcentajeVotosValidos,
        porcentajeVotosEmitidos, fechaActualizacion, raw_response
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );

    candidates.forEach((candidate) => {
      stmt.run([
        summary_id,
        candidate.nombreAgrupacionPolitica,
        candidate.codigoAgrupacionPolitica,
        candidate.nombreCandidato,
        candidate.dniCandidato,
        candidate.totalVotosValidos,
        candidate.porcentajeVotosValidos,
        candidate.porcentajeVotosEmitidos,
        fechaActualizacion,
        JSON.stringify(candidatesData)
      ]);
    });

    stmt.finalize((err) => {
      if (err) {
        reject(err);
      } else {
        console.log(`✓ ${candidates.length} candidates data saved to database`);
        resolve();
      }
    });
  });
}

/**
 * Main fetch and save routine
 */
async function fetchAndSaveData() {
  try {
    console.log('\n📊 Fetching electoral data...');
    console.log('Time:', new Date().toLocaleString());

    // Fetch summary data
    console.log('→ Checking for summary updates...');
    const summaryData = await getSummaryData();

    if (!summaryData.success) {
      console.error('✗ API error:', summaryData.message);
      return;
    }

    // Check if summary has been updated
    const summaryUpdated = await checkForUpdates(
      'summary',
      summaryData.data.fechaActualizacion
    );

    let summary_id = null;
    if (summaryUpdated) {
      console.log('→ New summary data found, saving...');
      summary_id = await saveSummaryData(summaryData);
      await updateLastCheck('summary', summaryData.data.fechaActualizacion);
    } else {
      console.log('ℹ Summary data unchanged since last check');
      // Get the last summary_id from database for linking candidates
      summary_id = await new Promise((resolve, reject) => {
        db.get(
          'SELECT id FROM summary_history ORDER BY id DESC LIMIT 1',
          (err, row) => {
            if (err) reject(err);
            else resolve(row ? row.id : null);
          }
        );
      });
    }

    // Fetch candidates data
    console.log('→ Checking for candidates updates...');
    const candidatesData = await getCandidatesData();

    if (!candidatesData.success) {
      console.error('✗ API error:', candidatesData.message);
      return;
    }

    // Check if candidates have been updated
    const candidatesUpdated = await checkCandidatesForUpdates(candidatesData.data);

    if (candidatesUpdated) {
      console.log('→ New candidates data found, saving...');
      await saveCandidatesData(candidatesData, summary_id, summaryData.data.fechaActualizacion);
      const candidatesHash = calculateCandidatesHash(candidatesData.data);
      await updateLastCheck('candidates', candidatesHash);
    } else {
      console.log('ℹ Candidates data unchanged since last check');
    }

    console.log('✓ Data fetch and save completed successfully\n');
  } catch (error) {
    console.error('✗ Error during fetch and save:', error.message, '\n');
  }
}

module.exports = {
  calculateCandidatesHash,
  checkForUpdates,
  checkCandidatesForUpdates,
  updateLastCheck,
  saveSummaryData,
  saveCandidatesData,
  fetchAndSaveData
};
