from fastapi import APIRouter, HTTPException, status
from app.config.loader import get_config, reload_config, load_config, AppConfig as LoaderAppConfig
from app.schemas.config import (
    AppConfigResponse, ConfigUpdateRequest, NCMSearchResult
)
from typing import Optional

router = APIRouter(prefix="/api", tags=["configuracion"])


def convert_config(config: LoaderAppConfig) -> AppConfigResponse:
    """Convierte los modelos del loader a los modelos de respuesta API"""
    return AppConfigResponse(
        vigencia_desde=config.vigencia_desde,
        tipo_cambio=config.tipo_cambio.model_dump(),
        topes=config.topes.model_dump(),
        aliquotas={k: v.model_dump() for k, v in config.aliquotas.items()},
        regimenes=config.regimenes.model_dump(),
        ncm_ejemplos=[n.model_dump() for n in config.ncm_ejemplos],
        redondeo=config.redondeo.model_dump()
    )


@router.get(
    "/config",
    response_model=AppConfigResponse,
    summary="Obtener configuración actual",
    description="Devuelve toda la configuración vigente: alícuotas, topes, regímenes, NCM de ejemplo, divisor volumétrico, redondeo."
)
async def obtener_config() -> AppConfigResponse:
    config = get_config()
    return convert_config(config)


@router.put(
    "/config",
    response_model=AppConfigResponse,
    summary="Actualizar configuración",
    description="Actualiza parcialmente la configuración. Los campos no enviados mantienen su valor actual. Recarga automáticamente la config en memoria."
)
async def actualizar_config(updates: ConfigUpdateRequest) -> AppConfigResponse:
    try:
        # Cargar config actual como dict
        import yaml
        from pathlib import Path
        config_path = Path(__file__).parent.parent / "config" / "config.yaml"
        
        with open(config_path, "r", encoding="utf-8") as f:
            current = yaml.safe_load(f)
        
        # Aplicar actualizaciones parciales
        update_dict = updates.model_dump(exclude_unset=True)
        for key, value in update_dict.items():
            if value is not None:
                current[key] = value
        
        # Guardar
        with open(config_path, "w", encoding="utf-8") as f:
            yaml.dump(current, f, allow_unicode=True, sort_keys=False)
        
        # Recargar en memoria
        reload_config(config_path)
        
        return await obtener_config()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error actualizando configuración: {str(e)}"
        )


@router.get(
    "/ncm",
    response_model=list[NCMSearchResult],
    summary="Buscar NCM en tabla local",
    description="Busca NCM por código o descripción (parcial, insensible a mayúsculas)."
)
async def buscar_ncm(q: Optional[str] = None) -> list[NCMSearchResult]:
    config = get_config()
    resultados = config.ncm_ejemplos
    
    if q:
        q_lower = q.lower()
        resultados = [
            n for n in resultados
            if q_lower in n.ncm.lower() or q_lower in n.descripcion.lower()
        ]
    
    return [
        NCMSearchResult(
            ncm=n.ncm,
            descripcion=n.descripcion,
            derecho_importacion=n.derecho_importacion,
            iva=n.iva
        )
        for n in resultados
    ]