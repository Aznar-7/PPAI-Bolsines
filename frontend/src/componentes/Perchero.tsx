import { motion, useReducedMotion } from 'motion/react'
import { Link } from 'react-router'
import type { BolsinResumen } from '../api'
import { haceCuanto } from '../formato'

/**
 * Los bolsines pendientes como precintos colgados de un perchero, igual que en la mesa de entradas.
 * Es el unico momento orquestado de la app: al entrar caen y se acomodan; despues solo responden al mouse.
 */
export function Perchero({ bolsines, idMasViejo }: { bolsines: BolsinResumen[]; idMasViejo?: number }) {
  const quieto = useReducedMotion()
  const visibles = bolsines.slice(0, 7)

  return (
    <div className="relative">
      <div aria-hidden className="mx-2 h-2 rounded-full bg-linea-fuerte shadow-[inset_0_-1px_0_rgb(0_0_0/0.15)]" />
      <ul className="flex flex-wrap justify-center gap-x-6 gap-y-6" aria-label="Precintos de los bolsines por recibir">
        {visibles.map((b, i) => {
          const largo = [34, 58, 44, 64, 38, 52, 40][i % 7]
          const giro = [-3, 2, -1.5, 3, -2, 1, -2.5][i % 7]
          return (
            <motion.li
              key={b.id}
              style={{ transformOrigin: 'top center' }}
              initial={quieto ? false : { y: -60, opacity: 0, rotate: giro * 4 }}
              animate={{ y: 0, opacity: 1, rotate: giro }}
              transition={{ type: 'spring', stiffness: 120, damping: 9, mass: 0.9, delay: 0.1 + i * 0.08 }}
              whileHover={quieto ? undefined : { rotate: 0, y: 4, transition: { type: 'spring', stiffness: 300, damping: 14 } }}
            >
              <Link
                to={`/recepcion/${b.id}`}
                viewTransition
                className="group flex flex-col items-center rounded-lg focus-visible:outline-offset-4"
                aria-label={`Recibir el bolsín del precinto ${b.numeroPrecinto}, desde ${b.cmOrigen}, ${haceCuanto(b.fechaEnvio)}`}
              >
                <span aria-hidden className="w-[3px] rounded-b-full bg-precinto-hondo/70" style={{ height: largo }} />
                <span
                  className="relative flex w-[8rem] flex-col items-center rounded-[12px] bg-precinto px-2.5 pt-6 pb-3.5 text-tinta shadow-[inset_0_-3px_0_rgb(0_0_0/0.12),0_10px_18px_-10px_rgb(0_0_0/0.45)] transition-shadow group-hover:shadow-[inset_0_-3px_0_rgb(0_0_0/0.12),0_16px_24px_-10px_rgb(0_0_0/0.5)]"
                  style={{ viewTransitionName: `precinto-${b.id}` }}
                >
                  <span aria-hidden className="absolute top-2 size-2.5 rounded-full bg-papel shadow-[inset_0_1px_2px_rgb(0_0_0/0.4)]" />
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
            </motion.li>
          )
        })}
      </ul>
      {bolsines.length > visibles.length && (
        <p className="mt-4 text-sm text-tenue">Y {bolsines.length - visibles.length} más en la bandeja.</p>
      )}
    </div>
  )
}
