import type { BolsinResumen } from './api'
import { normalizar } from './formato'

/** Por que la busqueda quedo vacia: A1 (precinto), A2 (CM de origen) o la combinacion de los dos. */
export type SinResultados = 'precinto' | 'cm' | 'combinacion' | null

/**
 * Paso 4 del CU: filtrar el listado por numero de precinto y/o CM de origen.
 * No es logica de negocio: el gestor ya devolvio solo los bolsines enviados hacia la CM del usuario.
 */
export function filtrarBolsines(bolsines: BolsinResumen[], precinto: string, cm: string) {
  const p = precinto.trim()
  const c = normalizar(cm)
  const porPrecinto = (b: BolsinResumen) => !p || b.numeroPrecinto.includes(p)
  const porCm = (b: BolsinResumen) => !c || normalizar(b.cmOrigen).includes(c)

  const lista = bolsines.filter((b) => porPrecinto(b) && porCm(b))
  let sinResultados: SinResultados = null
  if (lista.length === 0 && bolsines.length > 0 && (p || c)) {
    if (p && !bolsines.some(porPrecinto)) sinResultados = 'precinto'
    else if (c && !bolsines.some(porCm)) sinResultados = 'cm'
    else sinResultados = 'combinacion'
  }
  return { lista, sinResultados }
}
