# CRM Contactos API

API REST para gestionar contactos de clientes de un CRM, con notas de seguimiento por contacto.

**Stack:** Node.js, TypeScript, Express y PostgreSQL (con Docker Compose).

## Requisitos

- Node.js 20 o superior
- Docker Desktop (o Docker con el plugin de Compose)

## Instalación y ejecución

1. Clona el repositorio e instala las dependencias:

```bash
   npm install
```

2. Crea tu archivo de variables de entorno a partir del ejemplo:

```bash
   cp .env.example .env
```

3. Levanta PostgreSQL con Docker Compose:

```bash
   docker compose up -d
```

   La primera vez, Postgres ejecuta `db/init.sql` y crea las tablas `contactos` y `notas`. Espera a que el estado sea `healthy`:

```bash
   docker compose ps
```

4. Arranca la API en modo desarrollo:

```bash
   npm run dev
```

   La API queda en `http://localhost:3000`. Comprueba que todo funciona:

```bash
   curl localhost:3000/health
```

   Respuesta esperada: `{"status":"ok","db":"up"}`

### Otros comandos

| Comando | Qué hace |
|---|---|
| `npm run build` | Compila TypeScript a `dist/` |
| `npm start` | Ejecuta la versión compilada |
| `docker compose down` | Detiene Postgres (conserva los datos) |
| `docker compose down -v` | Detiene Postgres y borra los datos |

> **Importante:** `db/init.sql` solo se ejecuta cuando se crea el volumen por primera vez. Si cambias el esquema, reinicia con `docker compose down -v` y luego `docker compose up -d`.

### Variables de entorno

| Variable | Valor de ejemplo | Descripción |
|---|---|---|
| `PORT` | `3000` | Puerto de la API |
| `DATABASE_URL` | `postgres://crm:crm@localhost:5432/crm` | Conexión a PostgreSQL |

Las credenciales `crm/crm` son solo para desarrollo local.

Si el puerto 5432 de tu máquina está ocupado, cambia el mapeo en `docker-compose.yml` (por ejemplo `"5433:5432"`) y ajusta `DATABASE_URL` en tu `.env`.

## Endpoints

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/health` | Estado de la API y de la base de datos |
| POST | `/contactos` | Crear un contacto |
| GET | `/contactos` | Listar contactos (búsqueda opcional con `?q=`) |
| GET | `/contactos/:id` | Ver un contacto con sus notas |
| POST | `/contactos/:id/notas` | Agregar una nota a un contacto |

## Validaciones y códigos de error

| Código | Cuándo ocurre |
|---|---|
| `400` | Nombre vacío o ausente, correo con formato inválido, campos demasiado largos, id que no es un entero positivo, nota vacía o JSON mal formado |
| `404` | El contacto no existe o la ruta no existe |
| `500` | Error interno inesperado (el detalle solo se registra en el servidor) |

El orden de las validaciones es: primero el id (400), luego el cuerpo (400) y por último que el contacto exista (404).

## Probar la API

Primero se prueban todos los errores y después los casos que funcionan. Los casos de error se pueden correr con la base vacía, porque las validaciones ocurren antes de consultar si el contacto existe. Usa `-i` para ver el código HTTP.

### 1. Casos de error

**Contacto sin datos** (`400`, falta nombre y correo):

```bash
curl -i -X POST localhost:3000/contactos \
  -H "Content-Type: application/json" \
  -d '{}'
```

```json
{
  "error": "Datos inválidos",
  "detalles": [
    "nombre es obligatorio",
    "correo debe tener un formato válido (ejemplo: nombre@empresa.com)"
  ]
}
```

**Correo con formato inválido** (`400`):

```bash
curl -i -X POST localhost:3000/contactos \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Ana","correo":"ana-sin-arroba"}'
```

**Nombre con solo espacios** (`400`):

```bash
curl -i -X POST localhost:3000/contactos \
  -H "Content-Type: application/json" \
  -d '{"nombre":"   ","correo":"ana@acme.com"}'
```

**JSON mal formado** (`400`):

```bash
curl -i -X POST localhost:3000/contactos \
  -H "Content-Type: application/json" \
  -d '{malformado'
