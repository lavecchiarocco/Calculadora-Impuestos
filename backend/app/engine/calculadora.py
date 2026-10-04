from __future__ import annotations
from decimal import Decimal, ROUND_HALF_UP
from typing import Optional
from dataclasses import dataclass

from app.config.loader import get_config, AliquotaConfig
from app.schemas.calculadora import (
    DatosEntrada, Bulto, ModoTransporte,
    TributoDetalle, EscenarioResultado, ElegibilidadResultado, RegimenResultado, CalculoResponse
)


# --- Utilidades Decimal ---

def redondear(valor: Decimal, decimales: int = 2) -> Decimal:
    """Redondea a la cantidad de decimales especificada usando ROUND_HALF_UP"""
    quantize_exp = Decimal("0.1") ** decimales
    return valor.quantize(quantize_exp, rounding=ROUND_HALF_UP)


def calcular_porcentaje(base: Decimal, porcentaje: Decimal) -> Decimal:
    """Calcula el porcentaje de una base (porcentaje en decimal, ej: 0.21 para 21%)"""
    return redondear(base * porcentaje)


def a_decimal(valor: float | int | str | Decimal) -> Decimal:
    """Convierte a Decimal de forma segura"""
    if isinstance(valor, Decimal):
        return valor
    return Decimal(str(valor))


# --- Cálculo de peso y volumen ---

@dataclass
class PesoVolumenResultado:
    peso_real_total_kg: Decimal
    peso_volumetrico_kg: Optional[Decimal]
    peso_facturable_kg: Decimal
    volumen_m3: Optional[Decimal]
    usd_por_kg_flete: Optional[Decimal]


def calcular_peso_volumen(datos: DatosEntrada) -> PesoVolumenResultado:
    """Calcula peso real, volumétrico, facturable y volumen en m³"""
    config = get_config()
    divisor = a_decimal(config.peso_volumetrico.divisor_aereo)

    peso_real_total = sum(b.peso_kg for b in datos.bultos)

    peso_volumetrico = None
    volumen_m3 = None

    if datos.modo_transporte == ModoTransporte.AEREO:
        # Peso volumétrico aéreo = (L × A × H × bultos) / divisor
        vol_cm3_total = sum(b.largo_cm * b.ancho_cm * b.alto_cm for b in datos.bultos)
        peso_volumetrico = redondear(a_decimal(vol_cm3_total) / divisor)
        # Volumen en m³ para referencia
        volumen_m3 = redondear(a_decimal(vol_cm3_total) / Decimal("1000000"), 4)
    else:
        # Marítimo: solo volumen en m³
        vol_cm3_total = sum(b.largo_cm * b.ancho_cm * b.alto_cm for b in datos.bultos)
        volumen_m3 = redondear(a_decimal(vol_cm3_total) / Decimal("1000000"), 4)

    peso_facturable = max(peso_real_total, peso_volumetrico or Decimal("0"))

    # USD/kg del flete como control de razonabilidad (usa peso facturable)
    usd_por_kg_flete = None
    if datos.modo_transporte == ModoTransporte.AEREO and peso_facturable > 0:
        usd_por_kg_flete = redondear(datos.costo_envio_usd / peso_facturable, 4)

    return PesoVolumenResultado(
        peso_real_total_kg=peso_real_total,
        peso_volumetrico_kg=peso_volumetrico,
        peso_facturable_kg=peso_facturable,
        volumen_m3=volumen_m3,
        usd_por_kg_flete=usd_por_kg_flete,
    )


# --- Obtención de alícuotas ---

def get_aliquota(nombre: str, usar_maximo: bool = True) -> tuple[Decimal, Decimal, Decimal, bool, str]:
    """
    Obtiene alícuota de la config.
    Returns: (valor_aplicado, minimo, maximo, a_confirmar, etiqueta)
    Si usar_maximo=True, usa valor_aplicado (que por defecto es el máximo).
    Si usar_maximo=False, usa el mínimo.
    """
    config = get_config()
    al = config.aliquotas[nombre]
    if usar_maximo:
        return (
            a_decimal(al.valor_aplicado),
            a_decimal(al.minimo),
            a_decimal(al.maximo),
            al.a_confirmar,
            al.etiqueta
        )
    else:
        return (
            a_decimal(al.minimo),
            a_decimal(al.minimo),
            a_decimal(al.maximo),
            al.a_confirmar,
            al.etiqueta
        )


