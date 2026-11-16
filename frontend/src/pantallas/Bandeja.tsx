import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useRef, type KeyboardEvent } from 'react'
import { Link, useNavigate, useRouteLoaderData, useSearchParams } from 'react-router'
import type { InicioRecepcion } from '../api'
import { Pasos } from '../componentes/Pasos'
import { EtiquetaPrecinto } from '../componentes/Precinto'
import { filtrarBolsines, type SinResultados } from '../filtro'
import { haceCuanto, plural } from '../formato'

/**
 * Recibir bolsines (pasos 3 a 5 y A1/A2): lista de los bolsines enviados hacia la CM del usuario,
 * con busqueda por precinto y por CM de origen. solicitarSeleccionBolsin: elegir uno de la lista.
 */
export function Bandeja() {
  const { bolsines } = useRouteLoaderData('marco') as InicioRecepcion
  const [parametros, setParametros] = useSearchParams()
  const precinto = parametros.get('precinto') ?? ''
  const cm = parametros.get('cm') ?? ''
  const { lista, sinResultados } = filtrarBolsines(bolsines, precinto, cm)
  const navegar = useNavigate()
  const listaRef = useRef<HTMLUListElement>(null)
  const quieto = useReducedMotion()
  const origenes = [...new Set(bolsines.map((b) => b.cmOrigen))].sort()

  function filtrar(clave: 'precinto' | 'cm', valor: string) {
    const nuevos = new URLSearchParams(parametros)
    if (valor) nuevos.set(clave, valor)
    else nuevos.delete(clave)
    setParametros(nuevos, { replace: true })
  }

  function verTodos() {
    setParametros(new URLSearchParams(), { replace: true })
  }

  function tecladoBusqueda(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && lista.length === 1) navegar(`/recepcion/${lista[0].id}`, { viewTransition: true })
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      listaRef.current?.querySelector<HTMLAnchorElement>('a')?.focus()
    }
  }

  function tecladoLista(e: KeyboardEvent<HTMLUListElement>) {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
    e.preventDefault()
    const enlaces = [...(listaRef.current?.querySelectorAll<HTMLAnchorElement>('a') ?? [])]
    const i = enlaces.indexOf(document.activeElement as HTMLAnchorElement)
    enlaces[Math.max(0, Math.min(enlaces.length - 1, i + (e.key === 'ArrowDown' ? 1 : -1)))]?.focus()
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Elegí el bolsín que vas a recibir</h1>
        <Pasos actual={1} />
      </div>

      <search className="grid gap-4 rounded-panel bg-hoja p-4 shadow-hoja sm:grid-cols-[1.4fr_1fr] sm:p-5">
        <div>
          <label htmlFor="precinto" className="mb-1.5 block text-sm font-semibold">
            Número de precinto
          </label>
          <div className="relative">
            <span aria-hidden className="absolute inset-y-0 left-3 my-auto size-3 rounded-full bg-precinto" />
            <input
              id="precinto"
              type="search"
              inputMode="numeric"
              autoFocus
              autoComplete="off"
              placeholder="Ej.: 004512"
              value={precinto}
              onChange={(e) => filtrar('precinto', e.target.value.replace(/\s/g, ''))}
              onKeyDown={tecladoBusqueda}
              aria-describedby="ayuda-precinto"
              className="block w-full rounded-xl border border-linea-fuerte bg-papel/60 py-3 pr-4 pl-9 text-lg ancho-precinto outline-none transition-[border-color,box-shadow] placeholder:font-normal placeholder:text-tenue/60 placeholder:[font-stretch:100%] focus:border-sello focus:bg-hoja focus:shadow-[0_0_0_4px_rgb(46_70_200/0.15)]"
            />
          </div>
          <p id="ayuda-precinto" className="mt-1.5 text-xs text-tenue">
            Si queda uno solo, Enter lo abre.
          </p>
        </div>
        <div>
          <label htmlFor="cm" className="mb-1.5 block text-sm font-semibold">
            CM de origen
          </label>
          <input
            id="cm"
            type="search"
            list="origenes"
            autoComplete="off"
            placeholder="Todas"
            value={cm}
            onChange={(e) => filtrar('cm', e.target.value)}
            onKeyDown={tecladoBusqueda}
            className="block w-full rounded-xl border border-linea-fuerte bg-papel/60 px-4 py-3 text-lg outline-none transition-[border-color,box-shadow] placeholder:text-tenue/60 focus:border-sello focus:bg-hoja focus:shadow-[0_0_0_4px_rgb(46_70_200/0.15)]"
          />
          <datalist id="origenes">
            {origenes.map((o) => (
              <option key={o} value={o} />
            ))}
          </datalist>
        </div>
      </search>

      <p aria-live="polite" className="text-sm text-tenue">
        {precinto || cm
          ? `${plural(lista.length, 'bolsín coincide', 'bolsines coinciden')} de ${bolsines.length}`
          : `${plural(bolsines.length, 'bolsín enviado', 'bolsines enviados')} hacia tu comisión`}
      </p>

      {sinResultados ? (
        <SinCoincidencias motivo={sinResultados} precinto={precinto} cm={cm} onVerTodos={verTodos} />
      ) : bolsines.length === 0 ? (
        <div className="rounded-panel border border-dashed border-linea-fuerte p-10 text-center">
          <p className="text-lg font-semibold">No hay bolsines en camino a tu comisión</p>
          <p className="mt-1 text-tenue">Cuando otra comisión despache uno, aparece acá.</p>
        </div>
      ) : (
        <ul ref={listaRef} onKeyDown={tecladoLista} className="overflow-hidden rounded-panel bg-hoja shadow-hoja">
          <AnimatePresence initial={false} mode="popLayout">
            {lista.map((b) => (
              <motion.li
                key={b.id}
                layout={!quieto}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.12 } }}
                transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                className="border-b border-linea last:border-b-0"
              >
                <Link
                  to={`/recepcion/${b.id}`}
                  viewTransition
                  className="group grid grid-cols-[auto_1fr_auto] items-center gap-x-4 gap-y-1 px-4 py-4 transition-colors hover:bg-sello-claro/60 focus-visible:bg-sello-claro sm:grid-cols-[9rem_1fr_auto_auto] sm:px-6"
                >
                  <EtiquetaPrecinto numero={b.numeroPrecinto} resaltado={precinto} id={b.id} />
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{b.cmOrigen}</span>
                    <span className="block text-sm text-tenue cifras">Bolsín N.º {b.numeroBolsin}</span>
                  </span>
                  <span className="col-start-2 text-sm text-tenue cifras sm:col-start-auto sm:text-right">
                    {plural(b.cantidadRemitos, 'remito', 'remitos')}, {plural(b.cantidadDocumentos, 'documento', 'documentos')}
                    <span className="block text-xs">{haceCuanto(b.fechaEnvio)}</span>
                  </span>
                  <svg
                    viewBox="0 0 20 20"
                    aria-hidden
                    className="row-span-2 size-5 text-tenue transition-transform group-hover:translate-x-0.5 group-hover:text-sello sm:row-span-1"
                  >
                    <path d="M7.5 4.5L13 10l-5.5 5.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </Link>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  )
}

function SinCoincidencias({
  motivo,
  precinto,
  cm,
  onVerTodos,
}: {
  motivo: Exclude<SinResultados, null>
  precinto: string
  cm: string
  onVerTodos: () => void
}) {
  const textos = {
    precinto: [`No hay ningún bolsín con el precinto ${precinto}`, 'Revisá el número en la etiqueta amarilla del precinto.'],
    cm: [`No llegó ningún bolsín desde ${cm}`, 'Puede que todavía esté en camino, o que el nombre de la comisión sea otro.'],
    combinacion: [
      `Ningún bolsín de ${cm} tiene el precinto ${precinto}`,
      'Cada filtro encuentra bolsines por separado, pero no juntos.',
    ],
  }[motivo]

  return (
    <motion.div
      role="status"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-start gap-4 rounded-panel border border-dashed border-linea-fuerte bg-hoja/50 p-8 sm:flex-row sm:items-center sm:justify-between"
    >
      <div>
        <p className="text-lg font-semibold">{textos[0]}</p>
        <p className="mt-1 text-tenue">{textos[1]}</p>
      </div>
      <button
        type="button"
        onClick={onVerTodos}
        className="shrink-0 rounded-xl border border-sello px-4 py-2.5 font-semibold text-sello transition-colors hover:bg-sello hover:text-white"
      >
        Ver todos los bolsines
      </button>
    </motion.div>
  )
}