```

**Id que no es un número** (`400`):

```bash
curl -i localhost:3000/contactos/abc
```

**Nota vacía** (`400`):

```bash
curl -i -X POST localhost:3000/contactos/1/notas \
  -H "Content-Type: application/json" \
  -d '{"contenido":""}'
```

**Contacto que no existe** (`404`, el mensaje incluye el id):

```bash
curl -i localhost:3000/contactos/999
```

```json
{ "error": "Contacto 999 no encontrado" }
```

**Agregar nota a un contacto que no existe** (`404`):

```bash
curl -i -X POST localhost:3000/contactos/999/notas \
  -H "Content-Type: application/json" \
  -d '{"contenido":"Llamada de seguimiento"}'
```

**Ruta que no existe** (`404`):

```bash
curl -i localhost:3000/no-existe
```

### 2. Casos que funcionan

**Crear un contacto** (`201 Created`). `nombre` y `correo` son obligatorios; `telefono` y `empresa` son opcionales:

```bash
curl -i -X POST localhost:3000/contactos \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Ana Torres","correo":"ana@acme.com","telefono":"3001234567","empresa":"Acme"}'
```

```json
{
  "id": 1,
  "nombre": "Ana Torres",
  "correo": "ana@acme.com",
  "telefono": "3001234567",
  "empresa": "Acme",
  "creado_en": "2026-10-06T20:15:00.000Z"
}
```

**Listar contactos** (`200 OK`):

```bash
curl localhost:3000/contactos
```

**Buscar por nombre o empresa**, sin distinguir mayúsculas (`200 OK`):

```bash
curl "localhost:3000/contactos?q=acme"
```

**Agregar una nota** (`201 Created`):

```bash
curl -i -X POST localhost:3000/contactos/1/notas \
  -H "Content-Type: application/json" \
  -d '{"contenido":"Llamada de seguimiento el 5 de octubre"}'