def get_derecho_importacion(ncm: Optional[str], derecho_manual: Optional[Decimal], usar_maximo: bool = True) -> tuple[Decimal, Decimal, Decimal, bool, str]:
    """Obtiene el derecho de importación: si hay NCM en tabla, usa ese; si hay manual, usa ese; sino usa config"""
    config = get_config()

    # Si el usuario pasó un % manual, usarlo
    if derecho_manual is not None:
        return (a_decimal(derecho_manual) / Decimal("100"), Decimal("0"), Decimal("0"), False, "Derecho de importación (manual)")

    # Buscar en NCM ejemplos
    if ncm:
        for ej in config.ncm_ejemplos:
            if ej.ncm == ncm:
                return (a_decimal(ej.derecho_importacion), Decimal("0"), Decimal("0"), False, f"Derecho de importación (NCM {ncm})")

    # Usar config por defecto
    return get_aliquota("derecho_importacion", usar_maximo)


def get_iva(ncm: Optional[str] = None, usar_maximo: bool = True) -> tuple[Decimal, Decimal, Decimal, bool, str]:
    """Obtiene IVA: si hay NCM con IVA definido, usa ese; sino usa config"""
    config = get_config()
    if ncm:
        for ej in config.ncm_ejemplos:
            if ej.ncm == ncm and ej.iva > 0:
                return (a_decimal(ej.iva), Decimal("0"), Decimal("0"), False, f"IVA (NCM {ncm})")
    return get_aliquota("iva", usar_maximo)


def get_impuestos_internos(usar_maximo: bool = True) -> tuple[Decimal, Decimal, Decimal, bool, str]:
    return get_aliquota("impuestos_internos", usar_maximo)


def get_percepcion_iva(usar_maximo: bool = True) -> tuple[Decimal, Decimal, Decimal, bool, str]:
    return get_aliquota("percepcion_iva", usar_maximo)


def get_percepcion_ganancias(usar_maximo: bool = True) -> tuple[Decimal, Decimal, Decimal, bool, str]:
    return get_aliquota("percepcion_ganancias", usar_maximo)


def get_percepcion_iibb(usar_maximo: bool = True) -> tuple[Decimal, Decimal, Decimal, bool, str]:
    return get_aliquota("percepcion_iibb", usar_maximo)


# --- Cálculo de tributos ---

@dataclass
class TributoCalculado:
    nombre: str
    base_usd: Decimal
    alicuota: Decimal
    monto_usd: Decimal
    monto_ars: Decimal
    es_estimado_maximo: bool
    rango_min_pct: Optional[Decimal]
    rango_max_pct: Optional[Decimal]
    a_confirmar: bool


def crear_tributo(
    nombre: str,
    base_usd: Decimal,
    alicuota: Decimal,
    tipo_cambio: Decimal,
    es_estimado_maximo: bool = False,
    rango_min_pct: Optional[Decimal] = None,
    rango_max_pct: Optional[Decimal] = None,
    a_confirmar: bool = False
) -> TributoCalculado:
    monto_usd = calcular_porcentaje(base_usd, alicuota)
    monto_ars = redondear(monto_usd * tipo_cambio)
    return TributoCalculado(
        nombre=nombre,
        base_usd=base_usd,
        alicuota=alicuota,
        monto_usd=monto_usd,
        monto_ars=monto_ars,
        es_estimado_maximo=es_estimado_maximo,
        rango_min_pct=rango_min_pct,
        rango_max_pct=rango_max_pct,
        a_confirmar=a_confirmar
    )


# --- Motor de cálculo por régimen ---

