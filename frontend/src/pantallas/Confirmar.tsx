import { ArrowLeft, Mail, Stamp, TriangleAlert } from 'lucide-react'
import { useState } from 'react'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router'
import { api, ErrorApi, type ResumenRecepcion, type Situacion } from '../api'
import { CancelarRecepcion } from '../componentes/CancelarRecepcion'
import { boton } from '../componentes/estilos'
import { Pasos } from '../componentes/Pasos'
import { EtiquetaPrecinto } from '../componentes/Precinto'
import { EncabezadoPagina } from '../componentes/ui'
import { plural } from '../formato'
import { borrarMarcas, SITUACIONES } from '../situaciones'

const ORDEN: Situacion[] = ['RECIBIDA', 'FALTANTE', 'NO_CORRESPONDE', 'REDIRIGIR']

/**
 * Confirmar recepcion (pasos 9 y 10, A6 y Observacion 1). solicitarConfirmacionRegistro: muestra
 * como va a quedar todo segun el gestor, a quien se va a avisar, y pide confirmar.
 */
export function Confirmar() {
  const { idBolsin } = useParams()
  const id = Number(idBolsin)
  const resumen = (useLocation().state as { resumen?: ResumenRecepcion } | null)?.resumen
  const navegar = useNavigate()
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  // Sin resumen (recargaron la pagina) se vuelve al control: las marcas siguen guardadas.
  if (!resumen) return <Navigate to={`/recepcion/${id}`} replace />

  const { bolsin } = resumen.bolsin
  const porSituacion = ORDEN.map((s) => [s, resumen.documentacion.filter((d) => d.situacion === s)] as const).filter(
    ([, docs]) => docs.length > 0,
  )

  async function confirmar() {
    setEnviando(true)
    setError('')
    try {
      const resultado = await api.tomarConfirmacionRegistro()
      borrarMarcas(id)
      navegar(`/recepcion/${id}/registrada`, { state: { resultado }, replace: true, viewTransition: true })
    } catch (e) {
      setError(e instanceof ErrorApi ? e.message : 'No se pudo registrar la recepción.')
      setEnviando(false)
    }
  }

  return (
    <div className="space-y-6">
      <EncabezadoPagina
        migas={[
          { texto: 'Inicio', a: '/inicio' },
          { texto: 'Recibir bolsines', a: '/recepcion' },
          { texto: `Bolsín N.º ${bolsin.numeroBolsin}`, a: `/recepcion/${id}` },
          { texto: 'Confirmar' },
        ]}
        titulo="Revisá cómo va a quedar y confirmá"
        descripcion="Esto es lo que se va a registrar. Si algo no está bien, volvé y corregilo: todavía no se guardó nada."
        extra={<Pasos actual={3} />}
      />

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_21rem]">
        <article aria-label="Comprobante de la recepción" className="overflow-hidden rounded-[18px] border border-linea bg-hoja shadow-hoja">
          <header className="flex flex-wrap items-center gap-x-5 gap-y-3 border-b border-linea px-6 py-5">
            <EtiquetaPrecinto numero={bolsin.numeroPrecinto} id={bolsin.id} grande />
            <div className="min-w-0 flex-1">
              <p className="text-sm text-tenue">
                Bolsín N.º {bolsin.numeroBolsin}, de {bolsin.cmOrigen}
              </p>
              <p className="text-lg font-bold">
                Pasa a <span className="text-sello">{resumen.estadoFinalBolsin}</span>
              </p>
            </div>
          </header>

          <section aria-labelledby="titulo-remitos" className="border-b border-linea px-6 py-5">
            <h2 id="titulo-remitos" className="text-sm font-semibold">
              Remitos
            </h2>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {resumen.remitos.map((r) => {
                const completo = !/parcial/i.test(r.estadoFinal)
                return (
                  <li key={r.numero} className="flex items-center justify-between gap-3 rounded-lg border border-linea px-3.5 py-2.5">
                    <span className="font-medium cifras">Remito N.º {r.numero}</span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${completo ? 'bg-llego-claro text-llego' : 'bg-falta-claro text-falta'}`}
                    >
                      {r.estadoFinal}
                    </span>
                  </li>
                )
              })}
            </ul>
          </section>

          <section aria-labelledby="titulo-docs" className="px-6 py-5">
            <h2 id="titulo-docs" className="text-sm font-semibold">
              Documentación
            </h2>
            <div className="mt-3 space-y-4">
              {porSituacion.map(([s, docs]) => {
                const { estadoFinal, icono: Icono, color, fondo } = SITUACIONES[s]
                return (
                  <div key={s}>
                    <p className={`flex items-center gap-2 text-sm font-semibold ${color}`}>
                      <span aria-hidden className={`grid size-6 place-items-center rounded-full ${fondo}`}>
                        <Icono className="size-3.5" />
                      </span>
                      Quedan como {estadoFinal.toLowerCase()} ({docs.length})
                    </p>
                    <ul className="mt-2 ml-8 space-y-1 text-sm">
                      {docs.map((d) => (
                        <li key={d.id} className="flex flex-wrap justify-between gap-x-4">
                          <span>{d.asunto}</span>
                          <span className="text-tenue cifras">
                            {d.tipo}, remito {d.remito}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              })}
            </div>
          </section>
        </article>

        <aside className="space-y-3 xl:sticky xl:top-8">
          <section aria-labelledby="titulo-avisos" className="rounded-panel border border-linea bg-hoja p-5">
            <h2 id="titulo-avisos" className="font-bold">
              Se va a avisar a
            </h2>
            <p className="text-sm text-tenue">Un mail con lo que llegó y lo que no.</p>
            <ul className="mt-3 space-y-2">
              {resumen.cmANotificar.map((cm) => (
                <li key={cm} className="flex items-center gap-3 rounded-lg bg-papel px-3 py-2.5">
                  <Mail aria-hidden className="size-4 text-sello" />
                  <span className="font-medium">{cm}</span>
                </li>
              ))}
            </ul>
          </section>

          <div className="space-y-2.5 rounded-panel border border-linea bg-hoja p-5">
            <button type="button" onClick={confirmar} disabled={enviando} className={`${boton.primario} w-full py-3`}>
              <Stamp aria-hidden className="size-4" />
              {enviando ? 'Registrando…' : 'Confirmar recepción'}
            </button>
            <button
              type="button"
              onClick={() => navegar(`/recepcion/${id}`, { viewTransition: true })}
              className={`${boton.secundario} w-full`}
            >
              <ArrowLeft aria-hidden className="size-4" />
              Volver y revisar
            </button>
            {error && (
              <p role="alert" className="flex gap-2 rounded-lg bg-rechazo-claro px-3 py-2.5 text-sm font-medium text-rechazo">
                <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
                {error}
              </p>
            )}
            <p className="text-center text-xs text-tenue">
              Al confirmar se registra a tu nombre y {plural(resumen.cmANotificar.length, 'comisión recibe', 'comisiones reciben')} el aviso.
            </p>
          </div>
          <CancelarRecepcion idBolsin={id} className="w-full" />
        </aside>
      </div>
    </div>
  )
}
