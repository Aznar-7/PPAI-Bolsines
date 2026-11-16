/** "hace 3 días", "hoy", "ayer": cuanto hace que salio el bolsin. */
export function haceCuanto(fechaIso: string | null, ahora = new Date()): string {
  if (!fechaIso) return 'sin fecha de envío'
  const dias = diasEsperando(fechaIso, ahora)
  if (dias <= 0) return 'enviado hoy'
  if (dias === 1) return 'enviado ayer'
  return `enviado hace ${dias} días`
}

/** Dias corridos desde que salio el bolsin (0 = hoy). */
export function diasEsperando(fechaIso: string | null, ahora = new Date()): number {
  if (!fechaIso) return 0
  return Math.floor((inicioDelDia(ahora) - inicioDelDia(new Date(fechaIso))) / 86_400_000)
}

function inicioDelDia(fecha: Date) {
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate()).getTime()
}

const fechaLarga = new Intl.DateTimeFormat('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
const fechaCorta = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

/** "lunes 16 de noviembre" */
export function hoyLargo(ahora = new Date()): string {
  return fechaLarga.format(ahora)
}

/** "13 nov, 09:40" */
export function fechaYHora(fechaIso: string | null): string {
  return fechaIso ? fechaCorta.format(new Date(fechaIso)) : 'Sin fecha'
}

/** ponytail: el peso del bolsin viene sin unidad en el modelo; se asume gramos. */
export function peso(gramos: number | null): string {
  if (gramos == null) return 'Sin registrar'
  return gramos >= 1000 ? `${(gramos / 1000).toLocaleString('es-AR', { maximumFractionDigits: 2 })} kg` : `${gramos} g`
}

export function saludo(ahora = new Date()): string {
  const hora = ahora.getHours()
  if (hora < 13) return 'Buen día'
  if (hora < 20) return 'Buenas tardes'
  return 'Buenas noches'
}

export function primerNombre(nombreCompleto: string): string {
  return nombreCompleto.split(' ')[0]
}

export function plural(cantidad: number, singular: string, plural: string): string {
  return `${cantidad} ${cantidad === 1 ? singular : plural}`
}

/** Para comparar CMs sin que importen mayusculas ni tildes ("cordoba" encuentra "CM Córdoba"). */
export function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim()
}
