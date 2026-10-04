import axios from "axios";
import type {
  DatosEntrada,
  CalculoResponse,
  AppConfigResponse,
  ConfigUpdateRequest,
  NCMSearchResult,
  TipoCambioResponse,
} from "../types/api";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

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
  const response = await api.get<TipoCambioResponse>("/api/tipo-cambio");
  return response.data;
}

export async function forzarActualizacionTipoCambio(): Promise<TipoCambioResponse> {
  const response = await api.post<TipoCambioResponse>("/api/tipo-cambio/forzar-actualizacion");
  return response.data;
}

export async function healthCheck(): Promise<{ status: string }> {
  const response = await api.get<{ status: string }>("/health");
  return response.data;
}

export default api;