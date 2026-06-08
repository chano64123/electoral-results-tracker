# Electoral Results Tracker - Peru

Una aplicación Node.js para guardar automáticamente el histórico de resultados de elecciones presidenciales del Perú desde la API oficial de ONPE.

## 🎯 Características

- ✅ Consulta automática a la API de ONPE
- ✅ Verificación de actualizaciones antes de cada consulta
- ✅ Almacenamiento en base de datos SQLite
- ✅ Guardado de históricos generales de resultados
- ✅ Guardado de históricos de candidatos/participantes
- ✅ Polling automático configurnable
- ✅ Respuestas JSON completas almacenadas

## 📋 Requisitos

- Node.js 14.0 o superior
- npm o yarn

## 🚀 Instalación

1. **Clonar o descargar el proyecto**

```bash
cd resultados-segunda-vuelta-historico
```

2. **Instalar dependencias**

```bash
npm install
```

3. **Configurar variables de entorno**

Copiar `.env.example` a `.env`:

```bash
cp .env.example .env
```

Editar `.env` según sea necesario:

```env
API_BASE_URL=https://resultadosegundavuelta.onpe.gob.pe/presentacion-backend
DB_PATH=./data/electoral_results.db
POLLING_INTERVAL=5
PORT=3000
```

## 🏃 Ejecución

### Modo desarrollo (con auto-reinicio)

```bash
npm run dev
```

### Modo producción

```bash
npm start
```

### Inicializar base de datos

```bash
npm run init-db
```

## 📊 Base de Datos

### Tablas

#### `summary_history`
Almacena el histórico de resúmenes generales:
- Actas contabilizadas
- Participación ciudadana
- Votos emitidos y válidos
- Timestamp de la consulta

#### `candidates_history`
Almacena el histórico de candidatos y sus resultados:
- Nombre de agrupación política
- Nombre del candidato
- Votos válidos y porcentajes
- Timestamp de la consulta

#### `last_update`
Registra la última actualización conocida de cada endpoint para evitar duplicados

## 🔄 Cómo funciona

1. **Inicialización**: La aplicación inicia y realiza una consulta inmediata
2. **Verificación**: Antes de cada consulta, verifica si `fechaActualizacion` ha cambiado
3. **Guardado**: Si hay cambios, guarda los datos en la base de datos SQLite
4. **Polling**: Se repite automáticamente cada N minutos (configurable)

### Endpoints API utilizados

#### Resumen General
```
GET https://resultadosegundavuelta.onpe.gob.pe/presentacion-backend/resumen-general/totales
?idEleccion=10&tipoFiltro=ambito_geografico&idAmbitoGeografico=1
```

#### Candidatos/Participantes
```
GET https://resultadosegundavuelta.onpe.gob.pe/presentacion-backend/resumen-general/participantes
?idEleccion=10&tipoFiltro=eleccion
```

## 📁 Estructura del Proyecto

```
.
├── src/
│   ├── index.js                 # Punto de entrada principal
│   ├── api/
│   │   └── client.js            # Cliente HTTP y funciones de API
│   ├── database/
│   │   ├── db.js                # Conexión y esquema de BD
│   │   └── init.js              # Inicializador de base de datos
│   └── services/
│       └── fetcher.js           # Lógica de obtención y almacenamiento
├── data/
│   └── electoral_results.db     # Base de datos SQLite
├── package.json
├── .env.example
└── README.md
```

## 🛠️ Dependencias

- **axios**: Cliente HTTP para peticiones a la API
- **sqlite3**: Base de datos para almacenamiento persistente
- **node-cron**: Programación de tareas periódicas
- **dotenv**: Gestión de variables de entorno

## 📝 Ejemplos de respuesta API

### Resumen General
```json
{
  "success": true,
  "message": "",
  "data": {
    "actasContabilizadas": 25.987,
    "contabilizadas": 23446,
    "totalActas": 90223,
    "participacionCiudadana": 20.357,
    "fechaActualizacion": 1780881723531,
    "totalVotosEmitidos": 5316204,
    "totalVotosValidos": 4966630
  }
}
```

### Candidatos
```json
{
  "success": true,
  "message": "",
  "data": [
    {
      "nombreAgrupacionPolitica": "JUNTOS POR EL PERÚ",
      "codigoAgrupacionPolitica": 10,
      "nombreCandidato": "ROBERTO HELBERT SANCHEZ PALOMINO",
      "dniCandidato": "16002918",
      "totalVotosValidos": 2158272,
      "porcentajeVotosValidos": 47.445,
      "porcentajeVotosEmitidos": 44.323
    }
  ]
}
```

## 🐛 Solución de problemas

### Error: `Cannot find module 'sqlite3'`
```bash
npm install
```

### Error: `Cannot find module 'dotenv'`
Asegúrate de que `.env` existe y está en la raíz del proyecto.

### La base de datos no se crea
Verifica que la carpeta `data/` tenga permisos de escritura:
```bash
npm run init-db
```

## 📈 Monitoreo

Para ver los datos almacenados, puedes usar cualquier cliente SQLite:

```sql
-- Últimas 10 consultas de resumen
SELECT * FROM summary_history ORDER BY timestamp DESC LIMIT 10;

-- Últimas 10 consultas de candidatos
SELECT * FROM candidates_history ORDER BY timestamp DESC LIMIT 10;

-- Histórico de actualizaciones
SELECT * FROM last_update;
```

## 📄 Licencia

MIT

## 👤 Autor

Creado para monitorear resultados electorales del Perú

---

**Nota**: Esta aplicación está diseñada específicamente para consultar la API de ONPE (Oficina Nacional de Procesos Electorales) y guardar el histórico de resultados de forma automática.
