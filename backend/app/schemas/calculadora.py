from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, Field, field_validator


class DatosEntrada(BaseModel):
    # Precios en USD
    precio_producto_usd: Decimal = Field(..., gt=0, description="Precio total del producto (FOB) en USD")
    costo_envio_usd: Decimal = Field(..., ge=0, description="Costo del envío en USD")
    seguro_usd: Decimal = Field(default=Decimal("0"), ge=0, description="Seguro en USD (opcional)")
    cantidad_productos: int = Field(default=1, gt=0, description="Cantidad de productos")

    # Impuestos
    impuestos_internos_pct: Decimal = Field(default=Decimal("0"), ge=0, le=100, description="Impuestos internos %")

    # Tipo de cambio
    tipo_cambio_ars_usd: Decimal = Field(..., gt=0, description="Tipo de cambio ARS/USD")

    # Opciones avanzadas
    ncm: Optional[str] = Field(default=None, description="NCM para sugerir % derecho de importación")
    derecho_importacion_pct: Optional[Decimal] = Field(
        default=None, ge=0, le=100, description="Derecho de importación % (editable, opcional si hay NCM)"
    )

    # Flags
    envio_incluye_impuestos_ddp: bool = Field(default=False, description="El envío ya incluye impuestos (DDP)")
    requiere_organismo_externo: bool = Field(
        default=False, description="Producto requiere intervención ANMAT, INTI, ENACOM, SENASA"
    )
    incluir_percepciones: bool = Field(default=False, description="Incluir percepciones (solo régimen general)")
    algun_bulto_supera_50kg: bool = Field(
        default=False, description="Algún bulto supera los 50 kg (límite regímenes simplificados)"
    )

    # Pequeños envíos
    envios_usados_este_anio: int = Field(
        default=0, ge=0, le=10, description="Cantidad de envíos ya usados este año (0-10)"
    )

    @field_validator("precio_producto_usd", "costo_envio_usd", "seguro_usd", "tipo_cambio_ars_usd",
                     "impuestos_internos_pct", "derecho_importacion_pct", mode="before")
    @classmethod
    def to_decimal(cls, v):
        if isinstance(v, (int, float, str)):
            return Decimal(str(v))
        return v


class TributoDetalle(BaseModel):
    nombre: str
    base_usd: Decimal
    alicuota_pct: Decimal
    monto_usd: Decimal
    monto_ars: Decimal
    es_estimado_maximo: bool = False
    rango_min_pct: Optional[Decimal] = None
    rango_max_pct: Optional[Decimal] = None
    a_confirmar: bool = False


class EscenarioResultado(BaseModel):
    tributos: list[TributoDetalle]
    total_impuestos_usd: Decimal
    total_impuestos_ars: Decimal
    pct_sobre_cif: Decimal
    costo_total_puesto_pais_usd: Decimal
    costo_total_puesto_pais_ars: Decimal
    costo_por_unidad_usd: Optional[Decimal] = None
    costo_por_unidad_ars: Optional[Decimal] = None


class ElegibilidadResultado(BaseModel):
    elegible: Optional[bool]  # True, False, o None para "con advertencias"
    motivos: list[str]
    advertencias: list[str]


class RegimenResultado(BaseModel):
    regimen_id: str
    regimen_nombre: str
    elegibilidad: ElegibilidadResultado
    escenario_conservador: Optional[EscenarioResultado] = None
    escenario_minimo: Optional[EscenarioResultado] = None
    a_confirmar: bool
    advertencias_generales: list[str]


class CalculoResponse(BaseModel):
    datos_entrada: DatosEntrada
    cif_usd: Decimal
    cif_ars: Decimal
    regímenes: list[RegimenResultado]
    regimen_mas_barato_elegible: Optional[str] = None
    advertencias_globales: list[str]