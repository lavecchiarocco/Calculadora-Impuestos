from pathlib import Path
from typing import Any
import yaml
from pydantic import BaseModel, Field


class AliquotaConfig(BaseModel):
    minimo: float
    maximo: float
    valor_aplicado: float
    etiqueta: str
    a_confirmar: bool


class TopesPequeñosEnvios(BaseModel):
    franquicia_usd: float
    limite_fob_usd: float
    limite_peso_kg_por_bulto: float
    max_unidades_misma_especie: int
    max_envios_por_anio: int
    a_confirmar: bool


class TopesCourierComercial(BaseModel):
    limite_fob_usd: float
    limite_peso_kg_por_bulto: float
    a_confirmar: bool


class TopesRegimenGeneral(BaseModel):
    sin_limite_valor: bool
    sin_limite_peso: bool
    a_confirmar: bool


class TopesConfig(BaseModel):
    pequenos_envios: TopesPequeñosEnvios
    courier_comercial: TopesCourierComercial
    regimen_general: TopesRegimenGeneral


class RegimenPequeñosEnvios(BaseModel):
    nombre: str
    derecho_importacion_sobre_excedente: bool
    tasa_estadistica_sobre_excedente: bool
    iva_sobre_valor_total: bool
    incluir_flete_seguro_base_iva: bool
    franquicia_activa_si_envios_menor_5: bool
    a_confirmar: bool
    advertencias: list[str]


class RegimenCourierComercial(BaseModel):
    nombre: str
    derecho_importacion_porcentaje_fijo: float
    tasa_estadistica_porcentaje: float
    iva_sobre_cif_mas_derecho_tasa: bool
    sin_percepciones: bool
    sin_franquicia: bool
    a_confirmar: bool
    advertencias: list[str]


class RegimenGeneral(BaseModel):
    nombre: str
    derecho_importacion_por_ncm: bool
    tasa_estadistica_porcentaje: float
    iva_sobre_cif_mas_derecho_tasa: bool
    percepciones_opcionales: bool
    requiere_despachante: bool
    requiere_inscripcion_importador: bool
    a_confirmar: bool
    advertencias: list[str]


class RegimenesConfig(BaseModel):
    pequenos_envios: RegimenPequeñosEnvios
    courier_comercial: RegimenCourierComercial
    regimen_general: RegimenGeneral


class NCMEjemplo(BaseModel):
    ncm: str
    descripcion: str
    derecho_importacion: float
    iva: float


class TipoCambioConfig(BaseModel):
    valor_defecto: float
    etiqueta: str
    a_confirmar: bool


class PesoVolumetricoConfig(BaseModel):
    divisor_aereo: int
    a_confirmar: bool


class RedondeoConfig(BaseModel):
    decimales: int
    modo: str


class AppConfig(BaseModel):
    vigencia_desde: str
    tipo_cambio: TipoCambioConfig
    peso_volumetrico: PesoVolumetricoConfig
    topes: TopesConfig
    aliquotas: dict[str, AliquotaConfig]
    regimenes: RegimenesConfig
    ncm_ejemplos: list[NCMEjemplo]
    redondeo: RedondeoConfig


_config_cache: AppConfig | None = None


def load_config(config_path: str | Path | None = None) -> AppConfig:
    global _config_cache
    if _config_cache is not None:
        return _config_cache

    if config_path is None:
        config_path = Path(__file__).parent / "config.yaml"

    with open(config_path, "r", encoding="utf-8") as f:
        data = yaml.safe_load(f)

    _config_cache = AppConfig(**data)
    return _config_cache


def reload_config(config_path: str | Path | None = None) -> AppConfig:
    global _config_cache
    _config_cache = None
    return load_config(config_path)


def get_config() -> AppConfig:
    if _config_cache is None:
        return load_config()
    return _config_cache