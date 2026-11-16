/** "hace 3 días", "hoy", "ayer": cuanto hace que salio el bolsin. */
export function haceCuanto(fechaIso: string | null, ahora = new Date()): string {
  if (!fechaIso) return 'sin fecha de envío'
  const dias = Math.floor((inicioDelDia(ahora) - inicioDelDia(new Date(fechaIso))) / 86_400_000)
  if (dias <= 0) return 'enviado hoy'
  if (dias === 1) return 'enviado ayer'
  return `enviado hace ${dias} días`
}

function inicioDelDia(fecha: Date) {
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate()).getTime()
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
