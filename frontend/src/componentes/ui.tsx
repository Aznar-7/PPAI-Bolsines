import { ChevronRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'

export type Miga = { texto: string; a?: string }

/** Encabezado de cada pantalla: donde estoy (migas), que es y que hago aca. */
export function EncabezadoPagina({
  migas,
  titulo,
  descripcion,
  extra,
}: {
  migas: Miga[]
  titulo: ReactNode
  descripcion?: ReactNode
  extra?: ReactNode
}) {
  return (
    <header className="flex flex-col gap-5 border-b border-linea pb-6 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0">
        <nav aria-label="Estás en">
          <ol className="flex flex-wrap items-center gap-1 text-sm text-tenue">
            {migas.map((m, i) => (
              <li key={m.texto} className="flex items-center gap-1">
                {i > 0 && <ChevronRight aria-hidden className="size-3.5" />}
                {m.a ? (
                  <Link to={m.a} viewTransition className="rounded hover:text-sello hover:underline">
                    {m.texto}
                  </Link>
                ) : (
                  <span aria-current="page" className="text-grafito">
                    {m.texto}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </nav>
        <h1 className="mt-2 text-[1.75rem] leading-tight font-bold tracking-[-0.015em]">{titulo}</h1>
        {descripcion && <p className="mt-1.5 max-w-[65ch] text-tenue">{descripcion}</p>}
      </div>
      {extra && <div className="shrink-0">{extra}</div>}
    </header>
  )
}

/** Atajo de teclado visible, para que la encargada aprenda sin manual. */
export function Tecla({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-grid min-w-5 place-items-center rounded border border-linea-fuerte bg-hoja shadow-[0_1px_0_var(--color-linea-fuerte)] px-1 font-sans text-[0.6875rem] font-semibold text-tenue">
      {children}
    </kbd>
  )
}
