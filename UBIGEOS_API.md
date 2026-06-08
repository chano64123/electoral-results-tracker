# Ejemplo de uso del endpoint de sincronización de ubigeos

## Iniciar la aplicación
```bash
npm run dev
```

## Sincronizar ubigeos (departamentos, provincias, distritos)

### Usando cURL
```bash
curl -X POST http://localhost:3000/api/sync-ubigeos \
  -H "Content-Type: application/json"
```

### Usando PowerShell
```powershell
$uri = "http://localhost:3000/api/sync-ubigeos"
$response = Invoke-RestMethod -Uri $uri -Method Post -ContentType "application/json"
$response | ConvertTo-Json
```

### Usando Node.js/JavaScript
```javascript
const response = await fetch('http://localhost:3000/api/sync-ubigeos', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
});
const data = await response.json();
console.log(data);
```

## Verificar salud de la aplicación
```bash
curl http://localhost:3000/api/health
```

## Respuesta esperada del endpoint /api/sync-ubigeos

```json
{
  "success": true,
  "message": "✓ Ubigeos synchronization completed successfully.\n  Departamentos: 24\n  Provincias: 196\n  Distritos: 1874",
  "data": {
    "departamentos": 24,
    "provincias": 196,
    "distritos": 1874
  }
}
```

## Base de datos

Las tres tablas se han creado con las siguientes estructuras:

### Tabla: departamentos
- `id` (PK)
- `ubigeo` (UNIQUE)
- `nombre`
- `timestamp`

### Tabla: provincias
- `id` (PK)
- `ubigeo` (UNIQUE)
- `nombre`
- `departamento_ubigeo` (FK → departamentos.ubigeo)
- `timestamp`

### Tabla: distritos
- `id` (PK)
- `ubigeo` (UNIQUE)
- `nombre`
- `provincia_ubigeo` (FK → provincias.ubigeo)
- `timestamp`

## Características

✓ Sincronización automática de departamentos, provincias y distritos
✓ Relaciones de clave foránea entre tablas
✓ Búsqueda recursiva: departamento → provincias → distritos
✓ Creación o actualización de registros (INSERT OR REPLACE)
✓ Logging detallado de operaciones
