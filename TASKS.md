# Q-Visualizer — Tareas del MVP

## Resumen

Este documento lista todas las tareas necesarias para implementar la primera versión (MVP) del dashboard de monitoreo de Redis, según lo definido en `DESIGN_DOC.md`.

**Estimación total:** ~40-50 horas de desarrollo

---

## Leyenda

- `[ ]` Pendiente
- `[x]` Completado
- `[~]` En progreso
- `[-]` Cancelado/Descartado

**Prioridad:**
- 🔴 Crítico (bloqueante)
- 🟡 Importante
- 🟢 Nice to have

---

## Fase 0: Setup del Proyecto

### 0.1 Estructura Base

- [x] 🔴 **T-001** — Crear estructura de carpetas del proyecto
  ```
  q-visualizer/
  ├── frontend/
  ├── backend/
  ├── Dockerfile
  ├── docker-compose.yml
  └── README.md
  ```

- [x] 🔴 **T-002** — Inicializar proyecto frontend con Vite + React + TypeScript
  - Ejecutar `npm create vite@latest frontend -- --template react-ts`
  - Configurar `tsconfig.json` con strict mode

- [x] 🔴 **T-003** — Inicializar proyecto backend con Node.js + TypeScript
  - Crear `package.json` con scripts: `dev`, `build`, `start`
  - Configurar `tsconfig.json` para Node.js
  - Instalar dependencias: `express`, `ioredis`, `cors`
  - Instalar devDependencies: `typescript`, `tsx`, `@types/*`

- [x] 🔴 **T-004** — Configurar TailwindCSS en el frontend
  - Instalar `tailwindcss`, `postcss`, `autoprefixer`
  - Crear `tailwind.config.js` con la paleta de colores dark theme
  - Configurar variables CSS personalizadas

- [-] 🟡 **T-005** — Configurar ESLint y Prettier (opcional, pospuesto)
  - Configuración compartida para frontend y backend
  - Reglas básicas de consistencia

---

## Fase 1: Backend — Servidor Base

### 1.1 Servidor Express

- [x] 🔴 **T-006** — Crear servidor Express básico (`backend/src/index.ts`)
  - Configurar middleware: `cors`, `express.json()`
  - Configurar headers de seguridad básicos
  - Escuchar en puerto configurable (env `PORT`, default 3000)

- [x] 🔴 **T-007** — Implementar endpoint de health check
  - `GET /api/health`
  - Response: `{ status: "healthy", timestamp, version }`

- [x] 🔴 **T-008** — Configurar servidor para servir archivos estáticos
  - Servir carpeta `public/` (donde irá el build del frontend)
  - Ruta `/dashboard` sirve `index.html`
  - Catch-all `/dashboard/*` para client-side routing

### 1.2 Servicio Redis

- [x] 🔴 **T-009** — Crear módulo de tipos compartidos (`backend/src/types/`)
  - Definir `ConnectionConfig`
  - Definir `KeyInfo`
  - Definir `ApiResponse<T>`
  - Definir tipos de error

- [x] 🔴 **T-010** — Implementar servicio Redis (`backend/src/services/redis.service.ts`)
  - Función `withRedisConnection()` — wrapper para conexiones efímeras
  - Configurar timeouts: conexión 5s, comando 10s
  - Mapeo de errores Redis a mensajes amigables

- [x] 🔴 **T-011** — Implementar función `testConnection()`
  - Conectar, ejecutar `PING`, obtener `INFO server`
  - Retornar versión Redis, modo, uptime
  - Manejar errores: connection refused, auth failed, timeout

- [x] 🔴 **T-012** — Implementar función `scanKeys()`
  - Usar `SCAN` con cursor para iterar keys
  - Obtener tipo de cada key con `TYPE`
  - Obtener TTL con `TTL`
  - Obtener tamaño según tipo (LLEN, SCARD, etc.)
  - Limitar a 1000 keys por request

---