```

**Ver un contacto con sus notas** (`200 OK`, de la nota más reciente a la más antigua):

```bash
curl localhost:3000/contactos/1
```

```json
{
  "id": 1,
  "nombre": "Ana Torres",
  "correo": "ana@acme.com",
  "telefono": "3001234567",
  "empresa": "Acme",
  "creado_en": "2026-10-06T20:15:00.000Z",
  "notas": [
    {
      "id": 1,
      "contacto_id": 1,
      "contenido": "Llamada de seguimiento el 5 de octubre",
      "creado_en": "2026-10-06T20:20:00.000Z"
    }
  ]
}
```

## Estructura del proyecto

```
db/init.sql                                 Esquema de la base de datos
docker-compose.yml                          PostgreSQL local
src/index.ts                                Arranque del servidor
src/app.ts                                  Configuración de Express
src/db/pool.ts                              Pool de conexiones a Postgres
src/routes/contactos.ts                     Endpoints: validan, orquestan y responden
src/repositories/contactosRepository.ts     Consultas a la base de datos
src/validaciones.ts                         Reglas de validación
src/middleware/errores.ts                   Manejo global de errores
test/contactos.test.ts                      Pruebas automatizadas
```

## Decisiones de diseño

- **SQL directo con `pg`, sin ORM:** son pocas consultas y es más fácil de leer y explicar. Todas están parametrizadas para evitar inyección SQL.
- **Notas como subrecurso** (`/contactos/:id/notas`), con clave foránea y `ON DELETE CASCADE`.
- **`GET /contactos/:id` devuelve también las notas**, porque es la forma de poder leerlas.
- **Validaciones en un archivo aparte**, que devuelven todos los errores a la vez y respetan los largos de las columnas.
- **`/health` consulta la base de datos**, para verificar el entorno de un vistazo.
- **Historial de Git:** `main` solo tiene la configuración inicial; todo lo demás está en `feature/contactos`, con commits pequeños y mensajes en formato Conventional Commits.
- **Capa de repositorio:** todas las consultas SQL viven en `contactosRepository.ts`. Las rutas no conocen SQL: validan, piden los datos al repositorio y deciden el código HTTP. Esto separa la lógica del acceso a datos y permite probar las rutas sin base de datos.

## Uso de IA

Usé Claude (Anthropic) como asistente durante toda la prueba. Le di un prompt con el enunciado completo y la forma en que quería trabajar, y eso me facilitó mucho el tiempo de desarrollo: me ayudó a planear el orden, a proponer el esquema de base de datos y la configuración de Docker Compose.

Aun así, no tomé nada como definitivo. Estas fueron las correcciones y verificaciones que hice yo:

- **Detecté un error en mi repositorio:** mi `.gitignore` nunca se había creado, y `node_modules` y un `.env` quedaron versionados en el primer commit. Lo vi revisando `git status` y `git ls-files`, y recreé el repositorio limpio, con el `.gitignore` primero, antes de abrir el pull request. Prefiero un historial limpio a tapar el error con commits encima.
- **Noté que faltaba el pull request:** al rehacer el repositorio, el PR en borrador había quedado sin crear. Me di cuenta y lo abrí hacia `main`, sin fusionarlo.
- **Corregí un mensaje de error poco claro:** el 404 de "contacto no encontrado" no decía qué id fallaba. Lo ajusté para incluir el id.
- **Cuestioné una decisión:** me pregunté si el `.env.example` era necesario antes de aceptarlo, y decidí dejarlo para que quien evalúe pueda levantar el proyecto con `cp .env.example .env`.
- **Probé cada endpoint con `curl`**, incluidos los casos de error, y revisé que cada commit tuviera solo los archivos esperados antes de subirlo.
- **Pruebas:** le di a la IA mis consultas y mi código para que me ayudara a generar las pruebas, y yo adapté los nombres de las rutas a los míos, porque tenía otros nombres. Le pedí que me explicara cómo funcionan los mocks y supertest para poder defenderlas yo mismo.
- **Corregí las pruebas que fallaron:** dos pruebas asumían una forma distinta de llamar al repositorio (el listado sin búsqueda y la verificación del contacto antes de agregar una nota). Ajusté los tests a mi código real y eliminé una función del repositorio que quedó sin uso.
- **Seguridad del repositorio:** le pedí ayuda para revisar y corregir vulnerabilidades en las consultas de mi repositorio, y verifiqué con `curl` y con las pruebas que el comportamiento de la API no cambiara.

## Mejoras desde mi perspectiva como desarrollador junior

Hay cosas que me gustaría seguir aprendiendo y aplicar:

- **Migraciones versionadas:** ahora el esquema vive en un único `init.sql`, que solo corre al crear el volumen. Me gustaría aprender una herramienta de migraciones para poder cambiar la base sin borrarla.
- **Correos duplicados:** hoy se puede crear dos veces el mismo correo. Agregaría una restricción única y respondería `409 Conflict`.
- **Paginación y eliminar contactos:** el listado devuelve todo, y con muchos contactos sería lento. También me falta poder eliminar un contacto.
- **Validación con una librería (por ejemplo Zod):** hoy escribí las validaciones a mano para entenderlas bien; con más entidades, una librería evitaría repetir código.
- **Dockerfile para la API y manejo real de secretos:** hoy solo la base corre en Docker, y las credenciales son de desarrollo.



## Pruebas automatizadas

```bash
npm test
```

Usan Vitest y supertest. El repositorio de datos está simulado (mock), por lo que las pruebas corren en milisegundos y **no necesitan base de datos ni Docker**.

Son 14 pruebas:

- **9 casos de error:** datos vacíos, correo inválido, nombre de solo espacios, JSON mal formado, id que no es un número, contacto inexistente (404), nota vacía, nota a un contacto inexistente y ruta inexistente. Además de revisar el código HTTP, comprueban que una entrada inválida nunca llega al repositorio.
- **5 casos felices:** crear un contacto (guarda los datos sin espacios sobrantes), listar, buscar con `?q=`, ver un contacto con sus notas y agregar una nota.

Como el repositorio está simulado, estas pruebas no verifican el SQL real. Eso se cubre con los ejemplos `curl` de la sección anterior.