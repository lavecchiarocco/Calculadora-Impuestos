import pytest
from decimal import Decimal

from app.engine.calculadora import calcular_todos_regimenes
from app.schemas.calculadora import DatosEntrada
from app.config.loader import load_config, reload_config


@pytest.fixture(autouse=True)
def reset_config():
    """Recargar config antes de cada test para asegurar aislamiento"""
    reload_config()
    yield
    reload_config()


def crear_datos_base(**kwargs) -> DatosEntrada:
    """Crea datos de entrada base para tests"""
    defaults = {
        "precio_producto_usd": Decimal("1000"),
        "costo_envio_usd": Decimal("200"),
        "seguro_usd": Decimal("0"),
        "cantidad_productos": 1,
        "impuestos_internos_pct": Decimal("0"),
        "tipo_cambio_ars_usd": Decimal("1000"),
        "envio_incluye_impuestos_ddp": False,
        "requiere_organismo_externo": False,
        "algun_bulto_supera_50kg": False,
        "envios_usados_este_anio": 0,
    }
    defaults.update(kwargs)
    return DatosEntrada(**defaults)


class TestCourierComercial:
    """Tests para Courier Comercial (DIS)"""

    def test_courier_comercial_basico(self):
        """Producto USD 1.000 + envío USD 200 → CIF 1.200, derecho 240, tasa 36, IVA 309,96, total 585,96"""
        datos = crear_datos_base(
            precio_producto_usd=Decimal("1000"),
            costo_envio_usd=Decimal("200"),
        )
        resultado = calcular_todos_regimenes(datos)

        courier = next(r for r in resultado.regímenes if r.regimen_id == "courier_comercial")
        conservador = courier.escenario_conservador

        # Verificar CIF
        assert resultado.cif_usd == Decimal("1200")

        # Verificar tributos
        tributos = {t.nombre: t for t in conservador.tributos}

        # Derecho 20% sobre CIF = 240
        assert tributos["Derecho de importación (20% fijo)"].monto_usd == Decimal("240.00")

        # Tasa 3% sobre CIF = 36
        assert tributos["Tasa de estadística (3%)"].monto_usd == Decimal("36.00")

        # IVA 21% sobre (CIF + derecho + tasa) = 1200 + 240 + 36 = 1476 * 0.21 = 309.96
        assert tributos["IVA"].monto_usd == Decimal("309.96")

        # Percepciones: 20% + 6% sobre USD 1.476; courier: cargo fijo USD 25.
        assert conservador.total_impuestos_usd == Decimal("969.72")
        assert conservador.total_cargos_usd == Decimal("25.00")

        # Los cargos operativos no se cuentan como impuestos, pero sí en el costo total.
        assert conservador.costo_total_puesto_pais_usd == Decimal("2194.72")
        tributos = {t.nombre: t for t in conservador.tributos}
        assert tributos["Percepción IVA Adicional"].base_usd == Decimal("1476.00")
        assert tributos["Percepción IVA Adicional"].monto_usd == Decimal("295.20")
        assert tributos["Anticipo de Ganancias"].monto_usd == Decimal("88.56")
        assert tributos["Honorarios de Courier (Handling/Desconsolidación)"].tipo == "cargo"


