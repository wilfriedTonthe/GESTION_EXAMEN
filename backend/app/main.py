from fastapi import FastAPI, Request, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
import time
import os

# Importe tous les modèles pour s'assurer qu'ils sont enregistrés par SQLAlchemy
from app.models import models 

from app.db.database import engine, Base
from app.core.config import settings
from app.api import router as api_router

# Crée toutes les tables dans la base de données
# Cette ligne doit être exécutée après l'importation des modèles
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="API pour la gestion des examens et des résultats",
    version="1.0.0"
)

# Configuration CORS
app.add_middleware(
    CORSMiddleware,
        allow_origins=["http://localhost:3000", "http://localhost:5173", "http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Middleware pour logger les requêtes et les réponses
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    
    body = await request.body()
    
    # Pour permettre au corps d'être lu à nouveau, nous devons recréer le scope de la requête.
    # C'est une manière plus sûre de gérer le corps de la requête.
    async def receive():
        return {"type": "http.request", "body": body}
    
    request = Request(request.scope, receive)

    response = await call_next(request)
    
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    
    # Log des détails
    print(f"[REQUEST] {request.method} {request.url}")
    print(f"[HEADERS] {dict(request.headers)}")
    if body:
        try:
            print(f"[BODY] {body.decode('utf-8')}")
        except UnicodeDecodeError:
            print("[BODY] (non-decodable content, likely binary)")
    else:
        print("[BODY] (empty)")

    print(f"[RESPONSE] Status: {response.status_code}, Time: {process_time * 1000:.2f}ms")

    return response

# Inclure le routeur API centralisé
app.include_router(
    api_router,
    prefix="/api"
)

# Monter le répertoire des fichiers statiques pour les photos
# Cela rendra les fichiers dans 'uploads' accessibles via l'URL '/uploads'
if not os.path.exists("uploads"):
    os.makedirs("uploads")
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

@app.get("/")
async def root():
    return {"message": "Bienvenue sur l'API de gestion d'examens"}