def calcular_pequenos_envios(datos: DatosEntrada, peso_vol: PesoVolumenResultado, usar_maximo: bool = True) -> RegimenResultado:
    config = get_config()
    reg_config = config.regimenes.pequenos_envios
    topes = config.topes.pequenos_envios

    fob_usd = datos.precio_producto_usd
    cif_usd = fob_usd + datos.costo_envio_usd + datos.seguro_usd
    tipo_cambio = datos.tipo_cambio_ars_usd

    motivos_no_elegible = []
    advertencias = list(reg_config.advertencias)

    # Validaciones de elegibilidad
    if fob_usd > a_decimal(topes.limite_fob_usd):
        motivos_no_elegible.append(f"FOB (${fob_usd} USD) supera el límite de ${topes.limite_fob_usd} USD para pequeños envíos")

    for i, bulto in enumerate(datos.bultos):
        if bulto.peso_kg > a_decimal(topes.limite_peso_kg_por_bulto):
            motivos_no_elegible.append(f"Bulto {i+1}: peso {bulto.peso_kg} kg supera el límite de {topes.limite_peso_kg_por_bulto} kg por bulto")

    if datos.cantidad_unidades > topes.max_unidades_misma_especie:
        motivos_no_elegible.append(f"Cantidad de unidades ({datos.cantidad_unidades}) supera el máximo de {topes.max_unidades_misma_especie} de la misma especie")

    if datos.requiere_organismo_externo:
        motivos_no_elegible.append("El producto requiere intervención de organismo externo (ANMAT, INTI, ENACOM, SENASA)")

    # Franquicia: si envios_usados >= 5, no hay franquicia
    tiene_franquicia = datos.envios_usados_este_anio < topes.max_envios_por_anio

    tributos = []

    franquicia_usd = a_decimal(topes.franquicia_usd)
    if tiene_franquicia and fob_usd <= franquicia_usd:
        # Solo IVA sobre valor total (CIF si incluir_flete_seguro_base_iva, sino FOB)
        base_iva = cif_usd if reg_config.incluir_flete_seguro_base_iva else fob_usd
        alicuota_iva, min_iva, max_iva, a_conf_iva, etiqueta_iva = get_iva(datos.ncm, usar_maximo)
        es_max = usar_maximo and alicuota_iva == max_iva
        tributos.append(crear_tributo(
            etiqueta_iva, base_iva, alicuota_iva, tipo_cambio,
            es_estimado_maximo=es_max, rango_min_pct=min_iva, rango_max_pct=max_iva, a_confirmar=a_conf_iva
        ))

        # Impuestos internos si corresponde
        if datos.impuestos_internos_pct > 0:
            al_ii = a_decimal(datos.impuestos_internos_pct) / Decimal("100")
            tributos.append(crear_tributo(
                "Impuestos internos", base_iva, al_ii, tipo_cambio,
                es_estimado_maximo=False, a_confirmar=False
            ))

    else:
        # Sin franquicia (FOB > 400 o envios >= 5): derecho y tasa sobre excedente o total
        base_derecho_tasa = fob_usd - franquicia_usd if (tiene_franquicia and fob_usd > franquicia_usd) else fob_usd
        base_derecho_tasa = max(base_derecho_tasa, Decimal("0"))

        # Derecho de importación
        al_derecho, min_d, max_d, a_conf_d, etiqueta_d = get_derecho_importacion(datos.ncm, datos.derecho_importacion_pct, usar_maximo)
        es_max_d = usar_maximo and al_derecho == max_d
        tributos.append(crear_tributo(
            etiqueta_d, base_derecho_tasa, al_derecho, tipo_cambio,
            es_estimado_maximo=es_max_d, rango_min_pct=min_d, rango_max_pct=max_d, a_confirmar=a_conf_d
        ))

        # Tasa de estadística 3%
        al_tasa, min_t, max_t, a_conf_t, etiqueta_t = get_aliquota("tasa_estadistica", usar_maximo)
        tributos.append(crear_tributo(
            etiqueta_t, base_derecho_tasa, al_tasa, tipo_cambio,
            es_estimado_maximo=False, rango_min_pct=min_t, rango_max_pct=max_t, a_confirmar=a_conf_t
        ))

        # IVA sobre valor total (CIF o FOB según config)
        base_iva = cif_usd if reg_config.iva_sobre_valor_total else fob_usd
        al_iva, min_iva, max_iva, a_conf_iva, etiqueta_iva = get_iva(datos.ncm, usar_maximo)
        es_max_iva = usar_maximo and al_iva == max_iva
        tributos.append(crear_tributo(
            etiqueta_iva, base_iva, al_iva, tipo_cambio,
            es_estimado_maximo=es_max_iva, rango_min_pct=min_iva, rango_max_pct=max_iva, a_confirmar=a_conf_iva
        ))

        # Impuestos internos
        if datos.impuestos_internos_pct > 0:
            al_ii = a_decimal(datos.impuestos_internos_pct) / Decimal("100")
            tributos.append(crear_tributo(
                "Impuestos internos", base_iva, al_ii, tipo_cambio, a_confirmar=False
            ))

    # Calcular totales
    total_usd = sum(t.monto_usd for t in tributos)
    total_ars = sum(t.monto_ars for t in tributos)
    pct_sobre_cif = redondear((total_usd / cif_usd) * Decimal("100")) if cif_usd > 0 else Decimal("0")
    costo_total_usd = cif_usd + total_usd
    costo_total_ars = redondear(costo_total_usd * tipo_cambio)
    costo_por_unidad_usd = redondear(costo_total_usd / datos.cantidad_unidades) if datos.cantidad_unidades > 0 else None
    costo_por_unidad_ars = redondear(costo_por_unidad_usd * tipo_cambio) if costo_por_unidad_usd else None

    # Determinar elegibilidad
    if motivos_no_elegible:
        elegible = False
    elif advertencias:
        elegible = None  # Con advertencias
    else:
        elegible = True

    escenario = EscenarioResultado(
        tributos=[TributoDetalle(
            nombre=t.nombre, base_usd=t.base_usd, alicuota_pct=redondear(t.alicuota * Decimal("100")),
            monto_usd=t.monto_usd, monto_ars=t.monto_ars,
            es_estimado_maximo=t.es_estimado_maximo, rango_min_pct=t.rango_min_pct,
            rango_max_pct=t.rango_max_pct, a_confirmar=t.a_confirmar
        ) for t in tributos],
        total_impuestos_usd=total_usd,
        total_impuestos_ars=total_ars,
        pct_sobre_cif=pct_sobre_cif,
        costo_total_puesto_pais_usd=costo_total_usd,
        costo_total_puesto_pais_ars=costo_total_ars,
        costo_por_unidad_usd=costo_por_unidad_usd,
        costo_por_unidad_ars=costo_por_unidad_ars
    )

    return RegimenResultado(
        regimen_id="pequenos_envios",
        regimen_nombre=reg_config.nombre,
        elegibilidad=ElegibilidadResultado(
            elegible=elegible,
            motivos=motivos_no_elegible,
            advertencias=advertencias
        ),
        escenario_conservador=escenario if usar_maximo else None,
        escenario_minimo=escenario if not usar_maximo else None,
        a_confirmar=reg_config.a_confirmar,
        advertencias_generales=advertencias
    )


