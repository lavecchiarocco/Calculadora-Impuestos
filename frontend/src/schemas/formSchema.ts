import { z } from 'zod';

export const bultoSchema = z.object({
  largo_cm: z.number().min(0.1, 'El largo debe ser mayor a 0'),
  ancho_cm: z.number().min(0.1, 'El ancho debe ser mayor a 0'),
  alto_cm: z.number().min(0.1, 'El alto debe ser mayor a 0'),
  peso_kg: z.number().min(0.01, 'El peso debe ser mayor a 0'),
});

export const formSchema = z.object({
  // Paso 1: Cotización del proveedor
  precio_producto_usd: z.number().min(0.01, 'Ingresá el precio del producto'),
  costo_envio_usd: z.number().min(0, 'El costo de envío no puede ser negativo'),
  seguro_usd: z.number().min(0, 'El seguro no puede ser negativo').default(0),
  modo_transporte: z.enum(['aereo', 'maritimo'], { message: 'Selecciona un modo de transporte' }),

  // Paso 2: Envío y bultos
  bultos: z.array(bultoSchema).min(1, 'Agregá al menos un bulto'),
  cantidad_unidades: z.number().int().min(1, 'La cantidad debe ser al menos 1'),

  // Paso 3: Producto e impuestos
  impuestos_internos_pct: z.number().min(0).max(100).default(0),
  tipo_cambio_ars_usd: z.number().min(0.01, 'El tipo de cambio es obligatorio'),

  // Paso 4: Opciones avanzadas (opcionales)
  envio_incluye_impuestos_ddp: z.boolean().default(false),
  requiere_organismo_externo: z.boolean().default(false),
  incluir_percepciones: z.boolean().default(false),
  envios_usados_este_anio: z.number().int().min(0).max(10).default(0),
});

export type FormInput = z.input<typeof formSchema>;
export type FormData = z.output<typeof formSchema>;
export type BultoData = z.infer<typeof bultoSchema>;