## Fase 2: Backend — APIs de Datos

### 2.1 Rutas API

- [x] 🔴 **T-013** — Crear router de Redis (`backend/src/routes/redis.routes.ts`)
  - Montar en `/api/redis`

- [x] 🔴 **T-014** — Implementar `POST /api/redis/test`
  - Validar body (host, port requeridos)
  - Llamar a `testConnection()`
  - Retornar resultado o error

- [x] 🔴 **T-015** — Implementar `POST /api/redis/keys`
  - Recibir conexión + patrón + cursor
  - Llamar a `scanKeys()`
  - Retornar lista de keys con metadata

### 2.2 Endpoints por Tipo de Dato

- [x] 🔴 **T-016** — Implementar `POST /api/redis/key/string`
  - Ejecutar `GET key`
  - Retornar valor y TTL

- [x] 🔴 **T-017** — Implementar `POST /api/redis/key/list`
  - Ejecutar `LLEN` y `LRANGE`
  - Soportar paginación (start, stop)
  - Retornar items con índice

- [x] 🔴 **T-018** — Implementar `POST /api/redis/key/hash`
  - Ejecutar `HLEN` y `HSCAN`
  - Retornar campos con valores

- [x] 🔴 **T-019** — Implementar `POST /api/redis/key/set`
  - Ejecutar `SCARD` y `SSCAN`
  - Retornar miembros

- [x] 🔴 **T-020** — Implementar `POST /api/redis/key/zset`
  - Ejecutar `ZCARD` y `ZRANGE ... WITHSCORES`
  - Soportar orden asc/desc
  - Retornar miembros con scores

- [x] 🔴 **T-021** — Implementar `POST /api/redis/key/stream`
  - Ejecutar `XLEN` y `XRANGE`
  - Parsear IDs a timestamps
  - Retornar mensajes con campos

### 2.3 Middleware y Validación

- [x] 🟡 **T-022** — Crear middleware de validación de requests
  - Validar campos requeridos de conexión
  - Validar tipos de datos
  - Retornar errores 400 con mensajes claros

- [x] 🟡 **T-023** — Crear middleware de manejo de errores global
  - Capturar excepciones no manejadas
  - Loguear errores
  - Retornar respuestas consistentes

---

## Fase 3: Frontend — Estructura Base

### 3.1 Setup Inicial

- [x] 🔴 **T-024** — Configurar estructura de carpetas frontend
  ```
  src/
  ├── components/
  ├── hooks/
  ├── services/
  ├── types/
  ├── App.tsx
  └── main.tsx
  ```

- [x] 🔴 **T-025** — Definir tipos TypeScript del frontend (`src/types/`)
  - `Connection`, `ConnectionConfig`
  - `KeyInfo`, `KeyType`
  - Estados de UI

- [x] 🔴 **T-026** — Crear servicio API (`src/services/api.ts`)
  - Función base `fetchApi()` con manejo de errores
  - `testConnection(config)`
  - `fetchKeys(connection, pattern)`
  - `fetchKeyContent(connection, key, type)`

- [x] 🔴 **T-027** — Implementar estilos base y variables CSS
  - Paleta dark theme según DESIGN_DOC
  - Tipografía (Inter + JetBrains Mono)
  - Clases utilitarias comunes

### 3.2 Estado Global

- [x] 🔴 **T-028** — Crear Context de aplicación (`src/context/AppContext.tsx`)
  - Estado: `connections`, `activeConnectionId`, `modalOpen`
  - Reducer con acciones: ADD, REMOVE, SET_ACTIVE, OPEN_MODAL, CLOSE_MODAL

- [x] 🔴 **T-029** — Implementar hook `useConnections()`
  - Cargar conexiones desde localStorage al iniciar
  - Sincronizar cambios a localStorage
  - Exponer: connections, addConnection, removeConnection

---

## Fase 4: Frontend — Componentes de Layout

### 4.1 Estructura Principal