def calcular_courier_comercial(datos: DatosEntrada, peso_vol: PesoVolumenResultado, usar_maximo: bool = True) -> RegimenResultado:
    config = get_config()
    reg_config = config.regimenes.courier_comercial
    topes = config.topes.courier_comercial

    fob_usd = datos.precio_producto_usd
    cif_usd = fob_usd + datos.costo_envio_usd + datos.seguro_usd
    tipo_cambio = datos.tipo_cambio_ars_usd

    motivos_no_elegible = []
    advertencias = list(reg_config.advertencias)

    limite_fob_usd = a_decimal(topes.limite_fob_usd)
    limite_peso_kg = a_decimal(topes.limite_peso_kg_por_bulto)

    if fob_usd > limite_fob_usd:
        motivos_no_elegible.append(f"FOB (${fob_usd} USD) supera el límite de ${limite_fob_usd} USD para courier comercial")

    for i, bulto in enumerate(datos.bultos):
        if bulto.peso_kg > limite_peso_kg:
            motivos_no_elegible.append(f"Bulto {i+1}: peso {bulto.peso_kg} kg supera el límite de {limite_peso_kg} kg por bulto")

    if datos.requiere_organismo_externo:
        motivos_no_elegible.append("El producto requiere intervención de organismo externo (ANMAT, INTI, ENACOM, SENASA)")

    # Advertencia: exclusivo para personas jurídicas
    advertencias.append("ADVERTENCIA: Este subrégimen es exclusivo para personas jurídicas")

    tributos = []

    # Derecho de importación 20% sobre CIF (editable en config)
    al_derecho = a_decimal(reg_config.derecho_importacion_porcentaje_fijo)
    tributos.append(crear_tributo(
        "Derecho de importación (20% fijo)", cif_usd, al_derecho, tipo_cambio,
        a_confirmar=reg_config.a_confirmar
    ))

    # Tasa de estadística 3% sobre CIF
    al_tasa = a_decimal(reg_config.tasa_estadistica_porcentaje)
    tributos.append(crear_tributo(
        "Tasa de estadística (3%)", cif_usd, al_tasa, tipo_cambio,
        a_confirmar=False
    ))

    # IVA 21% sobre (CIF + derecho + tasa)
    derecho_usd = calcular_porcentaje(cif_usd, al_derecho)
    tasa_usd = calcular_porcentaje(cif_usd, al_tasa)
    base_iva = cif_usd + derecho_usd + tasa_usd

    al_iva, min_iva, max_iva, a_conf_iva, etiqueta_iva = get_iva(datos.ncm, usar_maximo)
    es_max_iva = usar_maximo and al_iva == max_iva
    tributos.append(crear_tributo(
        etiqueta_iva, base_iva, al_iva, tipo_cambio,
        es_estimado_maximo=es_max_iva, rango_min_pct=min_iva, rango_max_pct=max_iva, a_confirmar=a_conf_iva
    ))

    # Impuestos internos
    if datos.impuestos_internos_pct > 0:
        al_ii = a_decimal(datos.impuestos_internos_pct) / Decimal("100")
        tributos.append(crear_tributo(
            "Impuestos internos", base_iva, al_ii, tipo_cambio, a_confirmar=False
        ))

    # Sin percepciones en este régimen

    total_usd = sum(t.monto_usd for t in tributos)
    total_ars = sum(t.monto_ars for t in tributos)
    pct_sobre_cif = redondear((total_usd / cif_usd) * Decimal("100")) if cif_usd > 0 else Decimal("0")
    costo_total_usd = cif_usd + total_usd
    costo_total_ars = redondear(costo_total_usd * tipo_cambio)
    costo_por_unidad_usd = redondear(costo_total_usd / datos.cantidad_unidades) if datos.cantidad_unidades > 0 else None
    costo_por_unidad_ars = redondear(costo_por_unidad_usd * tipo_cambio) if costo_por_unidad_usd else None

    if motivos_no_elegible:
        elegible = False
    elif advertencias:
        elegible = None
    else:
        elegible = True

    escenario = EscenarioResultado(
        tributos=[TributoDetalle(
            nombre=t.nombre, base_usd=t.base_usd, alicuota_pct=redondear(t.alicuota * Decimal("100")),
            monto_usd=t.monto_usd, monto_ars=t.monto_ars,
            es_estimado_maximo=t.es_estimado_maximo, rango_min_pct=t.rango_min_pct,
            rango_max_pct=t.rango_max_pct, a_confirmar=t.a_confirmar
        ) for t in tributos],
        total_impuestos_usd=total_usd,
        total_impuestos_ars=total_ars,
        pct_sobre_cif=pct_sobre_cif,
        costo_total_puesto_pais_usd=costo_total_usd,
        costo_total_puesto_pais_ars=costo_total_ars,
        costo_por_unidad_usd=costo_por_unidad_usd,
        costo_por_unidad_ars=costo_por_unidad_ars
    )

    return RegimenResultado(
        regimen_id="courier_comercial",
        regimen_nombre=reg_config.nombre,
        elegibilidad=ElegibilidadResultado(
            elegible=elegible,
            motivos=motivos_no_elegible,
            advertencias=advertencias
        ),
        escenario_conservador=escenario if usar_maximo else None,
        escenario_minimo=escenario if not usar_maximo else None,
        a_confirmar=reg_config.a_confirmar,
        advertencias_generales=advertencias
    )


