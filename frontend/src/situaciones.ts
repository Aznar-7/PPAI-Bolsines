import { Ban, CircleCheck, CircleMinus, Forward, type LucideIcon } from 'lucide-react'
import type { Marcas, Situacion } from './api'

/**
 * Las cuatro situaciones de un documento, con lo que significa cada una en palabras de la mesa de
 * entradas. Responde al dolor "¿que opcion elijo?": cada opcion se explica donde se elige.
 */
export const SITUACIONES: Record<
  Situacion,
  { etiqueta: string; estadoFinal: string; explicacion: string; icono: LucideIcon; color: string; fondo: string; borde: string; fila: string; solido: string }
> = {
  RECIBIDA: {
    etiqueta: 'Llegó',
    estadoFinal: 'Recibida y aceptada',
    explicacion: 'Está en el bolsín y es para tu comisión.',
    icono: CircleCheck,
    color: 'text-llego',
    fondo: 'bg-llego-claro',
    borde: 'border-llego',
    fila: 'bg-llego-claro/60',
    solido: 'bg-llego border-llego text-sobre-sello shadow-[0_1px_2px_rgb(0_0_0/0.18)]',
  },
  FALTANTE: {
    etiqueta: 'Falta',
    estadoFinal: 'No recibida',
    explicacion: 'Figura en el remito pero no vino. Se avisa al origen para que la vuelva a enviar.',
    icono: CircleMinus,
    color: 'text-falta',
    fondo: 'bg-falta-claro',
    borde: 'border-falta',
    fila: 'bg-falta-claro/60',
    solido: 'bg-falta border-falta text-sobre-sello shadow-[0_1px_2px_rgb(0_0_0/0.18)]',
  },
  NO_CORRESPONDE: {
    etiqueta: 'No corresponde',
    estadoFinal: 'Recibida y rechazada',
    explicacion: 'Vino, pero no es para tu comisión. Queda rechazada.',
    icono: Ban,
    color: 'text-rechazo',
    fondo: 'bg-rechazo-claro',
    borde: 'border-rechazo',
    fila: 'bg-rechazo-claro/60',
    solido: 'bg-rechazo border-rechazo text-sobre-sello shadow-[0_1px_2px_rgb(0_0_0/0.18)]',
  },
  REDIRIGIR: {
    etiqueta: 'Redirigir',
    estadoFinal: 'Para redirigir',
    explicacion: 'Vino bien, pero tiene que ir a otra área de la Comisión Médica Central.',
    icono: Forward,
    color: 'text-redirigir',
    fondo: 'bg-redirigir-claro',
    borde: 'border-redirigir',
    fila: 'bg-redirigir-claro/60',
    solido: 'bg-redirigir border-redirigir text-sobre-sello shadow-[0_1px_2px_rgb(0_0_0/0.18)]',
  },
}

/** Redirigir solo existe para la Comision Medica Central (A5). */
export function situacionesPara(cmEsCentral: boolean): Situacion[] {
  return cmEsCentral ? ['RECIBIDA', 'FALTANTE', 'NO_CORRESPONDE', 'REDIRIGIR'] : ['RECIBIDA', 'FALTANTE', 'NO_CORRESPONDE']
}

// Las marcas viven en el navegador mientras dura la recepcion: "Volver y revisar" y un error del
// gestor no le hacen perder nada a la encargada.
const clave = (idBolsin: number) => `bolsines-marcas-${idBolsin}`

export function leerMarcas(idBolsin: number): Marcas {
  try {
    return JSON.parse(sessionStorage.getItem(clave(idBolsin)) ?? '{}')
  } catch {
    return {}
  }
}

export function guardarMarcas(idBolsin: number, marcas: Marcas) {
  try {
    sessionStorage.setItem(clave(idBolsin), JSON.stringify(marcas))
  } catch {
    /* sin almacenamiento: las marcas duran lo que la pantalla */
  }
}

export function borrarMarcas(idBolsin: number) {
  try {
    sessionStorage.removeItem(clave(idBolsin))
  } catch {
    /* nada que borrar */
  }
}

/** Cuantos documentos hay en cada situacion. */
export function contar(marcas: Marcas): Record<Situacion, number> {
  const cuenta: Record<Situacion, number> = { RECIBIDA: 0, FALTANTE: 0, NO_CORRESPONDE: 0, REDIRIGIR: 0 }
  for (const s of Object.values(marcas)) cuenta[s]++
  return cuenta
}
