import { ArrowRight, CircleCheck, Inbox, ListChecks, PackageSearch } from 'lucide-react'
import { Link, useRouteLoaderData } from 'react-router'
import type { BolsinResumen, InicioRecepcion } from '../api'
import { EtiquetaPrecinto } from '../componentes/Precinto'
import { boton } from '../componentes/estilos'
import { fechaYHora, haceCuanto, hoyLargo, plural, primerNombre, saludo } from '../formato'

/** Inicio: saludo, CM del usuario logueado (mostrarCM) y el acceso al paso 1 del CU. */
export function Inicio() {
  const { nombreEmpleado, cmUsuario, bolsines } = useRouteLoaderData('marco') as InicioRecepcion
  const porAntiguedad = [...bolsines].sort((a, b) => (a.fechaEnvio ?? '').localeCompare(b.fechaEnvio ?? ''))
  const primero = porAntiguedad[0]
  const porOrigen = contarPorOrigen(bolsines)

  return (
    <div className="space-y-8">
      <header className="border-b border-linea pb-6">
        <p className="text-sm text-tenue first-letter:uppercase">{hoyLargo()}</p>
        <h1 className="mt-1 text-[1.75rem] leading-tight font-bold tracking-[-0.015em]">
          {saludo()}, {primerNombre(nombreEmpleado)}
        </h1>
        <p className="mt-1.5 text-tenue">
          Estás recibiendo en <strong className="font-semibold text-grafito">{cmUsuario}</strong>.
        </p>
      </header>

      {bolsines.length === 0 ? (
        <div className="flex flex-col items-center rounded-panel border border-dashed border-linea-fuerte bg-hoja/60 px-6 py-16 text-center">
          <Inbox aria-hidden className="size-9 text-tenue" />
          <h2 className="mt-3 text-xl font-semibold">No hay bolsines en camino a tu comisión</h2>
          <p className="mt-1 max-w-md text-tenue">Cuando otra comisión despache un bolsín hacia la tuya, aparece acá para que lo recibas.</p>
        </div>
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <section aria-labelledby="titulo-pendientes" className="rounded-panel border border-linea bg-hoja">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-linea px-6 py-5">
              <div>
                <h2 id="titulo-pendientes" className="text-lg font-bold">
                  {plural(bolsines.length, 'bolsín espera', 'bolsines esperan')} recepción
                </h2>
                <p className="text-sm text-tenue">Enviados hacia tu comisión y todavía sin registrar.</p>
              </div>
              <Link to="/recepcion" viewTransition className={boton.primario}>
                Empezar a recibir
                <ArrowRight aria-hidden className="size-4" />
              </Link>
            </div>

            {primero && <ElQueMasEspera bolsin={primero} />}

            <div className="px-6 py-5">
              <h3 className="text-sm font-semibold">Por comisión de origen</h3>
              <ul className="mt-3 space-y-2.5">
                {porOrigen.map(([origen, cantidad]) => (
                  <li key={origen}>
                    <Link
                      to={`/recepcion?cm=${encodeURIComponent(origen)}`}
                      viewTransition
                      className="group grid grid-cols-[minmax(0,10rem)_1fr_auto] items-center gap-4 rounded-md text-sm"
                    >
                      <span className="truncate font-medium group-hover:text-sello group-hover:underline">{origen}</span>
                      <span aria-hidden className="h-2 overflow-hidden rounded-full bg-papel">
                        <span
                          className="block h-full rounded-full bg-sello/70 transition-colors group-hover:bg-sello"
                          style={{ width: `${(cantidad / porOrigen[0][1]) * 100}%` }}
                        />
                      </span>
                      <span className="text-tenue cifras">{plural(cantidad, 'bolsín', 'bolsines')}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <ComoSeRecibe />
        </div>
      )}
    </div>
  )
}

function ElQueMasEspera({ bolsin: b }: { bolsin: BolsinResumen }) {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-3 border-b border-linea bg-precinto-claro/60 px-6 py-5">
      <EtiquetaPrecinto numero={b.numeroPrecinto} grande id={b.id} />
      <div className="min-w-0 flex-1">
        <p className="text-sm text-tenue">El que más espera</p>
        <p className="font-semibold">
          {b.cmOrigen}, bolsín N.º <span className="cifras">{b.numeroBolsin}</span>
        </p>
        <p className="text-sm text-tenue">
          {haceCuanto(b.fechaEnvio).replace('enviado', 'Enviado')} ({fechaYHora(b.fechaEnvio)})
        </p>
      </div>
      <Link to={`/recepcion/${b.id}`} viewTransition className={boton.secundario}>
        Recibir este
      </Link>
    </div>
  )
}

/** Los tres pasos de una recepcion, para que nunca haya dudas de que viene despues. */
function ComoSeRecibe() {
  const pasos = [
    { icono: PackageSearch, titulo: 'Elegí el bolsín', texto: 'Buscalo por el número del precinto o por la comisión que lo mandó.' },
    { icono: ListChecks, titulo: 'Controlá lo que vino', texto: 'Marcá cada documento: llegó, falta o no corresponde.' },
    { icono: CircleCheck, titulo: 'Confirmá', texto: 'Revisás cómo va a quedar todo y recién ahí se registra y se avisa a la comisión de origen.' },
  ]
  return (
    <section aria-labelledby="titulo-como" className="rounded-panel border border-linea bg-panel/60 p-6">
      <h2 id="titulo-como" className="font-bold">
        Cómo se recibe un bolsín
      </h2>
      <ol className="mt-4 space-y-5">
        {pasos.map(({ icono: Icono, titulo, texto }, i) => (
          <li key={titulo} className="grid grid-cols-[2.25rem_1fr] gap-3">
            <span aria-hidden className="grid size-9 place-items-center rounded-lg bg-hoja text-sello shadow-[0_1px_2px_rgb(27_34_48/0.08)]">
              <Icono className="size-[1.125rem]" />
            </span>
            <div>
              <p className="font-semibold">
                <span className="text-tenue cifras">{i + 1}.</span> {titulo}
              </p>
              <p className="mt-0.5 text-sm text-tenue">{texto}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}

function contarPorOrigen(bolsines: BolsinResumen[]): [string, number][] {
  const cuenta = new Map<string, number>()
  for (const b of bolsines) cuenta.set(b.cmOrigen, (cuenta.get(b.cmOrigen) ?? 0) + 1)
  return [...cuenta].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
}
