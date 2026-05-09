# Cloud Games Store — Backend (FastAPI + Google Cloud)

API REST para un catálogo de videojuegos. Integra Cloud SQL (PostgreSQL),
Cloud Storage y Firestore, y se despliega en App Engine Standard.

---

## Arquitectura

```
                ┌──────────────────────┐
                │  React + Vite (SPA)  │
                └──────────┬───────────┘
                           │ fetch
                           ▼
                ┌──────────────────────┐
                │ App Engine Standard  │
                │   (FastAPI + Gunicorn)│
                └──┬─────────┬─────────┬┘
                   │         │         │
        socket /cloudsql/... │         │
                   ▼         ▼         ▼
            ┌──────────┐ ┌──────────┐ ┌──────────┐
            │ Cloud    │ │ Cloud    │ │ Firestore│
            │  SQL     │ │ Storage  │ │ (audit)  │
            │ (Postgres│ │ (imágenes│ │          │
            └──────────┘ └──────────┘ └──────────┘
```

| Recurso         | Servicio              | Uso                                                |
| --------------- | --------------------- | -------------------------------------------------- |
| API             | App Engine Standard   | Hosting FastAPI con Gunicorn + Uvicorn             |
| Productos       | Cloud SQL (PostgreSQL)| Tabla `products`, `comments`                       |
| Imágenes        | Cloud Storage         | Bucket público con URL en `products.image_url`     |
| Auditoría       | Firestore             | Eventos `GAME_CREATED`, `IMAGE_UPLOADED`, `COMMENT_CREATED` |

---

## Endpoints

| Método | Ruta                                  | Descripción                              |
| ------ | ------------------------------------- | ---------------------------------------- |
| GET    | `/health`                             | Estado y conectividad a Cloud SQL        |
| POST   | `/products`                           | Crear videojuego (Cloud SQL)             |
| GET    | `/products`                           | Listar todos los videojuegos             |
| GET    | `/products/{id}`                      | Detalle de un videojuego                 |
| POST   | `/products/{id}/image`                | Subir imagen (Cloud Storage)             |
| POST   | `/products/{id}/comments`             | Crear comentario (Cloud SQL)             |
| GET    | `/products/{id}/comments`             | Listar comentarios                       |
| GET    | `/audit/events`                       | Listar últimos eventos de auditoría      |

Documentación interactiva: `/docs` (Swagger UI) y `/redoc`.

---

## Variables de entorno

| Variable                            | Local                           | App Engine                 |
| ----------------------------------- | ------------------------------- | -------------------------- |
| `DB_HOST`                           | `localhost` o IP pública        | (vacío)                    |
| `DB_PORT`                           | `5432`                          | (vacío)                    |
| `DB_NAME`                           | `cloudgames`                    | `cloudgames`               |
| `DB_USER` / `DB_PASSWORD`           | credenciales Postgres           | credenciales Cloud SQL     |
| `INSTANCE_CONNECTION_NAME`          | (vacío)                         | `PROJECT:REGION:INSTANCE`  |
| `GOOGLE_CLOUD_PROJECT`              | tu proyecto                     | tu proyecto                |
| `GCS_BUCKET_NAME`                   | nombre del bucket               | nombre del bucket          |
| `FIRESTORE_COLLECTION_AUDIT_EVENTS` | `audit_events`                  | `audit_events`             |
| `GOOGLE_APPLICATION_CREDENTIALS`    | ruta al JSON de la SA local     | (no aplica)                |

Cuando `INSTANCE_CONNECTION_NAME` está definido, [database.py](database.py) usa el
socket Unix `/cloudsql/<INSTANCE_CONNECTION_NAME>` y **ignora** `DB_HOST`/`DB_PORT`.

---

## Instalación local

```bash
cd app
python -m venv .venv
source .venv/bin/activate    # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env         # rellenar valores
uvicorn main:app --reload
```

Abre http://localhost:8000/docs.

### Postgres local

Opción A — Postgres local:
```bash
docker run -d --name pg -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:15
psql -h localhost -U postgres -c "CREATE DATABASE cloudgames;"
psql -h localhost -U postgres -d cloudgames -f init.sql
```

Opción B — Cloud SQL Auth Proxy:
```bash
./cloud-sql-proxy --port 5432 PROJECT:REGION:INSTANCE
```
Luego usa `DB_HOST=localhost` en `.env`.

---

## Configuración en Google Cloud

### 1. Habilitar APIs

```bash
gcloud services enable \
  appengine.googleapis.com \
  sqladmin.googleapis.com \
  storage.googleapis.com \
  firestore.googleapis.com
```

### 2. Cloud SQL (PostgreSQL)

```bash
gcloud sql instances create cloudgames-pg \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=us-central1

gcloud sql databases create cloudgames --instance=cloudgames-pg
gcloud sql users set-password postgres --instance=cloudgames-pg --password='<PASSWORD>'
```

