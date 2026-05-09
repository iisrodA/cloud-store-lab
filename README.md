# Cloud Games Store

Catálogo de videojuegos desplegado sobre Google Cloud, construido como parte
del Segundo Previo de Computación en la Nube. Integra Cloud SQL (PostgreSQL),
Cloud Storage, Firestore y App Engine Standard.

## Estructura

```
cloud-store-lab/
├── app/         # Backend FastAPI (despliega en App Engine)
└── frontend/    # SPA React + Vite + Tailwind
```

## Arranque rápido

**Backend:**
```bash
cd app
pip install -r requirements.txt
cp .env.example .env       # rellenar valores
uvicorn main:app --reload  # http://localhost:8000
```

**Frontend:**
```bash
cd frontend
npm install
cp .env.example .env       # VITE_API_URL=http://localhost:8000
npm run dev                # http://localhost:5173
```

**Despliegue producción:**
```bash
cd app && gcloud app deploy app.yaml
cd frontend && npm run build   # subir dist/ a Firebase Hosting / Cloud Storage / etc.
```

## Documentación

- [`app/README.md`](app/README.md) — guía detallada del backend, IAM, despliegue, troubleshooting, ejemplos Postman.
- [`instrucciones.html`](instrucciones.html) — enunciado original de la evaluación.
- [`CLAUDE.md`](CLAUDE.md) — guía para asistentes de IA trabajando en este repo.

## Servicios cloud usados

| Servicio                | Uso                                            |
| ----------------------- | ---------------------------------------------- |
| App Engine Standard     | Hosting de la API FastAPI                      |
| Cloud SQL (PostgreSQL)  | Productos y comentarios                        |
| Cloud Storage           | Almacenamiento de imágenes de videojuegos     |
| Firestore               | Auditoría (eventos GAME_CREATED, etc.)         |
