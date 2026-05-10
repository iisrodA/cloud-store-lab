# Cloud Games Store

Catálogo de videojuegos desplegado sobre Google Cloud, construido como parte
del Segundo Previo de Computación en la Nube. Integra Cloud SQL (PostgreSQL),
Cloud Storage, Firestore y App Engine Standard.

## URLs públicas

| Servicio  | URL                                                                 |
|-----------|---------------------------------------------------------------------|
| Backend   | https://computacion-en-la-nube-489021.uc.r.appspot.com             |
| Frontend  | https://computacion-en-la-nube-489021.web.app                      |
| Swagger   | https://computacion-en-la-nube-489021.uc.r.appspot.com/docs        |

---

## Estructura del proyecto

```
cloud-store-lab/
├── app/         # Backend FastAPI (se despliega en App Engine)
└── frontend/    # SPA React + Vite + Tailwind (se despliega en Firebase Hosting)
```

---

## Ejecución local

### Requisitos previos

- Python 3.11+
- Node.js 18+
- [Cloud SQL Auth Proxy](https://cloud.google.com/sql/docs/postgres/sql-proxy#install)
- Archivo JSON de cuenta de servicio de GCP

### 1. Configurar variables de entorno del backend

Edita `app/.env` con tus valores:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cloudgames
DB_USER=postgres
DB_PASSWORD=<tu_password>

GOOGLE_CLOUD_PROJECT=computacion-en-la-nube-489021
GCS_BUCKET_NAME=cloudgames-storage-489021
FIRESTORE_COLLECTION_AUDIT_EVENTS=audit_events

GOOGLE_APPLICATION_CREDENTIALS=C:\ruta\al\service-account.json
```

### 2. Terminal 1 — Cloud SQL Auth Proxy

```bash
cloud-sql-proxy computacion-en-la-nube-489021:us-central1:fastapi-db --port 5432
```

Deja esta terminal corriendo. Cuando veas `Listening on 127.0.0.1:5432` está lista.

### 3. Terminal 2 — Backend

```bash
cd app
venv\Scripts\activate        # Windows
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Verifica en: http://localhost:8000/health y http://localhost:8000/docs

### 4. Terminal 3 — Frontend

```bash
cd frontend
npm install
npm run dev
```

Abre: http://localhost:5173

> El archivo `frontend/.env` ya apunta a `http://localhost:8000` por defecto.

---

## Despliegue en la nube

### Backend — App Engine

```bash
cd app
gcloud config set project computacion-en-la-nube-489021
gcloud app deploy app.yaml
```

El `app.yaml` ya tiene todas las variables de entorno configuradas. No se necesita el archivo JSON de credenciales en producción — App Engine se autentica automáticamente con la cuenta de servicio del proyecto.

Verificar logs si algo falla:
```bash
gcloud app logs tail -s default
```

### Frontend — Firebase Hosting

```bash
cd frontend

# Apuntar al backend en la nube (editar frontend/.env)
# VITE_API_URL=https://computacion-en-la-nube-489021.uc.r.appspot.com

npm run build
firebase deploy
```

> Para el primer deploy: `firebase login` y `firebase init hosting` (directorio público: `dist`, SPA: Yes).

---

## Servicios cloud usados

| Servicio               | Uso                                              |
|------------------------|--------------------------------------------------|
| App Engine Standard    | Hosting de la API FastAPI                        |
| Cloud SQL (PostgreSQL) | Productos y comentarios                          |
| Cloud Storage          | Almacenamiento de imágenes de videojuegos        |
| Firestore              | Auditoría (GAME_CREATED, IMAGE_UPLOADED, COMMENT_CREATED) |
| Firebase Hosting       | Hosting del frontend estático                    |

---

## Documentación adicional

- [`app/README.md`](app/README.md) — guía detallada del backend: IAM, variables, troubleshooting, ejemplos Postman.
- [`instrucciones.html`](instrucciones.html) — enunciado original de la evaluación.
