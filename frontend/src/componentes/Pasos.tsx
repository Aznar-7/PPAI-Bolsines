const PASOS = ['Elegir bolsín', 'Controlar', 'Confirmar'] as const

/** Asistente por pasos: donde esta la encargada dentro de la recepcion de un bolsin. */
export function Pasos({ actual }: { actual: 1 | 2 | 3 }) {
  return (
    <nav aria-label="Pasos de la recepción" style={{ viewTransitionName: 'pasos' }}>
      <ol className="flex items-center gap-2 text-sm sm:gap-3">
        {PASOS.map((nombre, i) => {
          const numero = i + 1
          const estado = numero < actual ? 'hecho' : numero === actual ? 'actual' : 'pendiente'
          return (
            <li key={nombre} className="flex items-center gap-2 sm:gap-3" aria-current={estado === 'actual' ? 'step' : undefined}>
              {i > 0 && (
                <span
                  aria-hidden
                  className={`h-0.5 w-5 rounded-full sm:w-10 ${numero <= actual ? 'bg-sello' : 'bg-linea-fuerte'}`}
                />
              )}
              <span
                className={`grid size-7 place-items-center rounded-full text-xs font-bold cifras transition-colors ${
                  estado === 'pendiente'
                    ? 'border-2 border-linea-fuerte text-tenue'
                    : 'bg-sello text-sobre-sello'
                }`}
              >
                {estado === 'hecho' ? (
                  <svg viewBox="0 0 16 16" className="size-3.5" aria-hidden>
                    <path d="M3 8.5l3 3 7-7" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  numero
                )}
              </span>
              <span className={estado === 'actual' ? 'font-semibold' : 'hidden text-tenue sm:inline'}>{nombre}</span>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
