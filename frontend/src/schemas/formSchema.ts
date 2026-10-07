import { z } from 'zod';

export const formSchema = z.object({
  // Campos principales - inicializados en 0
  precio_producto_usd: z.number().min(0.01, 'Ingresá el precio del producto').default(0),
  costo_envio_usd: z.number().min(0, 'El costo de envío no puede ser negativo').default(0),
  seguro_usd: z.number().min(0, 'El seguro no puede ser negativo').default(0),
  cantidad_productos: z.number().int().min(1, 'La cantidad debe ser al menos 1').default(0),
  max_unidades_misma_especie: z.number().int().min(1, 'Debe ser al menos 1').default(1),

  // Opciones avanzadas - opcionales (null si no se informan)
  algun_bulto_supera_50kg: z.boolean().optional(),
  ncm: z.string().optional(),
  derecho_importacion_pct: z.number().min(0).max(100).optional(),
  impuestos_internos_pct: z.number().min(0).max(100).optional(),
  tipo_cambio_ars_usd: z.number().min(0.01, 'El tipo de cambio es obligatorio').optional(),

  // Flags - con defaults
  envio_incluye_impuestos_ddp: z.boolean().default(false),
  requiere_organismo_externo: z.boolean().default(false),
  envios_usados_este_anio: z.number().int().min(0).max(10).default(0),

  // UI state (no se envía al backend)
  acordion_abierto: z.boolean().default(false),
});

export type FormInput = z.input<typeof formSchema>;
export type FormData = z.output<typeof formSchema>;