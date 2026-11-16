// Nombres visibles de los estados de reserva (mismos nombres en toda la plataforma)
export const ESTADOS = {
  libre: "Libre",
  confirmada: "Confirmada",
  pendiente_pago: "Pendiente de pago",
  en_validacion: "En validación",
  rechazada: "Rechazada",
  vencida: "Vencida",
  cancelada: "Cancelada",
  asistio: "Asistió",
  no_asistio: "No asistió",
  fuera_de_servicio: "Fuera de servicio",
} as const;
export type EstadoVisible = keyof typeof ESTADOS;

export const METODOS: Record<string, string> = {
  tarjeta: "Tarjeta crédito o débito",
  pse: "PSE",
  nequi: "Nequi",
  daviplata: "Daviplata",
  transferencia: "Transferencia o consignación",
  caja: "Pago en caja",
};

export const ROLES_USUARIO: Record<string, string> = {
  estudiante: "Estudiante",
  docente: "Docente",
  administrativo: "Administrativo",
  egresado: "Egresado",
  externo: "Externo",
};

export const ROLES_PERSONAL: Record<string, string> = {
  tesoreria: "Tesorería",
  bienestar: "Bienestar · Deportes",
  administrador: "Administrador",
};

export const ACTIVAS = ["confirmada", "pendiente_pago", "en_validacion", "asistio", "no_asistio"] as const;