def calcular_regimen_general(datos: DatosEntrada, peso_vol: PesoVolumenResultado, usar_maximo: bool = True) -> RegimenResultado:
    config = get_config()
    reg_config = config.regimenes.regimen_general

    fob_usd = datos.precio_producto_usd
    cif_usd = fob_usd + datos.costo_envio_usd + datos.seguro_usd
    tipo_cambio = datos.tipo_cambio_ars_usd

    motivos_no_elegible = []
    advertencias = list(reg_config.advertencias)

    # Régimen general no tiene límites de valor ni peso, pero avisos informativos
    advertencias.append("INFO: Requiere despachante de aduana e inscripción como importador")

    tributos = []

    # Derecho de importación por NCM (0-35%) sobre CIF
    al_derecho, min_d, max_d, a_conf_d, etiqueta_d = get_derecho_importacion(datos.ncm, datos.derecho_importacion_pct, usar_maximo)
    es_max_d = usar_maximo and al_derecho == max_d
    tributos.append(crear_tributo(
        etiqueta_d, cif_usd, al_derecho, tipo_cambio,
        es_estimado_maximo=es_max_d, rango_min_pct=min_d, rango_max_pct=max_d, a_confirmar=a_conf_d
    ))

    # Tasa de estadística 3% sobre CIF
    al_tasa = a_decimal(reg_config.tasa_estadistica_porcentaje)
    tributos.append(crear_tributo(
        "Tasa de estadística (3%)", cif_usd, al_tasa, tipo_cambio, a_confirmar=False
    ))

    # IVA sobre (CIF + derecho + tasa)
    derecho_usd = calcular_porcentaje(cif_usd, al_derecho)
    tasa_usd = calcular_porcentaje(cif_usd, al_tasa)
    base_iva = cif_usd + derecho_usd + tasa_usd

    al_iva, min_iva, max_iva, a_conf_iva, etiqueta_iva = get_iva(datos.ncm, usar_maximo)
    es_max_iva = usar_maximo and al_iva == max_iva
    tributos.append(crear_tributo(
        etiqueta_iva, base_iva, al_iva, tipo_cambio,
        es_estimado_maximo=es_max_iva, rango_min_pct=min_iva, rango_max_pct=max_iva, a_confirmar=a_conf_iva
    ))

    # Impuestos internos
    if datos.impuestos_internos_pct > 0:
        al_ii = a_decimal(datos.impuestos_internos_pct) / Decimal("100")
        tributos.append(crear_tributo(
            "Impuestos internos", base_iva, al_ii, tipo_cambio, a_confirmar=False
        ))

    # Percepciones (solo si se activan)
    if datos.incluir_percepciones:
        # Percepción IVA
        al_perc_iva, min_pi, max_pi, a_conf_pi, etiqueta_pi = get_percepcion_iva(usar_maximo)
        es_max_pi = usar_maximo and al_perc_iva == max_pi
        tributos.append(crear_tributo(
            etiqueta_pi, base_iva, al_perc_iva, tipo_cambio,
            es_estimado_maximo=es_max_pi, rango_min_pct=min_pi, rango_max_pct=max_pi, a_confirmar=a_conf_pi
        ))

        # Percepción Ganancias
        al_perc_gan, min_pg, max_pg, a_conf_pg, etiqueta_pg = get_percepcion_ganancias(usar_maximo)
        es_max_pg = usar_maximo and al_perc_gan == max_pg
        tributos.append(crear_tributo(
            etiqueta_pg, base_iva, al_perc_gan, tipo_cambio,
            es_estimado_maximo=es_max_pg, rango_min_pct=min_pg, rango_max_pct=max_pg, a_confirmar=a_conf_pg
        ))

        # Percepción IIBB
        al_perc_iibb, min_piibb, max_piibb, a_conf_piibb, etiqueta_piibb = get_percepcion_iibb(usar_maximo)
        es_max_piibb = usar_maximo and al_perc_iibb == max_piibb
        tributos.append(crear_tributo(
            etiqueta_piibb, base_iva, al_perc_iibb, tipo_cambio,
            es_estimado_maximo=es_max_piibb, rango_min_pct=min_piibb, rango_max_pct=max_piibb, a_confirmar=a_conf_piibb
        ))

    total_usd = sum(t.monto_usd for t in tributos)
    total_ars = sum(t.monto_ars for t in tributos)
    pct_sobre_cif = redondear((total_usd / cif_usd) * Decimal("100")) if cif_usd > 0 else Decimal("0")
    costo_total_usd = cif_usd + total_usd
    costo_total_ars = redondear(costo_total_usd * tipo_cambio)
    costo_por_unidad_usd = redondear(costo_total_usd / datos.cantidad_unidades) if datos.cantidad_unidades > 0 else None
    costo_por_unidad_ars = redondear(costo_por_unidad_usd * tipo_cambio) if costo_por_unidad_usd else None

    # Régimen general siempre elegible (solo avisos)
    elegible = True

    escenario = EscenarioResultado(
        tributos=[TributoDetalle(
            nombre=t.nombre, base_usd=t.base_usd, alicuota_pct=redondear(t.alicuota * Decimal("100")),
            monto_usd=t.monto_usd, monto_ars=t.monto_ars,
            es_estimado_maximo=t.es_estimado_maximo, rango_min_pct=t.rango_min_pct,
            rango_max_pct=t.rango_max_pct, a_confirmar=t.a_confirmar
        ) for t in tributos],
        total_impuestos_usd=total_usd,
        total_impuestos_ars=total_ars,
        pct_sobre_cif=pct_sobre_cif,
        costo_total_puesto_pais_usd=costo_total_usd,
        costo_total_puesto_pais_ars=costo_total_ars,
        costo_por_unidad_usd=costo_por_unidad_usd,
        costo_por_unidad_ars=costo_por_unidad_ars
    )

    return RegimenResultado(
        regimen_id="regimen_general",
        regimen_nombre=reg_config.nombre,
        elegibilidad=ElegibilidadResultado(
            elegible=elegible,
            motivos=motivos_no_elegible,
            advertencias=advertencias
        ),
        escenario_conservador=escenario if usar_maximo else None,
        escenario_minimo=escenario if not usar_maximo else None,
        a_confirmar=reg_config.a_confirmar,
        advertencias_generales=advertencias
    )