Crear el esquema (vía proxy local):
```bash
./cloud-sql-proxy --port 5432 PROJECT:REGION:cloudgames-pg &
psql -h localhost -U postgres -d cloudgames -f init.sql
```

Anota el `INSTANCE_CONNECTION_NAME`:
```bash
gcloud sql instances describe cloudgames-pg --format='value(connectionName)'
```

### 3. Cloud Storage

```bash
gcloud storage buckets create gs://<bucket-name> \
  --location=us-central1 \
  --uniform-bucket-level-access

# Permitir lectura pública (necesario para que las URLs de imagen funcionen)
gcloud storage buckets add-iam-policy-binding gs://<bucket-name> \
  --member=allUsers \
  --role=roles/storage.objectViewer
```

### 4. Firestore (modo nativo)

```bash
gcloud firestore databases create --location=us-central
```
La colección `audit_events` se crea sola al insertar el primer documento.

---

## Despliegue en App Engine

```bash
gcloud app create --region=us-central        # solo la primera vez
# Editar app.yaml con tus valores reales
gcloud app deploy app.yaml
gcloud app browse
```

URL final: `https://<PROJECT_ID>.appspot.com`.

---

## IAM — permisos requeridos

La cuenta de servicio por defecto de App Engine es `<PROJECT_ID>@appspot.gserviceaccount.com`. Asígnale:

| Rol                                 | Para                          |
| ----------------------------------- | ----------------------------- |
| `roles/cloudsql.client`             | Conectarse a Cloud SQL        |
| `roles/storage.objectAdmin`         | Subir y leer en el bucket     |
| `roles/datastore.user`              | Escribir/leer en Firestore    |

```bash
PROJECT_ID=<tu-proyecto>
SA="${PROJECT_ID}@appspot.gserviceaccount.com"

for ROLE in roles/cloudsql.client roles/storage.objectAdmin roles/datastore.user; do
  gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SA" --role="$ROLE"
done
```

Para correr localmente con una service account:
```bash
gcloud iam service-accounts keys create sa-key.json \
  --iam-account=$SA
export GOOGLE_APPLICATION_CREDENTIALS=$(pwd)/sa-key.json
```

---

## Troubleshooting

| Error                                                   | Causa probable                                                  | Solución                                                                  |
| ------------------------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `could not connect to server: No such file or directory`| `INSTANCE_CONNECTION_NAME` mal o falta `cloud_sql_instances`   | Verifica `app.yaml` y formato `PROJECT:REGION:INSTANCE`                   |
| `password authentication failed`                        | Credenciales de Cloud SQL incorrectas                          | Resetea con `gcloud sql users set-password`                              |
| `403 Forbidden` al listar imagen                        | Bucket sin lectura pública                                     | `add-iam-policy-binding ... allUsers ... roles/storage.objectViewer`     |
| `403 Forbidden` al subir imagen                         | SA sin `roles/storage.objectAdmin`                             | Asigna el rol al `<PROJECT>@appspot.gserviceaccount.com`                 |
| `PERMISSION_DENIED` en Firestore                        | SA sin `roles/datastore.user`                                  | Asigna el rol                                                             |
| Imagen no aparece tras subirla                          | URL devuelta pero objeto privado                               | Activa lectura pública o usa URL firmada                                  |
| `502 Bad Gateway` tras deploy                           | Crash de gunicorn — falta dependencia o env var                | `gcloud app logs tail -s default`                                         |
| CORS bloqueado en frontend                              | Origin del frontend no aceptado                                | El backend usa `allow_origins=["*"]`. Verifica URL/protocolo              |

Logs en producción:
```bash
gcloud app logs tail -s default
```

---

## Ejemplos con cURL / Postman

```bash
BASE=https://<PROJECT_ID>.appspot.com   # o http://localhost:8000

# Health
curl $BASE/health

# Crear videojuego
curl -X POST $BASE/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Stardew Valley",
    "description": "Granja relajante",
    "price": 14.99,
    "genre": "Simulation",
    "current_version": "1.6.9",
    "release_year": 2016
  }'

# Listar
curl $BASE/products

# Subir imagen
curl -X POST $BASE/products/1/image \
  -F "file=@/ruta/a/imagen.jpg"

# Crear comentario
curl -X POST $BASE/products/1/comments \
  -H "Content-Type: application/json" \
  -d '{"author":"Ana","content":"Excelente juego"}'

# Auditoría
curl $BASE/audit/events
```

En Postman, para subir imagen: método `POST`, body `form-data`, key `file` tipo `File`.

---

## Estructura del proyecto

```
app/
├── main.py              # FastAPI + endpoints
├── database.py          # psycopg2 (TCP local / socket Cloud SQL)
├── storage.py           # Cloud Storage uploads
├── firestore_service.py # Eventos de auditoría
├── schemas.py           # Pydantic models
├── init.sql             # Esquema PostgreSQL
├── app.yaml             # Configuración App Engine
├── requirements.txt
└── .env.example
```