class TestPequeñosEnvios:
    """Tests para Pequeños Envíos (Courier personal / Correo Argentino)"""

    def test_pequenos_envios_fob_300_solo_iva(self):
        """FOB USD 300 (≤ 400): solo paga IVA 21% sobre valor total"""
        datos = crear_datos_base(
            precio_producto_usd=Decimal("300"),
            costo_envio_usd=Decimal("50"),
            seguro_usd=Decimal("0"),
            envios_usados_este_anio=0,
        )
        resultado = calcular_todos_regimenes(datos)

        pequenos = next(r for r in resultado.regímenes if r.regimen_id == "pequenos_envios")
        conservador = pequenos.escenario_conservador

        # FOB 300 ≤ 400, con franquicia activa (envios < 5)
        # Solo IVA sobre CIF (300 + 50 = 350) * 21% = 73.50
        tributos = {t.nombre: t for t in conservador.tributos}
        assert "IVA" in tributos
        assert conservador.total_impuestos_usd == Decimal("73.50")
        assert tributos["Franquicia uso personal"].tipo == "informativo"
        assert tributos["Franquicia uso personal"].base_usd == Decimal("300")
        assert tributos["Tasa de Presentación a Aduana"].monto_usd == Decimal("0.00")

        # No debe haber derecho ni tasa
        nombres = [t.nombre for t in conservador.tributos]
        assert "Derecho de importación" not in " ".join(nombres)
        assert "Tasa de estadística" not in " ".join(nombres)

    def test_pequenos_envios_fob_600_excedente(self):
        """FOB USD 600 (> 400): derecho y tasa solo sobre excedente USD 200, IVA sobre total"""
        datos = crear_datos_base(
            precio_producto_usd=Decimal("600"),
            costo_envio_usd=Decimal("100"),
            seguro_usd=Decimal("0"),
            envios_usados_este_anio=0,
        )
        resultado = calcular_todos_regimenes(datos)

        pequenos = next(r for r in resultado.regímenes if r.regimen_id == "pequenos_envios")
        conservador = pequenos.escenario_conservador

        # FOB 600, franquicia 400, excedente = 200
        # Derecho 35% sobre 200 = 70
        # Tasa 3% sobre 200 = 6
        # IVA 21% sobre CIF (600 + 100 = 700) = 147
        # Total = 70 + 6 + 147 = 223
        tributos = {t.nombre: t for t in conservador.tributos}

        # Buscar derecho (puede tener nombre variable)
        derecho = next(t for t in conservador.tributos if "Derecho" in t.nombre)
        assert derecho.base_usd == Decimal("200")  # Solo sobre excedente
        assert derecho.monto_usd == Decimal("70.00")

        tasa = next(t for t in conservador.tributos if "Tasa" in t.nombre)
        assert tasa.base_usd == Decimal("200")
        assert tasa.monto_usd == Decimal("6.00")

        franquicia = next(t for t in conservador.tributos if t.nombre == "Franquicia uso personal")
        assert franquicia.base_usd == Decimal("400")
        assert franquicia.tipo == "informativo"
        assert not any("Arancel Único" in t.nombre for t in conservador.tributos)
        iva = next(t for t in conservador.tributos if "IVA" in t.nombre)
        assert iva.base_usd == Decimal("700")  # Sobre CIF total
        assert iva.monto_usd == Decimal("147.00")

        assert conservador.total_impuestos_usd == Decimal("223.00")

    def test_pequenos_envios_5_envios_sin_franquicia(self):
        """Con 5 envíos ya usados: no hay franquicia, tributa sobre total"""
        datos = crear_datos_base(
            precio_producto_usd=Decimal("300"),
            costo_envio_usd=Decimal("50"),
            envios_usados_este_anio=5,  # 5 o más = sin franquicia
        )
        resultado = calcular_todos_regimenes(datos)

        pequenos = next(r for r in resultado.regímenes if r.regimen_id == "pequenos_envios")
        conservador = pequenos.escenario_conservador

        # Sin franquicia: derecho y tasa sobre FOB total (300)
        # Derecho 35% * 300 = 105
        # Tasa 3% * 300 = 9
        # IVA 21% * CIF (350) = 73.50
        # Total = 105 + 9 + 73.50 = 187.50
        tributos = {t.nombre: t for t in conservador.tributos}

        derecho = next(t for t in conservador.tributos if "Derecho" in t.nombre)
        assert derecho.base_usd == Decimal("300")  # Sobre FOB total
        assert derecho.monto_usd == Decimal("105.00")

        tasa = next(t for t in conservador.tributos if "Tasa" in t.nombre)
        assert tasa.base_usd == Decimal("300")
        assert tasa.monto_usd == Decimal("9.00")

        assert conservador.total_impuestos_usd == Decimal("187.50")