# --- Función principal de cálculo ---

def calcular_todos_regimenes(datos: DatosEntrada) -> CalculoResponse:
    """Calcula los tres regímenes y devuelve respuesta completa"""

    # Validación DDP
    advertencias_globales = []
    if datos.envio_incluye_impuestos_ddp:
        advertencias_globales.append(
            "ADVERTENCIA: El envío ya incluye impuestos (DDP). Los tributos calculados NO deben sumarse al costo."
        )
        # En modo DDP, no calcular impuestos (o calcular pero marcar)
        # Para simplicidad, calculamos pero advertimos

    # Peso y volumen
    peso_vol = calcular_peso_volumen(datos)

    # CIF
    cif_usd = datos.precio_producto_usd + datos.costo_envio_usd + datos.seguro_usd
    cif_ars = redondear(cif_usd * datos.tipo_cambio_ars_usd)

    # Calcular cada régimen en ambos escenarios
    regimenes = []

    for regimen_func, regimen_id in [
        (calcular_pequenos_envios, "pequenos_envios"),
        (calcular_courier_comercial, "courier_comercial"),
        (calcular_regimen_general, "regimen_general")
    ]:
        conservador = regimen_func(datos, peso_vol, usar_maximo=True)
        minimo = regimen_func(datos, peso_vol, usar_maximo=False)

        # Combinar: conservador tiene escenario_conservador, minimo tiene escenario_minimo
        combinado = RegimenResultado(
            regimen_id=conservador.regimen_id,
            regimen_nombre=conservador.regimen_nombre,
            elegibilidad=conservador.elegibilidad,
            escenario_conservador=conservador.escenario_conservador,
            escenario_minimo=minimo.escenario_minimo,
            a_confirmar=conservador.a_confirmar,
            advertencias_generales=conservador.advertencias_generales
        )
        regimenes.append(combinado)

    # Determinar el más barato entre los elegibles
    regimen_mas_barato = None
    min_costo = None
    for r in regimenes:
        if r.elegibilidad.elegible in (True, None):  # Elegible o con advertencias
            costo = r.escenario_conservador.costo_total_puesto_pais_usd
            if min_costo is None or costo < min_costo:
                min_costo = costo
                regimen_mas_barato = r.regimen_id

    return CalculoResponse(
        datos_entrada=datos,
        cif_usd=cif_usd,
        cif_ars=cif_ars,
        peso_facturable_kg=peso_vol.peso_facturable_kg,
        peso_volumetrico_kg=peso_vol.peso_volumetrico_kg,
        volumen_m3=peso_vol.volumen_m3,
        usd_por_kg_flete=peso_vol.usd_por_kg_flete,
        regímenes=regimenes,
        regimen_mas_barato_elegible=regimen_mas_barato,
        advertencias_globales=advertencias_globales
    )