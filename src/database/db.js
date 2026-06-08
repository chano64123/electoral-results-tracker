const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = process.env.DB_PATH || './data/electoral_results.db';

// Ensure data directory exists
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database at:', dbPath);
  }
});

db.serialize(() => {
  // Table for general summary data
  db.run(`
    CREATE TABLE IF NOT EXISTS summary_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      actasContabilizadas REAL,
      contabilizadas INTEGER,
      totalActas INTEGER,
      participacionCiudadana REAL,
      actasEnviadasJee REAL,
      enviadasJee INTEGER,
      actasPendientesJee REAL,
      pendientesJee INTEGER,
      fechaActualizacion INTEGER,
      totalVotosEmitidos INTEGER,
      totalVotosValidos INTEGER,
      porcentajeVotosEmitidos REAL,
      porcentajeVotosValidos REAL,
      raw_response TEXT
    )
  `);

  // Table for candidates/participants data
  db.run(`
    CREATE TABLE IF NOT EXISTS candidates_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      summary_id INTEGER NOT NULL,
      nombreAgrupacionPolitica TEXT,
      codigoAgrupacionPolitica INTEGER,
      nombreCandidato TEXT,
      dniCandidato TEXT,
      totalVotosValidos INTEGER,
      porcentajeVotosValidos REAL,
      porcentajeVotosEmitidos REAL,
      fechaActualizacion INTEGER,
      raw_response TEXT,
      FOREIGN KEY (summary_id) REFERENCES summary_history(id)
    )
  `);

  // Table for tracking last update
  db.run(`
    CREATE TABLE IF NOT EXISTS last_update (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      endpoint TEXT UNIQUE,
      fechaActualizacion INTEGER,
      consulta_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Table for departamentos
  db.run(`
    CREATE TABLE IF NOT EXISTS departamentos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ubigeo TEXT UNIQUE NOT NULL,
      nombre TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Table for provincias
  db.run(`
    CREATE TABLE IF NOT EXISTS provincias (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ubigeo TEXT UNIQUE NOT NULL,
      nombre TEXT NOT NULL,
      departamento_ubigeo TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (departamento_ubigeo) REFERENCES departamentos(ubigeo)
    )
  `);

  // Table for distritos
  db.run(`
    CREATE TABLE IF NOT EXISTS distritos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ubigeo TEXT UNIQUE NOT NULL,
      nombre TEXT NOT NULL,
      provincia_ubigeo TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (provincia_ubigeo) REFERENCES provincias(ubigeo)
    )
  `);

  console.log('Database tables initialized successfully');
});

module.exports = db;
