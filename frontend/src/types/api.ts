export type ModoTransporte = "aereo" | "maritimo";

export interface Bulto {
  largo_cm: number;
  ancho_cm: number;
  alto_cm: number;
  peso_kg: number;
}

export interface DatosEntrada {
  precio_producto_usd: number;
  costo_envio_usd: number;
  seguro_usd: number;
  modo_transporte: ModoTransporte;
  bultos: Bulto[];
  cantidad_unidades: number;
  impuestos_internos_pct: number;
  tipo_cambio_ars_usd: number;
  envio_incluye_impuestos_ddp: boolean;
  requiere_organismo_externo: boolean;
  incluir_percepciones: boolean;
  envios_usados_este_anio: number;
}

export interface TributoDetalle {
  nombre: string;
  base_usd: number;
  alicuota_pct: number;
  monto_usd: number;
  monto_ars: number;
  es_estimado_maximo: boolean;
  rango_min_pct?: number | null;
  rango_max_pct?: number | null;
  a_confirmar: boolean;
}

export interface EscenarioResultado {
  tributos: TributoDetalle[];
  total_impuestos_usd: number;
  total_impuestos_ars: number;
  pct_sobre_cif: number;
  costo_total_puesto_pais_usd: number;
  costo_total_puesto_pais_ars: number;
  costo_por_unidad_usd?: number | null;
  costo_por_unidad_ars?: number | null;
}

export interface ElegibilidadResultado {
  elegible: boolean | null;
  motivos: string[];
  advertencias: string[];
}

export interface RegimenResultado {
  regimen_id: string;
  regimen_nombre: string;
  elegibilidad: ElegibilidadResultado;
  escenario_conservador?: EscenarioResultado | null;
  escenario_minimo?: EscenarioResultado | null;
  a_confirmar: boolean;
  advertencias_generales: string[];
}

export interface CalculoResponse {
  datos_entrada: DatosEntrada;
  cif_usd: number;
  cif_ars: number;
  peso_facturable_kg: number;
  peso_volumetrico_kg?: number | null;
  volumen_m3?: number | null;
  usd_por_kg_flete?: number | null;
  regímenes: RegimenResultado[];
  regimen_mas_barato_elegible?: string | null;
  advertencias_globales: string[];
}

export interface AliquotaConfig {
  minimo: number;
  maximo: number;
  valor_aplicado: number;
  etiqueta: string;
  a_confirmar: boolean;
}

export interface TopesPequeñosEnvios {
  franquicia_usd: number;
  limite_fob_usd: number;
  limite_peso_kg_por_bulto: number;
  max_unidades_misma_especie: number;
  max_envios_por_anio: number;
  a_confirmar: boolean;
}

export interface TopesCourierComercial {
  limite_fob_usd: number;
  limite_peso_kg_por_bulto: number;
  a_confirmar: boolean;
}

export interface TopesRegimenGeneral {
  sin_limite_valor: boolean;
  sin_limite_peso: boolean;
  a_confirmar: boolean;
}

export interface TopesConfig {
  pequenos_envios: TopesPequeñosEnvios;
  courier_comercial: TopesCourierComercial;
  regimen_general: TopesRegimenGeneral;
}

export interface RegimenPequeñosEnvios {
  nombre: string;
  derecho_importacion_sobre_excedente: boolean;
  tasa_estadistica_sobre_excedente: boolean;
  iva_sobre_valor_total: boolean;
  incluir_flete_seguro_base_iva: boolean;
  franquicia_activa_si_envios_menor_5: boolean;
  a_confirmar: boolean;
  advertencias: string[];
}

export interface RegimenCourierComercial {
  nombre: string;
  derecho_importacion_porcentaje_fijo: number;
  tasa_estadistica_porcentaje: number;
  iva_sobre_cif_mas_derecho_tasa: boolean;
  sin_percepciones: boolean;
  sin_franquicia: boolean;
  a_confirmar: boolean;
  advertencias: string[];
}

export interface RegimenGeneral {
  nombre: string;
  derecho_importacion_por_ncm: boolean;
  tasa_estadistica_porcentaje: number;
  iva_sobre_cif_mas_derecho_tasa: boolean;
  percepciones_opcionales: boolean;
  requiere_despachante: boolean;
  requiere_inscripcion_importador: boolean;
  a_confirmar: boolean;
  advertencias: string[];
}

export interface RegimenesConfig {
  pequenos_envios: RegimenPequeñosEnvios;
  courier_comercial: RegimenCourierComercial;
  regimen_general: RegimenGeneral;
}

export interface NCMEjemplo {
  ncm: string;
  descripcion: string;
  derecho_importacion: number;
  iva: number;
}

export interface TipoCambioConfig {
  valor_defecto: number;
  etiqueta: string;
  a_confirmar: boolean;
}

export interface PesoVolumetricoConfig {
  divisor_aereo: number;
  a_confirmar: boolean;
}

export interface RedondeoConfig {
  decimales: number;
  modo: string;
}

export interface AppConfigResponse {
  vigencia_desde: string;
  tipo_cambio: TipoCambioConfig;
  peso_volumetrico: PesoVolumetricoConfig;
  topes: TopesConfig;
  aliquotas: Record<string, AliquotaConfig>;
  regimenes: RegimenesConfig;
  ncm_ejemplos: NCMEjemplo[];
  redondeo: RedondeoConfig;
}

export interface ConfigUpdateRequest {
  tipo_cambio?: TipoCambioConfig | null;
  peso_volumetrico?: PesoVolumetricoConfig | null;
  topes?: TopesConfig | null;
  aliquotas?: Record<string, AliquotaConfig> | null;
  regimenes?: RegimenesConfig | null;
  ncm_ejemplos?: NCMEjemplo[] | null;
  redondeo?: RedondeoConfig | null;
}

export interface NCMSearchResult {
  ncm: string;
  descripcion: string;
  derecho_importacion: number;
  iva: number;
}

export interface TipoCambioResponse {
  valor: number;
  fuente: string;
  fecha: string;
  desde_cache: boolean;
}