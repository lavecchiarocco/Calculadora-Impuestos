from fastapi import APIRouter, HTTPException, status
from app.engine.calculadora import calcular_todos_regimenes
from app.schemas.calculadora import DatosEntrada, CalculoResponse

router = APIRouter(prefix="/api", tags=["calculadora"])


@router.post(
    "/calcular",
    response_model=CalculoResponse,
    summary="Calcular impuestos de importación",
    description="""
    Calcula la estimación de impuestos para importación a Argentina bajo tres regímenes:
    
    1. **Simplificado - Pequeños envíos** (Courier personal / Correo Argentino)
    2. **Simplificado - Courier comercial** (DIS)
    3. **Régimen General** (Importación definitiva)
    
    Devuelve desglose línea por línea, elegibilidad, escenarios conservador/mínimo y comparativa.
    """,
    response_description="Resultado completo con los tres regímenes calculados"
)
async def calcular_impuestos(datos: DatosEntrada) -> CalculoResponse:
    """
    Calcula impuestos de importación para los tres regímenes.
    
    - **precio_producto_usd**: Valor FOB del producto (USD)
    - **costo_envio_usd**: Costo de envío según cotización (USD)
    - **seguro_usd**: Seguro opcional (USD)
    - **cantidad_productos**: Cantidad de productos (default 1)
    - **impuestos_internos_pct**: % impuestos internos
    - **tipo_cambio_ars_usd**: Tipo de cambio ARS/USD
    - **envio_incluye_impuestos_ddp**: Si el envío ya incluye impuestos (DDP)
    - **requiere_organismo_externo**: ANMAT, INTI, ENACOM, SENASA
    - **incluir_percepciones**: Solo régimen general
    - **algun_bulto_supera_50kg**: Si algún bulto supera 50 kg (afecta regímenes simplificados)
    - **envios_usados_este_anio**: 0-10 para pequeños envíos
    """
    try:
        resultado = calcular_todos_regimenes(datos)
        return resultado
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error en el cálculo: {str(e)}"
        )