- [x] 🔴 **T-030** — Crear componente `DashboardLayout`
  - Grid de 2 columnas: sidebar (280px) + contenido
  - Altura completa viewport
  - Fondo oscuro principal

- [x] 🔴 **T-031** — Crear componente `Sidebar`
  - Logo/título de la app
  - Lista de conexiones
  - Botón "Nueva conexión"
  - Indicador de conexión activa

- [x] 🔴 **T-032** — Crear componente `ConnectionItem`
  - Mostrar nombre, host:port
  - Indicador de estado (dot verde/gris)
  - Click para seleccionar
  - Botón para eliminar (con confirmación)

- [x] 🔴 **T-033** — Crear componente `Header` del contenido principal
  - Mostrar info de conexión activa
  - Botón "Refresh" para recargar keys
  - Breadcrumb simple

- [x] 🟡 **T-034** — Crear componente `EmptyState`
  - Mensaje cuando no hay conexiones
  - Mensaje cuando no hay keys
  - Ilustración simple o icono

---

## Fase 5: Frontend — Modal de Conexión

### 5.1 Formulario de Conexión

- [x] 🔴 **T-035** — Crear componente `ConnectionModal`
  - Overlay oscuro
  - Panel centrado con bordes redondeados
  - Animación de entrada/salida

- [x] 🔴 **T-036** — Implementar formulario dentro del modal
  - Campo: Nombre (alias) — requerido
  - Campo: Host — requerido, default "localhost"
  - Campo: Puerto — requerido, default 6379
  - Campo: Password — opcional, tipo password
  - Campo: Database — opcional, default 0
  - Toggle: TLS/SSL — default off

- [x] 🔴 **T-037** — Implementar botón "Test Connection"
  - Estado loading durante el test
  - Mostrar resultado: éxito (verde) o error (rojo)
  - Mensaje de error descriptivo

- [x] 🔴 **T-038** — Implementar validación del formulario
  - Nombre único entre conexiones existentes
  - Puerto en rango válido (1-65535)
  - Feedback visual en campos con error

- [x] 🔴 **T-039** — Implementar acciones del modal
  - Botón "Cancelar" — cierra sin guardar
  - Botón "Guardar" — valida y guarda
  - Cerrar con Escape o click fuera

---

## Fase 6: Frontend — Explorador de Keys

### 6.1 Lista de Keys

- [x] 🔴 **T-040** — Crear componente `KeyExplorer`
  - Contenedor principal del área de exploración
  - Mostrar loading mientras carga keys
  - Manejar estado de error

- [x] 🔴 **T-041** — Crear componente `KeyTypeGroup`
  - Header con icono de tipo, nombre y contador
  - Comportamiento colapsable (click en header)
  - Animación de expand/collapse

- [x] 🔴 **T-042** — Crear componente `KeyList`
  - Lista de keys dentro de un grupo
  - Virtualización básica si hay muchas keys (opcional V1)

- [x] 🔴 **T-043** — Crear componente `KeyItem`
  - Mostrar nombre de la key
  - Mostrar metadata: TTL, tamaño
  - Comportamiento expandible para ver contenido

### 6.2 Visualizadores de Datos

- [x] 🔴 **T-044** — Crear componente `DataViewer` (dispatcher)
  - Recibir tipo de key y renderizar viewer apropiado
  - Loading state mientras carga contenido
  - Manejo de errores

- [x] 🔴 **T-045** — Crear componente `StringViewer`
  - Mostrar valor completo
  - Detectar y formatear JSON
  - Botón para copiar valor

- [x] 🔴 **T-046** — Crear componente `ListViewer`
  - Tabla con columnas: Índice, Valor
  - Paginación (50 items por página)
  - Mostrar longitud total

- [x] 🔴 **T-047** — Crear componente `HashViewer`
  - Tabla con columnas: Campo, Valor
  - Paginación con cursor
  - Mostrar número total de campos

