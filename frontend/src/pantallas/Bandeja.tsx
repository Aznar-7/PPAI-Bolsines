import { ArrowRight, Inbox, Search, SearchX } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { useNavigate, useRouteLoaderData, useSearchParams } from 'react-router'
import type { BolsinResumen, InicioRecepcion } from '../api'
import { Pasos } from '../componentes/Pasos'
import { FichaBolsin } from '../componentes/FichaBolsin'
import { EtiquetaPrecinto } from '../componentes/Precinto'
import { boton } from '../componentes/estilos'
import { EncabezadoPagina, Tecla } from '../componentes/ui'
import { filtrarBolsines, type SinResultados } from '../filtro'
import { fechaYHora, haceCuanto, plural } from '../formato'

type Orden = 'antiguos' | 'recientes'

/**
 * Recibir bolsines (pasos 3 a 5, A1 y A2). Maestro-detalle: a la izquierda la lista filtrable de los
 * bolsines enviados hacia la CM del usuario; a la derecha el bolsin elegido, para confirmar que es el
 * que esta en la mesa antes de controlarlo (solicitarSeleccionBolsin / tomarSeleccionBolsin).
 */
export function Bandeja() {
  const { bolsines, cmUsuario } = useRouteLoaderData('marco') as InicioRecepcion
  const [parametros, setParametros] = useSearchParams()
  const precinto = parametros.get('precinto') ?? ''
  const cm = parametros.get('cm') ?? ''
  const orden: Orden = parametros.get('orden') === 'recientes' ? 'recientes' : 'antiguos'
  const { lista: filtrados, sinResultados } = filtrarBolsines(bolsines, precinto, cm)
  const lista = ordenar(filtrados, orden)
  const [idElegido, setIdElegido] = useState<number | null>(null)
  const elegido = lista.find((b) => b.id === idElegido) ?? lista[0] ?? null
  const navegar = useNavigate()
  const listaRef = useRef<HTMLUListElement>(null)
  const idLista = useId()
  const origenes = [...new Set(bolsines.map((b) => b.cmOrigen))].sort()

  function cambiar(clave: string, valor: string) {
    const nuevos = new URLSearchParams(parametros)
    if (valor) nuevos.set(clave, valor)
    else nuevos.delete(clave)
    setParametros(nuevos, { replace: true })
  }

  function verTodos() {
    setParametros(orden === 'recientes' ? { orden } : {}, { replace: true })
  }

  function controlar(b: BolsinResumen | null) {
    if (b) navegar(`/recepcion/${b.id}`, { viewTransition: true })
  }

  function mover(paso: number) {
    if (!lista.length) return
    const i = elegido ? lista.indexOf(elegido) : -1
    setIdElegido(lista[Math.max(0, Math.min(lista.length - 1, i + paso))].id)
  }

  function tecladoBusqueda(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') controlar(elegido)
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      listaRef.current?.focus()
    }
  }

  function tecladoLista(e: KeyboardEvent<HTMLUListElement>) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      mover(e.key === 'ArrowDown' ? 1 : -1)
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      controlar(elegido)
    }
  }

  useEffect(() => {
    if (elegido) document.getElementById(`${idLista}-${elegido.id}`)?.scrollIntoView?.({ block: 'nearest' })
  }, [elegido, idLista])

  return (
    <div className="space-y-6">
      <EncabezadoPagina
        migas={[{ texto: 'Inicio', a: '/inicio' }, { texto: 'Recibir bolsines' }]}
        titulo="Elegí el bolsín que vas a recibir"
        descripcion={`Son los bolsines enviados hacia ${cmUsuario}. Buscalo por el número del precinto que tenés en la mano.`}
        extra={<Pasos actual={1} />}
      />

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_21rem]">
        <div className="min-w-0 space-y-4">
          <search className="grid gap-3 sm:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_auto]">
            <div>
              <label htmlFor="precinto" className="mb-1.5 block text-sm font-semibold">
                Número de precinto
              </label>
              <div className="relative">
                <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3.5 size-[1.125rem] -translate-y-1/2 text-tenue" />
                <input
                  id="precinto"
                  type="search"
                  inputMode="numeric"
                  autoFocus
                  autoComplete="off"
                  placeholder="Ej.: 004512"
                  value={precinto}
                  onChange={(e) => cambiar('precinto', e.target.value.replace(/\s/g, ''))}
                  onKeyDown={tecladoBusqueda}
                  aria-controls={idLista}
                  className={`${claseCampo} pl-10 ancho-precinto placeholder:font-normal placeholder:[font-stretch:100%]`}
                />
              </div>
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
                placeholder="Todas las comisiones"
                value={cm}
                onChange={(e) => cambiar('cm', e.target.value)}
                onKeyDown={tecladoBusqueda}
                aria-controls={idLista}
                className={claseCampo}
              />
              <datalist id="origenes">
                {origenes.map((o) => (
                  <option key={o} value={o} />
                ))}
              </datalist>
            </div>
            <div>
              <label htmlFor="orden" className="mb-1.5 block text-sm font-semibold">
                Orden
              </label>
              <select
                id="orden"
                value={orden}
                onChange={(e) => cambiar('orden', e.target.value === 'recientes' ? 'recientes' : '')}
                className={`${claseCampo} cursor-pointer pr-9`}
              >
                <option value="antiguos">Esperan hace más</option>
                <option value="recientes">Llegaron último</option>
              </select>
            </div>
          </search>

          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <p aria-live="polite" className="text-tenue">
              {precinto || cm
                ? `${plural(lista.length, 'bolsín coincide', 'bolsines coinciden')} de ${bolsines.length}`
                : plural(bolsines.length, 'bolsín por recibir', 'bolsines por recibir')}
            </p>
            {lista.length > 0 && (
              <p className="hidden items-center gap-1.5 text-tenue md:flex">
                <Tecla>↑</Tecla>
                <Tecla>↓</Tecla> para moverte, <Tecla>Enter</Tecla> para controlar
              </p>
            )}
          </div>

          {sinResultados ? (
            <SinCoincidencias motivo={sinResultados} precinto={precinto} cm={cm} onVerTodos={verTodos} />
          ) : bolsines.length === 0 ? (
            <Vacio />
          ) : (
            <div className="overflow-hidden rounded-panel border border-linea bg-hoja">
              <div aria-hidden className="hidden grid-cols-[8.5rem_minmax(0,1fr)_10rem_9rem] gap-4 border-b border-linea bg-papel/70 px-5 py-2.5 tabla-encabezado md:grid">
                <span>Precinto</span>
                <span>CM de origen</span>
                <span>Contenido</span>
                <span className="text-right">Enviado</span>
              </div>
              <ul
                ref={listaRef}
                id={idLista}
                role="listbox"
                tabIndex={0}
                aria-label="Bolsines por recibir"
                aria-activedescendant={elegido ? `${idLista}-${elegido.id}` : undefined}
                onKeyDown={tecladoLista}
                className="max-h-[min(62vh,40rem)] overflow-y-auto outline-none focus-visible:ring-2 focus-visible:ring-sello focus-visible:ring-inset"
              >
                {lista.map((b) => (
                  <Fila
                    key={b.id}
                    id={`${idLista}-${b.id}`}
                    bolsin={b}
                    buscado={precinto}
                    elegido={b.id === elegido?.id}
                    onElegir={() => setIdElegido(b.id)}
                    onAbrir={() => controlar(b)}
                  />
                ))}
              </ul>
            </div>
          )}
        </div>

        <Vista bolsin={sinResultados ? null : elegido} cmDestino={cmUsuario} onControlar={() => controlar(elegido)} />
      </div>
    </div>
  )
}