class TestRegimenGeneral:
    """Tests para Régimen General"""

    def test_regimen_general_y_courier_cif_1025(self):
        """El régimen general usa el derecho NCM y DIS conserva su tarifa fija."""
        datos = crear_datos_base(
            precio_producto_usd=Decimal("1025"),
            costo_envio_usd=Decimal("0"),
            ncm="9503.00.00",
        )
        resultado = calcular_todos_regimenes(datos)

        general = next(r for r in resultado.regímenes if r.regimen_id == "regimen_general")
        courier = next(r for r in resultado.regímenes if r.regimen_id == "courier_comercial")

        assert general.escenario_conservador.total_impuestos_usd == Decimal("1089.68")
        assert general.escenario_conservador.total_cargos_usd == Decimal("40.50")
        assert general.escenario_conservador.costo_total_puesto_pais_usd == Decimal("2155.18")
        assert courier.escenario_conservador.total_impuestos_usd == Decimal("828.31")
        assert courier.escenario_conservador.total_cargos_usd == Decimal("25.00")

    def test_derecho_manual_cero_sigue_siendo_un_override_valido(self):
        """Un cero ingresado explícitamente no debe confundirse con un campo vacío."""
        datos = crear_datos_base(
            precio_producto_usd=Decimal("1025"),
            costo_envio_usd=Decimal("0"),
            ncm="9503.00.00",
            derecho_importacion_pct=Decimal("0"),
        )
        resultado = calcular_todos_regimenes(datos)

        general = next(r for r in resultado.regímenes if r.regimen_id == "regimen_general")

        assert general.escenario_conservador.total_impuestos_usd == Decimal("553.35")

    def test_regimen_general_incluye_percepciones_con_flag_legacy_desactivado(self):
        """El campo legacy no excluye las percepciones estimadas."""
        datos = crear_datos_base(
            precio_producto_usd=Decimal("1000"),
            costo_envio_usd=Decimal("200"),
            incluir_percepciones=False,
        )
        resultado = calcular_todos_regimenes(datos)

        general = next(r for r in resultado.regímenes if r.regimen_id == "regimen_general")
        conservador = general.escenario_conservador

        # Derecho 35% sobre CIF (1200) = 420
        # Tasa 3% sobre CIF = 36
        # IVA 21% sobre (1200 + 420 + 36) = 1656 * 0.21 = 347.76
        # Additional estimate lines are always applied; cargo operativo is kept separate.
        tributos = {t.nombre: t for t in conservador.tributos}

        derecho = next(t for t in conservador.tributos if "Derecho" in t.nombre)
        assert derecho.monto_usd == Decimal("420.00")

        tasa = next(t for t in conservador.tributos if "Tasa" in t.nombre)
        assert tasa.monto_usd == Decimal("36.00")

        iva = next(t for t in conservador.tributos if t.nombre == "IVA")
        assert iva.monto_usd == Decimal("347.76")

        assert conservador.total_impuestos_usd == Decimal("1275.72")
        assert conservador.total_cargos_usd == Decimal("44.00")
        assert conservador.costo_total_puesto_pais_usd == Decimal("2519.72")

    def test_regimen_general_incluye_percepciones_con_flag_legacy_activado(self):
        """Las percepciones se incluyen aunque un cliente legacy las solicite."""
        datos = crear_datos_base(
            precio_producto_usd=Decimal("1000"),
            costo_envio_usd=Decimal("200"),
            incluir_percepciones=True,
        )
        resultado = calcular_todos_regimenes(datos)

        general = next(r for r in resultado.regímenes if r.regimen_id == "regimen_general")
        conservador = general.escenario_conservador

        # Base IVA = CIF + derecho + tasa = 1200 + 420 + 36 = 1656
        # Percepción IVA 20% * 1656 = 331.20
        # Anticipo de Ganancias 6% * 1656 = 99.36
        # Percepción IIBB 2.5% * 1656 = 41.40
        # Total percepciones = 471.96
        # Total impuestos = 803.76 + 471.96 = 1275.72

        tributos = {t.nombre: t for t in conservador.tributos}

        perc_iva = next(t for t in conservador.tributos if "Percepción IVA" in t.nombre)
        assert perc_iva.monto_usd == Decimal("331.20")

        perc_gan = next(t for t in conservador.tributos if "Ganancias" in t.nombre)
        assert perc_gan.monto_usd == Decimal("99.36")

        perc_iibb = next(t for t in conservador.tributos if "IIBB" in t.nombre)
        assert perc_iibb.monto_usd == Decimal("41.40")
        assert perc_iva.base_usd == Decimal("1656.00")
        assert perc_gan.base_usd == Decimal("1656.00")
        assert perc_iibb.base_usd == Decimal("1656.00")
        assert perc_iva.alicuota_pct == Decimal("20.00")
        assert perc_gan.alicuota_pct == Decimal("6.00")
        assert perc_iibb.alicuota_pct == Decimal("2.50")

        assert conservador.total_impuestos_usd == Decimal("1275.72")
        assert conservador.total_cargos_usd == Decimal("44.00")

    def test_regimen_general_con_ncm(self):
        """Régimen general con NCM que define derecho 0% (ej. laptops)"""
        datos = crear_datos_base(
            precio_producto_usd=Decimal("1000"),
            costo_envio_usd=Decimal("200"),
            ncm="8471.30.00",  # Laptops: derecho 0%, IVA 10.5%
        )
        resultado = calcular_todos_regimenes(datos)

        general = next(r for r in resultado.regímenes if r.regimen_id == "regimen_general")
        conservador = general.escenario_conservador

        # NCM 8471.30.00: derecho 0%, IVA 10.5%
        # Derecho = 0
        # Tasa 3% * 1200 = 36
        # IVA 10.5% * (1200 + 0 + 36) = 1236 * 0.105 = 129.78
        # Total = 0 + 36 + 129.78 = 165.78

        tributos = {t.nombre: t for t in conservador.tributos}

        derecho = next(t for t in conservador.tributos if "Derecho" in t.nombre)
        assert derecho.monto_usd == Decimal("0.00")
        assert derecho.alicuota_pct == Decimal("0")

        iva = next(t for t in conservador.tributos if "IVA" in t.nombre)
        assert iva.alicuota_pct == Decimal("10.5")
        assert iva.monto_usd == Decimal("129.78")

        assert conservador.total_impuestos_usd == Decimal("518.04")


