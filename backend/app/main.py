from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import calculadora, config, tipo_cambio

app = FastAPI(
    title="Calculadora de Impuestos de Importación - Argentina",
    description="""
    API para estimar impuestos de importación a Argentina bajo tres regímenes:
    
    1. **Simplificado - Pequeños envíos** (Courier personal / Correo Argentino)
    2. **Simplificado - Courier comercial** (DIS)
    3. **Régimen General** (Importación definitiva)
    
    Todas las alícuotas, topes y reglas son configurables vía `/api/config` sin tocar código.
    """,
    version="1.0.0",
    contact={
        "name": "Calculadora Impuestos Importación",
        "url": "https://github.com/tu-repo/calculadora-impuestos",
    },
    license_info={
        "name": "MIT",
        "url": "https://opensource.org/licenses/MIT",
    },
)

# CORS para desarrollo con frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir routers
app.include_router(calculadora.router)
app.include_router(config.router)
app.include_router(tipo_cambio.router)


@app.get("/", tags=["health"])
async def root():
    return {
        "mensaje": "Calculadora de Impuestos de Importación - Argentina",
        "version": "1.0.0",
        "docs": "/docs",
        "redoc": "/redoc",
        "endpoints": {
            "calcular": "POST /api/calcular",
            "config_get": "GET /api/config",
            "config_put": "PUT /api/config",
            "ncm_search": "GET /api/ncm?q=",
            "tipo_cambio": "GET /api/tipo-cambio",
            "tipo_cambio_refresh": "POST /api/tipo-cambio/forzar-actualizacion"
        }
    }


@app.get("/health", tags=["health"])
async def health():
    return {"status": "ok"}