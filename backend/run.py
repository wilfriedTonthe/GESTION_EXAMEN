import uvicorn
from app.db.database import Base, engine
import app.models.models  # S'assurer que tous les modèles sont importés

# Base.metadata.create_all(bind=engine) # Temporarily commented out for debugging
if __name__ == "__main__":
    uvicorn.run("app.main:app", host="127.0.0.1", port=8005, reload=True)
