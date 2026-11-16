import { ArrowRight, CheckCheck, ClipboardList, FileText, FolderOpen, Mail, ScanLine, TriangleAlert, type LucideIcon } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { Link, useLoaderData, useNavigate, useRouteLoaderData } from 'react-router'
import { alIngreso, api, ErrorApi, type DetalleBolsin, type InicioRecepcion, type Marcas, type Situacion } from '../api'
import { CancelarRecepcion } from '../componentes/CancelarRecepcion'
import { boton } from '../componentes/estilos'
import { Pasos } from '../componentes/Pasos'
import { EtiquetaPrecinto } from '../componentes/Precinto'
import { EncabezadoPagina } from '../componentes/ui'
import { plural } from '../formato'
import { contar, guardarMarcas, leerMarcas, SITUACIONES, situacionesPara } from '../situaciones'

/**
 * Controlar contenido (pasos 6 a 8 y A3, A4, A5). Por cada remito su numero (mostrarNroRemito) y por
 * cada documentacion su asunto y tipo (mostrarAsuntoDocumentacion, mostrarTipoDocumentacion), con
 * las opciones de recepcion para marcarla (solicitarSeleccionRecepcionBolsin). Las marcas se le
 * pasan al gestor recien al pedir la confirmacion.
 */
export function Control() {
  const { bolsin, cmDestino, remitos } = useLoaderData() as DetalleBolsin
  const { cmEsCentral } = useRouteLoaderData('marco') as InicioRecepcion
  const opciones = situacionesPara(cmEsCentral)
  const [marcas, setMarcas] = useState<Marcas>(() => leerMarcas(bolsin.id))
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)
  const navegar = useNavigate()

  const documentos = remitos.flatMap((r) => r.documentacion)
  const marcados = documentos.filter((d) => marcas[d.id]).length
  const faltan = documentos.length - marcados
  const cuenta = contar(marcas)

  useEffect(() => guardarMarcas(bolsin.id, marcas), [bolsin.id, marcas])

  function marcar(ids: number[], situacion: Situacion, soloSinMarcar = false) {
    setError('')
    setMarcas((actuales) => {
      const nuevas = { ...actuales }
      for (const id of ids) if (!soloSinMarcar || !nuevas[id]) nuevas[id] = situacion
      return nuevas
    })
  }

  async function revisar() {
    setEnviando(true)
    setError('')
    try {
      const resumen = await api.tomarSeleccionRecepcionBolsin(marcas)
      navegar(`/recepcion/${bolsin.id}/confirmar`, { state: { resumen }, viewTransition: true })
    } catch (e) {
      if (e instanceof ErrorApi && e.estado === 401) return navegar(alIngreso(), { replace: true }) // las marcas quedan guardadas
      setError(e instanceof ErrorApi ? e.message : 'No se pudo preparar la confirmación.')
      setEnviando(false)
    }
  }

  return (
    <div className="space-y-6 pb-16 xl:pb-0">
      <title>{`Controlar bolsín ${bolsin.numeroBolsin} · Bolsines`}</title>
      <EncabezadoPagina
        migas={[
          { texto: 'Inicio', a: '/inicio' },
          { texto: 'Recibir bolsines', a: '/recepcion' },
          { texto: `Bolsín N.º ${bolsin.numeroBolsin}` },
        ]}
        titulo="Marcá cómo llegó cada documento"
        descripcion={`Abrí el bolsín y compará con la lista: ${plural(bolsin.cantidadRemitos, 'remito', 'remitos')}, ${plural(documentos.length, 'documento', 'documentos')}. Nada se registra hasta que confirmes.`}
        extra={<Pasos actual={2} />}
      />

      <div className="flex flex-wrap items-center gap-x-5 gap-y-3 rounded-panel border border-linea bg-hoja px-5 py-4">
        <EtiquetaPrecinto numero={bolsin.numeroPrecinto} id={bolsin.id} grande />
        <div className="min-w-0 flex-1">
          <p className="font-bold">Bolsín N.º {bolsin.numeroBolsin}</p>
          <p className="text-sm text-tenue">
            De <span className="font-medium text-grafito">{bolsin.cmOrigen}</span> para{' '}
            <span className="font-medium text-grafito">{cmDestino}</span>
          </p>
        </div>
        <Link to="/recepcion" viewTransition className={boton.fantasma}>
          Elegir otro bolsín
        </Link>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-5">
          <Leyenda opciones={opciones} />

          {remitos.map((remito) => {
            const ids = remito.documentacion.map((d) => d.id)
            const listos = ids.filter((id) => marcas[id]).length
            return (
              <section key={remito.numero} aria-labelledby={`remito-${remito.numero}`} className="overflow-hidden rounded-panel border border-linea bg-hoja">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-linea bg-papel/70 px-5 py-3">
                  <div>
                    <h2 id={`remito-${remito.numero}`} className="font-bold cifras">
                      Remito N.º {remito.numero}
                    </h2>
                    <p className="text-xs text-tenue cifras">
                      {listos} de {plural(ids.length, 'documento marcado', 'documentos marcados')}
                    </p>
                  </div>
                  <button type="button" onClick={() => marcar(ids, 'RECIBIDA')} className={boton.fantasma}>
                    <CheckCheck aria-hidden className="size-4" />
                    Todo este remito llegó
                  </button>
                </div>
                <ul>
                  {remito.documentacion.map((doc) => (
                    <FilaDocumento
                      key={doc.id}
                      id={doc.id}
                      asunto={doc.asunto}
                      tipo={doc.tipo}
                      numero={doc.numero}
                      opciones={opciones}
                      marca={marcas[doc.id]}
                      onMarcar={(s) => marcar([doc.id], s)}
                    />
                  ))}
                </ul>
              </section>
            )
          })}
        </div>

        <aside aria-label="Cómo va quedando la recepción" className="space-y-3 xl:sticky xl:top-8">
          <div className="overflow-hidden rounded-[18px] border border-linea bg-hoja shadow-levantada">
            <div className="p-5">
              <h2 className="font-bold">Cómo va quedando</h2>
              <p className="mt-0.5 text-sm text-tenue cifras" aria-live="polite">
                {faltan === 0 ? 'Todos los documentos están marcados.' : `Marcaste ${marcados} de ${documentos.length}.`}
              </p>
              <div aria-hidden className="mt-3 h-2 overflow-hidden rounded-full bg-papel">
                <motion.div
                  className="h-full rounded-full bg-sello"
                  initial={false}
                  animate={{ width: `${(marcados / Math.max(1, documentos.length)) * 100}%` }}
                  transition={{ type: 'spring', stiffness: 260, damping: 30 }}
                />
              </div>

              <dl className="mt-5 space-y-2.5">
                {opciones.map((s) => {
                  const { etiqueta, icono: Icono, color } = SITUACIONES[s]
                  return (
                    <div key={s} className={`flex items-center gap-3 transition-opacity ${cuenta[s] ? '' : 'opacity-55'}`}>
                      <Icono aria-hidden className={`size-[1.125rem] ${color}`} />
                      <dt className="flex-1 text-sm">{etiqueta}</dt>
                      <dd className="font-bold cifras">
                        <AnimatePresence mode="popLayout" initial={false}>
                          <motion.span
                            key={cuenta[s]}
                            className="inline-block"
                            initial={{ y: -8, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 8, opacity: 0 }}
                            transition={{ duration: 0.16 }}
                          >
                            {cuenta[s]}
                          </motion.span>
                        </AnimatePresence>
                      </dd>
                    </div>
                  )
                })}
              </dl>
            </div>

            <div className="space-y-2.5 border-t border-linea bg-papel/60 p-5">
              {faltan > 0 && (
                <button
                  type="button"
                  onClick={() => marcar(documentos.map((d) => d.id), 'RECIBIDA', true)}
                  className={`${boton.secundario} w-full`}
                >
                  <CheckCheck aria-hidden className="size-4 text-llego" />
                  {marcados === 0 ? 'Llegó todo' : 'El resto llegó'}
                </button>
              )}
              <button type="button" onClick={revisar} disabled={faltan > 0 || enviando} className={`${boton.primario} group w-full py-3`}>
                {enviando ? 'Preparando el resumen…' : 'Revisar y confirmar'}
                <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-0.5" />
              </button>
              {faltan > 0 && (
                <p className="text-center text-xs text-tenue">
                  {faltan === 1 ? 'Falta marcar 1 documento.' : `Faltan marcar ${faltan} documentos.`}
                </p>
              )}
              <AnimatePresence>
                {error && (
                  <motion.p
                    role="alert"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex gap-2 rounded-lg bg-rechazo-claro px-3 py-2.5 text-sm font-medium text-rechazo"
                  >
                    <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
                    <span>{error} Tus marcas siguen acá: corregí y volvé a intentar.</span>
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </div>
          <CancelarRecepcion idBolsin={bolsin.id} className="w-full" />
        </aside>
      </div>

      {/* En pantallas chicas el resumen queda abajo de todo: la accion principal viaja con la encargada. */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-linea bg-hoja/90 px-4 py-3 backdrop-blur xl:hidden">
        <div className="mx-auto flex max-w-[76rem] items-center gap-3">
          <p className="min-w-0 flex-1 text-sm cifras" aria-hidden>
            <span className="font-semibold">
              {marcados} de {documentos.length}
            </span>{' '}
            <span className="text-tenue">marcados</span>
          </p>
          {faltan > 0 ? (
            <button type="button" onClick={() => marcar(documentos.map((d) => d.id), 'RECIBIDA', true)} className={boton.secundario}>
              <CheckCheck aria-hidden className="size-4 text-llego" />
              {marcados === 0 ? 'Llegó todo' : 'El resto llegó'}
            </button>
          ) : (
            <button type="button" onClick={revisar} disabled={enviando} className={boton.primario}>
              Revisar y confirmar
              <ArrowRight aria-hidden className="size-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/** Que significa cada opcion, una sola vez arriba de la lista. */
function Leyenda({ opciones }: { opciones: Situacion[] }) {
  return (
    <section
      aria-label="Qué significa cada opción"
      className="grid gap-x-6 gap-y-3 rounded-panel border border-dashed border-linea-fuerte bg-hoja/60 p-4 sm:grid-cols-2"
    >
      {opciones.map((s) => {
        const { etiqueta, explicacion, icono: Icono, color } = SITUACIONES[s]
        return (
          <div key={s} className="flex gap-2.5 text-sm">
            <Icono aria-hidden className={`mt-0.5 size-4 shrink-0 ${color}`} />
            <p>
              <span className="font-semibold">{etiqueta}.</span> <span className="text-tenue">{explicacion}</span>
            </p>
          </div>
        )
      })}
    </section>
  )
}

function FilaDocumento({
  id,
  asunto,
  tipo,
  numero,
  opciones,
  marca,
  onMarcar,
}: {
  id: number
  asunto: string
  tipo: string
  numero: number
  opciones: Situacion[]
  marca?: Situacion
  onMarcar: (s: Situacion) => void
}) {
  return (
    <li
      className={`grid gap-3 border-b border-linea px-5 py-3.5 transition-colors duration-200 last:border-b-0 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center ${
        marca ? SITUACIONES[marca].fila : ''
      }`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <IconoTipo tipo={tipo} />
        <div className="min-w-0">
          <p className="font-medium">{asunto}</p>
          <p className="text-sm text-tenue">
            {tipo} <span className="cifras">N.º {numero}</span>
          </p>
        </div>
      </div>
      <fieldset className="grid grid-cols-2 gap-1.5 sm:flex sm:flex-wrap">
        <legend className="sr-only">Cómo llegó: {asunto}</legend>
        {opciones.map((s) => {
          const { etiqueta, explicacion, icono: Icono, solido } = SITUACIONES[s]
          const elegida = marca === s
          return (
            <label
              key={s}
              title={explicacion}
              className={`relative inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border px-3 py-2 sm:py-1.5 text-sm font-semibold transition-[background-color,border-color,color] has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-sello ${
                elegida ? solido : 'border-linea bg-hoja text-tenue hover:border-linea-fuerte hover:text-grafito'
              }`}
            >
              <input type="radio" name={`doc-${id}`} value={s} checked={elegida} onChange={() => onMarcar(s)} className="sr-only" />
              <Icono aria-hidden className="size-4" />
              {etiqueta}
            </label>
          )
        })}
      </fieldset>
    </li>
  )
}

/** Cada tipo de documentacion con su icono, para reconocerlo de un vistazo en la pila de papeles. */
const ICONOS: [RegExp, LucideIcon][] = [
  [/expediente/i, FolderOpen],
  [/dictamen/i, ClipboardList],
  [/estudio|radiograf|imagen/i, ScanLine],
  [/carta|nota|oficio/i, Mail],
]

function IconoTipo({ tipo }: { tipo: string }) {
  const Icono = ICONOS.find(([patron]) => patron.test(tipo))?.[1] ?? FileText
  return (
    <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-lg bg-sello-claro text-sello">
      <Icono className="size-[1.125rem]" />
    </span>
  )
}
