from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import httpx
import time
import json
import os
from pathlib import Path

router = APIRouter(prefix="/api", tags=["tipo-cambio"])

CACHE_FILE = Path(__file__).parent.parent.parent / "data" / "tipo_cambio_cache.json"
CACHE_TTL_SECONDS = 24 * 60 * 60  # 24 horas
DOLARAPI_URL = "https://dolarapi.com/v1/dolares"


class TipoCambioResponse(BaseModel):
    valor: float
    fuente: str
    fecha: str
    desde_cache: bool = False


def _leer_cache() -> dict | None:
    if not CACHE_FILE.exists():
        return None
    try:
        with open(CACHE_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return None


def _guardar_cache(valor: float, fecha: str) -> None:
    CACHE_FILE.parent.mkdir(parents=True, exist_ok=True)
    data = {"valor": valor, "fecha": fecha, "guardado_en": time.time()}
    with open(CACHE_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f)


def _cache_valido(cache: dict) -> bool:
    if not cache:
        return False
    guardado_en = cache.get("guardado_en", 0)
    return (time.time() - guardado_en) < CACHE_TTL_SECONDS


async def _fetch_dolar_oficial() -> tuple[float, str]:
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(DOLARAPI_URL)
        resp.raise_for_status()
        data = resp.json()
        for item in data:
            if item.get("casa") == "oficial" or item.get("nombre") == "Oficial":
                venta = item.get("venta")
                if venta is not None:
                    return float(venta), item.get("fechaActualizacion", "")
        raise ValueError("No se encontró dólar oficial en la respuesta")


@router.get("/tipo-cambio", response_model=TipoCambioResponse)
async def obtener_tipo_cambio():
    cache = _leer_cache()
    if cache and _cache_valido(cache):
        return TipoCambioResponse(
            valor=cache["valor"],
            fuente="dolarapi.com (cache)",
            fecha=cache["fecha"],
            desde_cache=True,
        )

    try:
        valor, fecha = await _fetch_dolar_oficial()
        _guardar_cache(valor, fecha)
        return TipoCambioResponse(
            valor=valor,
            fuente="dolarapi.com",
            fecha=fecha,
            desde_cache=False,
        )
    except Exception as e:
        if cache:
            return TipoCambioResponse(
                valor=cache["valor"],
                fuente="dolarapi.com (fallback cache expirado)",
                fecha=cache["fecha"],
                desde_cache=True,
            )
        raise HTTPException(
            status_code=503,
            detail=f"No se pudo obtener el tipo de cambio: {str(e)}",
        )


@router.post("/tipo-cambio/forzar-actualizacion", response_model=TipoCambioResponse)
async def forzar_actualizacion_tipo_cambio():
    try:
        valor, fecha = await _fetch_dolar_oficial()
        _guardar_cache(valor, fecha)
        return TipoCambioResponse(
            valor=valor,
            fuente="dolarapi.com (forzado)",
            fecha=fecha,
            desde_cache=False,
        )
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail=f"No se pudo actualizar el tipo de cambio: {str(e)}",
        )