const claseCampo =
  'block h-11 w-full rounded-lg border border-linea-fuerte bg-hoja px-3.5 text-[0.9375rem] outline-none transition-[border-color,box-shadow] placeholder:text-tenue/70 hover:border-tenue/50 focus:border-sello focus:shadow-[0_0_0_3px_rgb(46_70_200/0.18)]'

function ordenar(lista: BolsinResumen[], orden: Orden) {
  const valor = (b: BolsinResumen) => b.fechaEnvio ?? ''
  return [...lista].sort((a, b) => (orden === 'antiguos' ? valor(a).localeCompare(valor(b)) : valor(b).localeCompare(valor(a))))
}

function Fila({
  id,
  bolsin: b,
  buscado,
  elegido,
  onElegir,
  onAbrir,
}: {
  id: string
  bolsin: BolsinResumen
  buscado: string
  elegido: boolean
  onElegir: () => void
  onAbrir: () => void
}) {
  return (
    <li
      id={id}
      role="option"
      aria-selected={elegido}
      onClick={onElegir}
      onDoubleClick={onAbrir}
      className={`relative grid cursor-pointer grid-cols-[auto_minmax(0,1fr)] items-center gap-x-4 gap-y-1 border-b border-linea px-5 py-3.5 transition-colors last:border-b-0 md:grid-cols-[8.5rem_minmax(0,1fr)_10rem_9rem] ${
        elegido ? 'bg-sello-claro' : 'hover:bg-papel'
      }`}
    >
      {elegido && <motion.span layoutId="marca-elegido" aria-hidden className="absolute inset-y-2 left-0 w-[3px] rounded-r-full bg-sello" />}
      <EtiquetaPrecinto numero={b.numeroPrecinto} resaltado={buscado} id={elegido ? b.id : undefined} />
      <span className="min-w-0">
        <span className="block truncate font-semibold">{b.cmOrigen}</span>
        <span className="block text-sm text-tenue cifras">Bolsín N.º {b.numeroBolsin}</span>
      </span>
      <span className="col-start-2 text-sm text-tenue cifras md:col-start-auto">
        {plural(b.cantidadRemitos, 'remito', 'remitos')}
        <span className="block text-xs">{plural(b.cantidadDocumentos, 'documento', 'documentos')}</span>
      </span>
      <span className="col-start-2 text-sm cifras md:col-start-auto md:text-right">
        <span className="font-medium">{haceCuanto(b.fechaEnvio).replace('enviado ', '')}</span>
        <span className="block text-xs text-tenue">{fechaYHora(b.fechaEnvio)}</span>
      </span>
    </li>
  )
}

