import axios from "axios";
import type {
  DatosEntrada,
  CalculoResponse,
  AppConfigResponse,
  ConfigUpdateRequest,
  NCMSearchResult,
  TipoCambioResponse,
} from "../types/api";

const API_BASE = import.meta.env.VITE_API_BASE || "https://calculadora-impuestos-ht7z.onrender.com";
const DOLAR_API_URL = "https://dolarapi.com/v1/dolares/bolsa";

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

export async function calcularImpuestos(datos: DatosEntrada): Promise<CalculoResponse> {
  const response = await api.post<CalculoResponse>("/api/calcular", datos);
  return response.data;
}

export async function obtenerConfig(): Promise<AppConfigResponse> {
  const response = await api.get<AppConfigResponse>("/api/config");
  return response.data;
}

export async function actualizarConfig(updates: ConfigUpdateRequest): Promise<AppConfigResponse> {
  const response = await api.put<AppConfigResponse>("/api/config", updates);
  return response.data;
}

export async function buscarNCM(q: string): Promise<NCMSearchResult[]> {
  const response = await api.get<NCMSearchResult[]>("/api/ncm", { params: { q } });
  return response.data;
}

export async function obtenerTipoCambio(): Promise<TipoCambioResponse> {
  const response = await axios.get<{ venta: number; fechaActualizacion: string }>(DOLAR_API_URL, { timeout: 10000 });
  return {
    valor: response.data.venta,
    fuente: "dolarapi.com",
    fecha: response.data.fechaActualizacion,
    desde_cache: false,
  };
}

export async function forzarActualizacionTipoCambio(): Promise<TipoCambioResponse> {
  return obtenerTipoCambio();
}

export async function healthCheck(): Promise<{ status: string }> {
  const response = await api.get<{ status: string }>("/health");
  return response.data;
}

export default api;