- [x] 🔴 **T-048** — Crear componente `SetViewer`
  - Lista de miembros
  - Paginación con cursor
  - Mostrar cardinalidad total

- [x] 🔴 **T-049** — Crear componente `ZSetViewer`
  - Tabla con columnas: Score, Member
  - Toggle orden asc/desc
  - Paginación

- [x] 🔴 **T-050** — Crear componente `StreamViewer`
  - Tabla con columnas: ID, Timestamp, Campos
  - Formatear timestamp legible
  - Paginación

---

## Fase 7: Frontend — Componentes Comunes

### 7.1 UI Components

- [ ] 🟡 **T-051** — Crear componente `Button`
  - Variantes: primary, secondary, danger, ghost
  - Estados: default, hover, active, disabled, loading
  - Tamaños: sm, md, lg

- [ ] 🟡 **T-052** — Crear componente `Input`
  - Tipos: text, password, number
  - Estados: default, focus, error, disabled
  - Label y mensaje de error integrados

- [ ] 🟡 **T-053** — Crear componente `Badge`
  - Variantes: success, error, warning, info, neutral
  - Tamaños: sm, md

- [ ] 🟡 **T-054** — Crear componente `Spinner`
  - Animación de loading
  - Tamaños: sm, md, lg

- [ ] 🟡 **T-055** — Crear componente `IconButton`
  - Botón circular con solo icono
  - Tooltip opcional

- [ ] 🟡 **T-056** — Crear componente `Collapsible`
  - Header clickeable
  - Contenido animado
  - Estado controlado o no controlado

- [ ] 🟡 **T-057** — Crear componente `Table`
  - Headers configurables
  - Filas con hover state
  - Soporte para contenido scrolleable

---

## Fase 8: Integración y Refinamiento

### 8.1 Integración

- [x] 🔴 **T-058** — Conectar frontend con backend
  - Configurar proxy en Vite para desarrollo
  - Probar todos los endpoints
  - Verificar manejo de errores end-to-end

- [x] 🔴 **T-059** — Implementar flujo completo de conexión
  - Agregar conexión → Test → Guardar
  - Seleccionar conexión → Cargar keys
  - Expandir key → Ver contenido

- [x] 🟡 **T-060** — Agregar feedback visual completo
  - Toasts o notificaciones para acciones
  - Confirmación al eliminar conexión
  - Estados de loading en todas las operaciones

### 8.2 Polish

- [x] 🟡 **T-061** — Revisar y ajustar responsive design
  - Comportamiento en pantallas pequeñas
  - Sidebar colapsable en móvil (opcional)

- [x] 🟡 **T-062** — Agregar iconos con Lucide React
  - Iconos para tipos de keys
  - Iconos para acciones (refresh, delete, copy, etc.)

- [x] 🟢 **T-063** — Agregar transiciones y animaciones
  - Hover states suaves
  - Expand/collapse animado
  - Modal entrada/salida

- [x] 🟢 **T-064** — Agregar atajos de teclado básicos
  - `Escape` para cerrar modal
  - `R` para refresh (cuando no hay input focused)

---

## Fase 9: Docker y Despliegue

### 9.1 Dockerfile

- [x] 🔴 **T-065** — Crear Dockerfile multi-stage
  - Stage 1: Build frontend (node:20-alpine)
  - Stage 2: Build backend (node:20-alpine)
  - Stage 3: Runtime (node:20-alpine)
  - Configurar usuario no-root

- [x] 🔴 **T-066** — Crear `.dockerignore`
  - Excluir node_modules, .git, tests
  - Excluir archivos de desarrollo

- [x] 🔴 **T-067** — Crear `docker-compose.yml` para desarrollo
  - Servicio app
  - Servicio redis-test para pruebas locales
  - Volúmenes para persistencia

- [x] 🟡 **T-068** — Agregar health check en Dockerfile
  - Usar wget para verificar `/api/health`
  - Configurar intervalos apropiados

### 9.2 Build Multi-Arch