class TestEscenariosConservadorMinimo:
    """Tests para escenarios conservador (máximos) y mínimo (mínimos)"""

    def test_escenarios_conservador_vs_minimo(self):
        """Verificar que conservador usa máximos y mínimo usa mínimos"""
        datos = crear_datos_base(
            precio_producto_usd=Decimal("1000"),
            costo_envio_usd=Decimal("200"),
        )
        resultado = calcular_todos_regimenes(datos)

        general = next(r for r in resultado.regímenes if r.regimen_id == "regimen_general")

        # Conservador: derecho 35%, IVA 21%, percepciones máximas
        # Mínimo: derecho 0%, IVA 10.5%, percepciones mínimas
        assert general.escenario_conservador is not None
        assert general.escenario_minimo is not None

        cons_total = general.escenario_conservador.total_impuestos_usd
        min_total = general.escenario_minimo.total_impuestos_usd

        assert cons_total > min_total  # Conservador siempre mayor o igual


class TestDDP:
    """Tests para envío DDP (ya incluye impuestos)"""

    def test_ddp_advertencia(self):
        """Si DDP activo, debe mostrar advertencia global"""
        datos = crear_datos_base(
            precio_producto_usd=Decimal("1000"),
            costo_envio_usd=Decimal("200"),
            envio_incluye_impuestos_ddp=True,
        )
        resultado = calcular_todos_regimenes(datos)

        assert any("DDP" in adv for adv in resultado.advertencias_globales)
        assert "ya incluye impuestos" in resultado.advertencias_globales[0]


