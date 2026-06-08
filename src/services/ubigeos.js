const axios = require('axios');
const db = require('../database/db');

const API_BASE_URL = process.env.API_BASE_URL;

/**
 * Fetch departamentos from API
 */
async function fetchDepartamentos() {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/ubigeos/departamentos?idEleccion=10&idAmbitoGeografico=1`
    );
    return response.data;
  } catch (error) {
    console.error('✗ Error fetching departamentos:', error.message);
    return { success: false, message: error.message, data: [] };
  }
}

/**
 * Fetch provincias for a departamento
 */
async function fetchProvincias(departamento_ubigeo) {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/ubigeos/provincias?idEleccion=10&idAmbitoGeografico=1&idUbigeoDepartamento=${departamento_ubigeo}`
    );
    return response.data;
  } catch (error) {
    console.error(`✗ Error fetching provincias for ${departamento_ubigeo}:`, error.message);
    return { success: false, message: error.message, data: [] };
  }
}

/**
 * Fetch distritos for a provincia
 */
async function fetchDistritos(provincia_ubigeo) {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/ubigeos/distritos?idEleccion=10&idAmbitoGeografico=1&idUbigeoProvincia=${provincia_ubigeo}`
    );
    return response.data;
  } catch (error) {
    console.error(`✗ Error fetching distritos for ${provincia_ubigeo}:`, error.message);
    return { success: false, message: error.message, data: [] };
  }
}

/**
 * Save departamentos to database
 */
function saveDepartamentos(departamentos) {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare(
      `INSERT OR REPLACE INTO departamentos (ubigeo, nombre) VALUES (?, ?)`
    );

    departamentos.forEach((dept) => {
      stmt.run([dept.ubigeo, dept.nombre]);
    });

    stmt.finalize((err) => {
      if (err) {
        reject(err);
      } else {
        console.log(`✓ ${departamentos.length} departamentos saved to database`);
        resolve();
      }
    });
  });
}

/**
 * Save provincias to database
 */
function saveProvincias(provincias, departamento_ubigeo) {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare(
      `INSERT OR REPLACE INTO provincias (ubigeo, nombre, departamento_ubigeo) VALUES (?, ?, ?)`
    );

    provincias.forEach((prov) => {
      stmt.run([prov.ubigeo, prov.nombre, departamento_ubigeo]);
    });

    stmt.finalize((err) => {
      if (err) {
        reject(err);
      } else {
        console.log(`✓ ${provincias.length} provincias saved to database for ${departamento_ubigeo}`);
        resolve();
      }
    });
  });
}

/**
 * Save distritos to database
 */
function saveDistritos(distritos, provincia_ubigeo) {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare(
      `INSERT OR REPLACE INTO distritos (ubigeo, nombre, provincia_ubigeo) VALUES (?, ?, ?)`
    );

    distritos.forEach((dist) => {
      stmt.run([dist.ubigeo, dist.nombre, provincia_ubigeo]);
    });

    stmt.finalize((err) => {
      if (err) {
        reject(err);
      } else {
        console.log(`✓ ${distritos.length} distritos saved to database for ${provincia_ubigeo}`);
        resolve();
      }
    });
  });
}

/**
 * Sync all ubigeos (departamentos, provincias, distritos)
 */
async function syncAllUbigeos() {
  try {
    console.log('\n🗺️  Starting ubigeos synchronization...');
    console.log('Time:', new Date().toLocaleString());

    // Fetch and save departamentos
    console.log('→ Fetching departamentos...');
    const deptData = await fetchDepartamentos();

    if (!deptData.success) {
      console.error('✗ API error fetching departamentos:', deptData.message);
      return { success: false, message: deptData.message };
    }

    await saveDepartamentos(deptData.data);

    // Fetch and save provincias and distritos
    console.log('→ Fetching provincias and distritos...');
    let totalProvincias = 0;
    let totalDistritos = 0;

    for (const dept of deptData.data) {
      // Fetch provincias for this departamento
      const provData = await fetchProvincias(dept.ubigeo);

      if (provData.success && provData.data.length > 0) {
        await saveProvincias(provData.data, dept.ubigeo);
        totalProvincias += provData.data.length;

        // Fetch distritos for each provincia
        for (const prov of provData.data) {
          const distData = await fetchDistritos(prov.ubigeo);

          if (distData.success && distData.data.length > 0) {
            await saveDistritos(distData.data, prov.ubigeo);
            totalDistritos += distData.data.length;
          }
        }
      }
    }

    const message = `✓ Ubigeos synchronization completed successfully.\n  Departamentos: ${deptData.data.length}\n  Provincias: ${totalProvincias}\n  Distritos: ${totalDistritos}`;
    console.log(message);

    return {
      success: true,
      message: message,
      data: {
        departamentos: deptData.data.length,
        provincias: totalProvincias,
        distritos: totalDistritos
      }
    };
  } catch (error) {
    console.error('✗ Error during ubigeos synchronization:', error.message);
    return { success: false, message: error.message };
  }
}

module.exports = {
  fetchDepartamentos,
  fetchProvincias,
  fetchDistritos,
  saveDepartamentos,
  saveProvincias,
  saveDistritos,
  syncAllUbigeos
};
