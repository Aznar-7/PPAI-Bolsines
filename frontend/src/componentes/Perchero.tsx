import { motion, useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import type { BolsinResumen } from '../api'
import { haceCuanto, plural } from '../formato'

const ANCHO_PRECINTO = 128 // w-32
const SEPARACION = 20 // gap-5
const LARGOS = [34, 56, 42, 62, 38, 50, 44]
const GIROS = [-3, 2, -1.5, 3, -2, 1, -2.5]

/**
 * Los bolsines pendientes como precintos colgados de un perchero, igual que en la mesa de entradas.
 * Todos cuelgan del mismo fleje: entran los que caben en el ancho y el resto se resume en un ultimo
 * precinto "y N mas". Es el unico momento orquestado de la app: al entrar caen y se acomodan.
 */
export function Perchero({ bolsines, idMasViejo }: { bolsines: BolsinResumen[]; idMasViejo?: number }) {
  const quieto = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const lugares = useLugares(ref)
  const sobran = bolsines.length > lugares
  const visibles = sobran ? bolsines.slice(0, Math.max(1, lugares - 1)) : bolsines
  const resto = bolsines.length - visibles.length

  return (
    <div ref={ref} className="relative">
      <div aria-hidden className="h-2 rounded-full bg-linea-fuerte shadow-[inset_0_-1px_0_rgb(0_0_0/0.15)]" />
      <ul className="flex justify-center gap-5" aria-label="Precintos de los bolsines por recibir">
        {visibles.map((b, i) => (
          <Colgante key={b.id} indice={i} quieto={quieto}>
            <Link
              to={`/recepcion/${b.id}`}
              viewTransition
              className="group flex flex-col items-center rounded-lg focus-visible:outline-offset-4"
              aria-label={`Recibir el bolsín del precinto ${b.numeroPrecinto}, desde ${b.cmOrigen}, ${haceCuanto(b.fechaEnvio)}`}
            >
              <Fleje largo={LARGOS[i % LARGOS.length]} />
              <span
                className="relative flex w-32 flex-col items-center rounded-[12px] bg-precinto px-2.5 pt-6 pb-3.5 text-tinta shadow-[inset_0_-3px_0_rgb(0_0_0/0.12),0_10px_18px_-10px_rgb(0_0_0/0.45)] transition-shadow group-hover:shadow-[inset_0_-3px_0_rgb(0_0_0/0.12),0_16px_24px_-10px_rgb(0_0_0/0.5)]"
                style={{ viewTransitionName: `precinto-${b.id}` }}
              >
                <Ojal />
                <span className="text-[0.625rem] font-semibold opacity-70">Precinto</span>
                <span className="text-[1.375rem] leading-tight ancho-precinto">{b.numeroPrecinto}</span>
                <span className="mt-1.5 w-full truncate border-t border-tinta/15 pt-1.5 text-center text-xs font-semibold">
                  {b.cmOrigen.replace(/^CM\s+/i, '')}
                </span>
              </span>
              {b.id === idMasViejo && (
                <span className="mt-2 rounded-full bg-falta-claro px-2 py-0.5 text-[0.6875rem] font-semibold text-falta">Espera más</span>
              )}
            </Link>
          </Colgante>
        ))}
        {resto > 0 && (
          <Colgante indice={visibles.length} quieto={quieto}>
            <Link
              to="/recepcion"
              viewTransition
              className="group flex flex-col items-center rounded-lg focus-visible:outline-offset-4"
              aria-label={`Ver los otros ${plural(resto, 'bolsín', 'bolsines')} en la bandeja`}
            >
              <Fleje largo={LARGOS[visibles.length % LARGOS.length]} />
              <span className="relative flex w-32 flex-col items-center rounded-[12px] border-2 border-dashed border-linea-fuerte bg-hoja px-2.5 pt-6 pb-3.5 text-tenue transition-colors group-hover:border-sello group-hover:text-sello">
                <Ojal />
                <span className="text-[1.375rem] leading-tight font-bold cifras">+{resto}</span>
                <span className="mt-1.5 text-xs font-semibold">en la bandeja</span>
              </span>
            </Link>
          </Colgante>
        )}
      </ul>
    </div>
  )
}

/** Cuantos precintos entran colgados en el ancho del perchero. */
function useLugares(ref: React.RefObject<HTMLDivElement | null>) {
  const [lugares, setLugares] = useState(4)
  useEffect(() => {
    const el = ref.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const medir = () => setLugares(Math.max(1, Math.floor((el.clientWidth + SEPARACION) / (ANCHO_PRECINTO + SEPARACION))))
    const observador = new ResizeObserver(medir)
    observador.observe(el)
    return () => observador.disconnect()
  }, [ref])
  return lugares
}

function Colgante({ indice, quieto, children }: { indice: number; quieto: boolean | null; children: ReactNode }) {
  const giro = GIROS[indice % GIROS.length]
  return (
    <motion.li
      style={{ transformOrigin: 'top center' }}
      initial={quieto ? false : { y: -60, opacity: 0, rotate: giro * 4 }}
      animate={{ y: 0, opacity: 1, rotate: giro }}
      transition={{ type: 'spring', stiffness: 120, damping: 9, mass: 0.9, delay: 0.1 + indice * 0.08 }}
      whileHover={quieto ? undefined : { rotate: 0, y: 4, transition: { type: 'spring', stiffness: 300, damping: 14 } }}
    >
      {children}
    </motion.li>
  )
}

function Fleje({ largo }: { largo: number }) {
  return <span aria-hidden className="w-[3px] rounded-b-full bg-precinto-hondo/70" style={{ height: largo }} />
}

function Ojal() {
  return <span aria-hidden className="absolute top-2 size-2.5 rounded-full bg-papel shadow-[inset_0_1px_2px_rgb(0_0_0/0.4)]" />
}