class TestAdvertenciasElegibilidad:
    """Tests para advertencias de elegibilidad"""

    def test_algun_bulto_supera_50kg_pequenos_envios(self):
        """Algún bulto supera 50 kg → no elegible en pequeños envíos"""
        datos = crear_datos_base(
            precio_producto_usd=Decimal("500"),
            algun_bulto_supera_50kg=True,
        )
        resultado = calcular_todos_regimenes(datos)

        pequenos = next(r for r in resultado.regímenes if r.regimen_id == "pequenos_envios")
        assert pequenos.elegibilidad.elegible is False
        assert any("50 kg" in m for m in pequenos.elegibilidad.motivos)

    def test_algun_bulto_supera_50kg_courier_comercial(self):
        """Algún bulto supera 50 kg → no elegible en courier comercial"""
        datos = crear_datos_base(
            precio_producto_usd=Decimal("500"),
            algun_bulto_supera_50kg=True,
        )
        resultado = calcular_todos_regimenes(datos)

        courier = next(r for r in resultado.regímenes if r.regimen_id == "courier_comercial")
        assert courier.elegibilidad.elegible is False
        assert any("50 kg" in m for m in courier.elegibilidad.motivos)

    def test_mas_de_3000_usd_pequenos_envios(self):
        """Más de USD 3000 FOB → no elegible en pequeños envíos"""
        datos = crear_datos_base(
            precio_producto_usd=Decimal("4000"),
            costo_envio_usd=Decimal("200"),
        )
        resultado = calcular_todos_regimenes(datos)

        pequenos = next(r for r in resultado.regímenes if r.regimen_id == "pequenos_envios")
        assert pequenos.elegibilidad.elegible is False
        assert any("3000" in m for m in pequenos.elegibilidad.motivos)

    def test_mas_de_3_unidades_misma_especie(self):
        """Más de 3 productos de la misma especie → no elegible en pequeños envíos"""
        datos = crear_datos_base(
            precio_producto_usd=Decimal("500"),
            cantidad_productos=5,
        )
        resultado = calcular_todos_regimenes(datos)

        pequenos = next(r for r in resultado.regímenes if r.regimen_id == "pequenos_envios")
        assert pequenos.elegibilidad.elegible is False
        assert any("misma especie" in m for m in pequenos.elegibilidad.motivos)

    def test_organismo_externo_pequenos_envios(self):
        """Requiere organismo externo → no elegible en pequeños envíos"""
        datos = crear_datos_base(
            precio_producto_usd=Decimal("500"),
            requiere_organismo_externo=True,
        )
        resultado = calcular_todos_regimenes(datos)

        pequenos = next(r for r in resultado.regímenes if r.regimen_id == "pequenos_envios")
        assert pequenos.elegibilidad.elegible is False
        assert any("organismo externo" in m.lower() for m in pequenos.elegibilidad.motivos)

    def test_organismo_externo_courier_comercial(self):
        """Requiere organismo externo → no elegible en courier comercial"""
        datos = crear_datos_base(
            precio_producto_usd=Decimal("500"),
            requiere_organismo_externo=True,
        )
        resultado = calcular_todos_regimenes(datos)

        courier = next(r for r in resultado.regímenes if r.regimen_id == "courier_comercial")
        assert courier.elegibilidad.elegible is False
        assert any("organismo externo" in m.lower() for m in courier.elegibilidad.motivos)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])