- [x] 🟡 **T-069** — Crear script de build multi-arquitectura
  - Soporte para amd64, arm64, arm/v7
  - Usar docker buildx
  - Tags apropiados

- [ ] 🟡 **T-070** — Probar build en arquitectura ARM
  - Verificar funcionamiento en Raspberry Pi o similar
  - Documentar cualquier consideración especial

---

## Fase 10: Documentación y Cierre

### 10.1 Documentación

- [x] 🔴 **T-071** — Crear README.md completo
  - Descripción del proyecto
  - Requisitos previos
  - Instrucciones de instalación (desarrollo y producción)
  - Uso básico con capturas de pantalla

- [x] 🟡 **T-072** — Documentar variables de entorno
  - Tabla con todas las variables
  - Valores por defecto
  - Ejemplos de configuración

- [x] 🟢 **T-073** — Agregar comentarios JSDoc a funciones principales
  - Servicios del backend
  - Hooks del frontend
  - Componentes principales

### 10.2 Testing Manual

- [ ] 🔴 **T-074** — Verificar todos los flujos críticos
  - [ ] Agregar conexión nueva
  - [ ] Test connection exitoso
  - [ ] Test connection fallido
  - [ ] Listar keys de diferentes tipos
  - [ ] Ver contenido de cada tipo de key
  - [ ] Eliminar conexión
  - [ ] Persistencia en localStorage

- [ ] 🔴 **T-075** — Probar con Redis real
  - Conectar a instancia con datos reales
  - Verificar performance con muchas keys
  - Verificar manejo de valores grandes

- [ ] 🟡 **T-076** — Probar build de producción
  - Build frontend
  - Build backend
  - Servir desde Docker
  - Verificar que todo funciona

---

## Resumen por Fase

| Fase | Descripción | Tareas | Estimación |
|------|-------------|--------|------------|
| 0 | Setup del Proyecto | 5 | 2-3h |
| 1 | Backend Base | 7 | 4-5h |
| 2 | APIs de Datos | 12 | 6-8h |
| 3 | Frontend Base | 6 | 3-4h |
| 4 | Layout Components | 5 | 3-4h |
| 5 | Modal de Conexión | 5 | 3-4h |
| 6 | Key Explorer | 11 | 6-8h |
| 7 | Componentes Comunes | 7 | 4-5h |
| 8 | Integración | 7 | 4-5h |
| 9 | Docker | 6 | 3-4h |
| 10 | Documentación y QA | 6 | 3-4h |
| **Total** | | **77** | **41-54h** |

---

## Dependencias entre Tareas

```
T-001 ──┬── T-002 (Frontend setup)
        └── T-003 (Backend setup)

T-003 ──── T-006 ──── T-007
                 └── T-008

T-006 ──── T-009 ──── T-010 ──── T-011
                           └── T-012

T-012 ──── T-013 → T-014 → T-015 → T-016...T-021

T-002 ──── T-024 ──── T-025 ──── T-026
      └── T-004            └── T-027

T-026 ──── T-028 ──── T-029

T-029 ──── T-030 → T-031 → T-032...

T-021 + T-050 ──── T-058 (Integración)

T-058 ──── T-065 (Docker)

T-065 ──── T-071 (README)
```

---

## Notas

1. **Desarrollo paralelo:** Las fases de backend (1-2) y frontend setup (3-4) pueden desarrollarse en paralelo por diferentes desarrolladores.

2. **Orden recomendado para un solo desarrollador:**
   - Fase 0 → Fase 1 → Fase 2 → Fase 3 → Fase 4 → Fase 5 → Fase 6 → Fase 7 → Fase 8 → Fase 9 → Fase 10

3. **MVP mínimo:** Si hay presión de tiempo, las tareas marcadas con 🟢 pueden posponerse a una versión posterior.

4. **Testing:** No se incluyen tests automatizados en el MVP por decisión de alcance. Se recomienda agregarlos en V1.1.