/** El bolsin elegido, con todo lo que hace falta para reconocerlo en la mesa. */
function Vista({ bolsin: b, cmDestino, onControlar }: { bolsin: BolsinResumen | null; cmDestino: string; onControlar: () => void }) {
  const quieto = useReducedMotion()
  return (
    <aside aria-label="Bolsín elegido" className="rounded-panel border border-linea bg-hoja xl:sticky xl:top-8">
      <AnimatePresence mode="wait" initial={false}>
        {b ? (
          <motion.div
            key={b.id}
            initial={quieto ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, transition: { duration: 0.08 } }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="p-5"
          >
            <FichaBolsin bolsin={b} cmDestino={cmDestino} />

            <button type="button" onClick={onControlar} className={`${boton.primario} mt-6 w-full py-3`}>
              Controlar este bolsín
              <ArrowRight aria-hidden className="size-4" />
            </button>
            <p className="mt-3 text-center text-xs text-tenue">
              Vas a marcar documento por documento qué llegó. Nada se registra hasta que confirmes.
            </p>
          </motion.div>
        ) : (
          <motion.div key="nada" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-8 text-center text-sm text-tenue">
            Elegí un bolsín de la lista para ver sus datos.
          </motion.div>
        )}
      </AnimatePresence>
    </aside>
  )
}

function Vacio() {
  return (
    <div className="flex flex-col items-center rounded-panel border border-dashed border-linea-fuerte bg-hoja/60 px-6 py-14 text-center">
      <Inbox aria-hidden className="size-8 text-tenue" />
      <p className="mt-3 text-lg font-semibold">No hay bolsines en camino a tu comisión</p>
      <p className="mt-1 max-w-sm text-tenue">Cuando otra comisión despache uno hacia la tuya, aparece en esta lista.</p>
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
  const [titulo, ayuda] = {
    precinto: [`No hay ningún bolsín con el precinto ${precinto}`, 'Revisá el número en la etiqueta amarilla del precinto.'],
    cm: [`No llegó ningún bolsín desde ${cm}`, 'Puede que todavía esté en camino, o que la comisión tenga otro nombre.'],
    combinacion: [`Ningún bolsín de ${cm} tiene el precinto ${precinto}`, 'Cada filtro encuentra bolsines por separado, pero no juntos.'],
  }[motivo]

  return (
    <div role="status" className="flex flex-col items-center rounded-panel border border-dashed border-linea-fuerte bg-hoja/60 px-6 py-12 text-center">
      <SearchX aria-hidden className="size-8 text-tenue" />
      <p className="mt-3 text-lg font-semibold">{titulo}</p>
      <p className="mt-1 max-w-md text-tenue">{ayuda}</p>
      <button type="button" onClick={onVerTodos} className={`${boton.secundario} mt-5`}>
        Ver todos los bolsines
      </button>
    </div>
  )
}
