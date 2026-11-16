import { motion, useReducedMotion } from 'motion/react'
import { Link, useRouteLoaderData } from 'react-router'
import type { InicioRecepcion } from '../api'
import { EtiquetaPrecinto } from '../componentes/Precinto'
import { haceCuanto, plural, primerNombre, saludo } from '../formato'

/** Inicio: saludo, CM del usuario logueado (mostrarCM) y el acceso al paso 1 del CU. */
export function Inicio() {
  const { nombreEmpleado, cmUsuario, bolsines } = useRouteLoaderData('marco') as InicioRecepcion
  const quieto = useReducedMotion()
  const masViejo = bolsines.reduce<string | null>(
    (viejo, b) => (b.fechaEnvio && (!viejo || b.fechaEnvio < viejo) ? b.fechaEnvio : viejo),
    null,
  )

  return (
    <div className="space-y-10">
      <header>
        <p className="text-tenue">{saludo()},</p>
        <h1 className="mt-1 text-4xl font-bold tracking-tight sm:text-5xl">{primerNombre(nombreEmpleado)}</h1>
        <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-hoja px-3 py-1 text-sm shadow-hoja">
          <span aria-hidden className="size-2 rounded-full bg-sello" />
          {cmUsuario}
        </p>
      </header>

      <section aria-labelledby="titulo-mesa" className="rounded-panel bg-hoja p-6 shadow-hoja sm:p-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="titulo-mesa" className="text-2xl font-bold sm:text-3xl">
              {bolsines.length === 0
                ? 'No hay bolsines en camino'
                : `${plural(bolsines.length, 'bolsín espera', 'bolsines esperan')} recepción`}
            </h2>
            <p className="mt-2 max-w-prose text-tenue">
              {bolsines.length === 0
                ? 'Cuando otra comisión despache un bolsín hacia la tuya, aparece acá.'
                : `Todos enviados hacia ${cmUsuario}.${masViejo ? ` El primero salió ${haceCuanto(masViejo).replace('enviado ', '')}.` : ''}`}
            </p>
          </div>
          {bolsines.length > 0 && (
            <Link
              to="/recepcion"
              viewTransition
              className="inline-flex shrink-0 items-center justify-center rounded-xl bg-sello px-6 py-3.5 text-base font-semibold text-white shadow-levantada transition-colors hover:bg-sello-hondo"
            >
              Empezar a recibir
            </Link>
          )}
        </div>

        {bolsines.length > 0 && (
          <div className="relative mt-10">
            <div aria-hidden className="absolute inset-x-0 top-0 h-1 rounded-full bg-linea" />
            <ul className="flex flex-wrap gap-x-6 gap-y-8 pt-0" aria-label="Bolsines por recibir">
              {bolsines.map((b, i) => (
                <motion.li
                  key={b.id}
                  initial={quieto ? false : { y: -28, opacity: 0, rotate: -6 }}
                  animate={{ y: 0, opacity: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 160, damping: 11, delay: 0.15 + i * 0.07 }}
                  style={{ transformOrigin: 'top center' }}
                >
                  <Link
                    to={`/recepcion/${b.id}`}
                    viewTransition
                    className="group flex flex-col items-center rounded-lg pt-0 focus-visible:outline-offset-4"
                    aria-label={`Recibir el bolsín ${b.numeroBolsin}, precinto ${b.numeroPrecinto}, desde ${b.cmOrigen}`}
                  >
                    <span aria-hidden className="h-5 w-0.5 bg-precinto-hondo/50" />
                    <span className="origin-top transition-transform duration-300 ease-sello group-hover:rotate-3">
                      <EtiquetaPrecinto numero={b.numeroPrecinto} id={b.id} grande />
                    </span>
                    <span className="mt-2 text-sm font-medium">{b.cmOrigen}</span>
                    <span className="text-xs text-tenue">{haceCuanto(b.fechaEnvio)}</span>
                  </Link>
                </motion.li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  )
}
