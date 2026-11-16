// Lo que devuelve PantallaRecepcionDeBolsines (los records de control/dto, tal cual).

export type BolsinResumen = {
  id: number
  numeroBolsin: number
  numeroPrecinto: string
  cmOrigen: string
  cantidadRemitos: number
  cantidadDocumentos: number
  peso: number | null
  fechaEnvio: string | null
}

export type InicioRecepcion = {
  nombreEmpleado: string
  cmUsuario: string
  cmEsCentral: boolean
  bolsines: BolsinResumen[]
}

export type DocumentacionVista = { id: number; numero: number; asunto: string; tipo: string }
export type RemitoVista = { numero: number; documentacion: DocumentacionVista[] }
export type DetalleBolsin = { bolsin: BolsinResumen; cmDestino: string; remitos: RemitoVista[] }

export type EstadoSesion = { logueado: boolean; modoDePrueba: boolean }

/** Como llego cada documentacion (SituacionRecepcion en el back). */
export type Situacion = 'RECIBIDA' | 'FALTANTE' | 'NO_CORRESPONDE' | 'REDIRIGIR'
export type Marcas = Record<number, Situacion>

export type ResumenRecepcion = {
  bolsin: DetalleBolsin
  estadoFinalBolsin: string
  remitos: { numero: number; estadoFinal: string }[]
  documentacion: { id: number; remito: number; asunto: string; tipo: string; situacion: Situacion }[]
  cmANotificar: string[]
}

export type AvisoNotificacion = { cmDestino: string; email: string; asunto: string; detalle: string[] }

export type ResultadoRecepcion = {
  fechaHora: string
  responsable: string
  resumen: ResumenRecepcion
  avisos: AvisoNotificacion[]
}

/** Error que el back explica en un ProblemDetail: el front muestra `mensaje` tal cual. */
export class ErrorApi extends Error {
  readonly estado: number
  constructor(estado: number, mensaje: string) {
    super(mensaje)
    this.estado = estado
  }
}

/** Si la sesion vencio a mitad de algo, al ingreso y despues de vuelta a donde estaba. */
export function alIngreso(volver = location.pathname + location.search): string {
  return `/ingreso?volver=${encodeURIComponent(volver)}`
}

async function pedir<T>(url: string, init?: RequestInit): Promise<T> {
  let respuesta: Response
  try {
    respuesta = await fetch(url, {
      ...init,
      headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...init?.headers },
    })
  } catch {
    throw new ErrorApi(0, 'No hay conexión con el sistema. Revisá que el servidor esté corriendo.')
  }
  if (respuesta.status === 204) return undefined as T
  const cuerpo = await respuesta.json().catch(() => null)
  if (!respuesta.ok) {
    throw new ErrorApi(respuesta.status, cuerpo?.detail ?? 'El sistema no pudo completar la acción.')
  }
  return cuerpo as T
}

export const api = {
  sesion: () => pedir<EstadoSesion>('/api/sesion'),
  ingresar: (usuario: string, contrasena: string) =>
    pedir<void>('/api/sesion', { method: 'POST', body: JSON.stringify({ usuario, contrasena }) }),
  salir: () => pedir<void>('/api/sesion', { method: 'DELETE' }),
  opcionRegistrarRecepcionDelBolsin: () => pedir<InicioRecepcion>('/api/recepcion'),
  tomarSeleccionBolsin: (id: number) => pedir<DetalleBolsin>(`/api/recepcion/${id}`),
  tomarSeleccionRecepcionBolsin: (marcas: Marcas) =>
    pedir<ResumenRecepcion>('/api/recepcion/seleccion', { method: 'POST', body: JSON.stringify(marcas) }),
  tomarConfirmacionRegistro: () => pedir<ResultadoRecepcion>('/api/recepcion/confirmacion', { method: 'POST' }),
  cancelar: () => pedir<void>('/api/recepcion/seleccion', { method: 'DELETE' }),
}
