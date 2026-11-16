import { ArrowRight, CircleCheck, Clock, Coffee, FileCheck2, Files, ListChecks, Package, PackageSearch, Weight, type LucideIcon } from 'lucide-react'
import { Link, useRouteLoaderData } from 'react-router'
import type { BolsinResumen, InicioRecepcion } from '../api'
import { boton } from '../componentes/estilos'
import { Perchero } from '../componentes/Perchero'
import { diasEsperando, haceCuanto, hoyLargo, peso, plural, primerNombre, saludo } from '../formato'

/** Inicio: saludo, CM del usuario logueado (mostrarCM) y el acceso al paso 1 del CU. */
export function Inicio() {
  const { nombreEmpleado, cmUsuario, bolsines } = useRouteLoaderData('marco') as InicioRecepcion
  const porAntiguedad = [...bolsines].sort((a, b) => (a.fechaEnvio ?? '').localeCompare(b.fechaEnvio ?? ''))
  const primero = porAntiguedad[0]
  const porOrigen = contarPorOrigen(bolsines)

  return (
    <div className="space-y-6">
      <section
        aria-labelledby="saludo"
        className="relative overflow-hidden rounded-[20px] border border-linea bg-hoja shadow-hoja"
      >
        <div className="grid gap-8 p-6 sm:p-8 lg:min-h-[22rem] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-10 lg:p-10">
          <div className="flex flex-col">
            <p className="text-sm text-tenue first-letter:uppercase">{hoyLargo()}</p>
            <h1 id="saludo" className="mt-2 text-[2.25rem] leading-[1.05] font-bold tracking-[-0.025em] ancho-titular sm:text-[2.75rem]">
              {saludo()},
              <br />
              {primerNombre(nombreEmpleado)}
            </h1>
            <p className="mt-4 max-w-[46ch] text-[1.0625rem] text-tenue">
              {bolsines.length === 0 ? (
                <>
                  No hay bolsines en camino a <strong className="font-semibold text-grafito">{cmUsuario}</strong>. Cuando otra
                  comisión despache uno, va a aparecer colgado acá.
                </>
              ) : (
                <>
                  Te {bolsines.length === 1 ? 'espera' : 'esperan'}{' '}
                  <strong className="font-semibold text-grafito">{plural(bolsines.length, 'bolsín', 'bolsines')}</strong> en{' '}
                  {cmUsuario}.
                  {primero?.fechaEnvio && (
                    <>
                      {' '}
                      El de {primero.cmOrigen} salió {haceCuanto(primero.fechaEnvio).replace('enviado ', '')}: conviene empezar por ese.
                    </>
                  )}
                </>
              )}
            </p>
            {bolsines.length > 0 && (
              <div className="mt-7 flex flex-wrap gap-3 lg:mt-auto lg:pt-8">
                <Link to="/recepcion" viewTransition className={`${boton.primario} px-5 py-3`}>
                  Empezar a recibir
                  <ArrowRight aria-hidden className="size-4" />
                </Link>
                {primero && (
                  <Link to={`/recepcion/${primero.id}`} viewTransition className={`${boton.secundario} px-5 py-3`}>
                    Abrir el de {primero.cmOrigen.replace(/^CM\s+/i, '')}
                  </Link>
                )}
              </div>
            )}
          </div>

          <div className="mesa -m-2 flex flex-col justify-center rounded-2xl bg-papel/70 p-5 sm:p-8">
            {bolsines.length === 0 ? (
              <div className="grid h-full min-h-48 place-items-center text-center text-tenue">
                <div>
                  <Coffee aria-hidden className="mx-auto size-8" />
                  <p className="mt-2 font-medium">El perchero está vacío</p>
                </div>
              </div>
            ) : (
              <Perchero bolsines={porAntiguedad} idMasViejo={bolsines.length > 1 ? primero?.id : undefined} />
            )}
          </div>
        </div>
      </section>

      {bolsines.length > 0 && (
        <div className="grid items-stretch gap-6 md:grid-cols-2 xl:grid-cols-3">
          <section aria-labelledby="titulo-origen" className="rounded-panel border border-linea bg-hoja p-6">
            <h2 id="titulo-origen" className="font-bold">
              De dónde vienen
            </h2>
            <p className="text-sm text-tenue">Elegí una comisión para ver solo sus bolsines.</p>
            <ul className="mt-4 divide-y divide-linea">
              {porOrigen.map(([origen, cantidad]) => (
                <li key={origen}>
                  <Link
                    to={`/recepcion?cm=${encodeURIComponent(origen)}`}
                    viewTransition
                    className="group -mx-2 flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-papel"
                  >
                    <span aria-hidden className="grid size-8 place-items-center rounded-full bg-sello-claro text-xs font-bold text-sello">
                      {iniciales(origen)}
                    </span>
                    <span className="flex-1 truncate font-medium">{origen}</span>
                    <span className="text-right text-sm leading-tight text-tenue cifras">
                      {plural(cantidad.bolsines, 'bolsín', 'bolsines')}
                      <span className="block text-xs">{plural(cantidad.documentos, 'documento', 'documentos')}</span>
                    </span>
                    <ArrowRight aria-hidden className="size-4 text-tenue opacity-0 transition-opacity group-hover:opacity-100" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <EnLaMesa bolsines={bolsines} />
          <ComoSeRecibe />
        </div>
      )}
    </div>
  )
}

/** Los tres pasos de una recepcion, para que nunca haya dudas de que viene despues. */
function ComoSeRecibe() {
  const pasos = [
    { icono: PackageSearch, titulo: 'Elegí el bolsín', texto: 'Buscalo por el número del precinto o por la comisión que lo mandó.' },
    { icono: ListChecks, titulo: 'Controlá lo que vino', texto: 'Marcá cada documento: llegó, falta o no corresponde.' },
    { icono: CircleCheck, titulo: 'Confirmá', texto: 'Ves cómo queda todo y recién ahí se registra y se avisa a la comisión de origen.' },
  ]
  return (
    <section aria-labelledby="titulo-como" className="rounded-panel border border-linea bg-hoja p-6">
      <h2 id="titulo-como" className="font-bold">
        Cómo se recibe un bolsín
      </h2>
      <p className="text-sm text-tenue">Tres pasos. Nada queda registrado hasta el último.</p>
      <ol className="relative mt-5 space-y-5">
        <span aria-hidden className="absolute top-4 bottom-4 left-[1.0625rem] w-0.5 bg-linea" />
        {pasos.map(({ icono: Icono, titulo, texto }) => (
          <li key={titulo} className="relative grid grid-cols-[2.25rem_1fr] gap-3">
            <span aria-hidden className="grid size-9 place-items-center rounded-full border border-linea bg-hoja-alta text-sello">
              <Icono className="size-[1.125rem]" />
            </span>
            <div className="pt-1">
              <p className="font-semibold">{titulo}</p>
              <p className="mt-0.5 text-sm text-tenue">{texto}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}

function iniciales(cm: string) {
  const nombre = cm.replace(/^CM\s+/i, '')
  return nombre.slice(0, 2).toUpperCase()
}

function contarPorOrigen(bolsines: BolsinResumen[]): [string, { bolsines: number; documentos: number }][] {
  const cuenta = new Map<string, { bolsines: number; documentos: number }>()
  for (const b of bolsines) {
    const c = cuenta.get(b.cmOrigen) ?? { bolsines: 0, documentos: 0 }
    cuenta.set(b.cmOrigen, { bolsines: c.bolsines + 1, documentos: c.documentos + b.cantidadDocumentos })
  }
  return [...cuenta].sort((a, b) => b[1].bolsines - a[1].bolsines || a[0].localeCompare(b[0]))
}

/** Cuanto trabajo hay por delante: lo que la encargada va a tener que abrir y controlar. */
function EnLaMesa({ bolsines }: { bolsines: BolsinResumen[] }) {
  const remitos = bolsines.reduce((t, b) => t + b.cantidadRemitos, 0)
  const documentos = bolsines.reduce((t, b) => t + b.cantidadDocumentos, 0)
  const gramos = bolsines.reduce((t, b) => t + (b.peso ?? 0), 0)
  const demorados = bolsines.filter((b) => diasEsperando(b.fechaEnvio) >= 3).length
  const filas: [LucideIcon, string, string][] = [
    [Package, 'Bolsines', String(bolsines.length)],
    [Files, 'Remitos', String(remitos)],
    [FileCheck2, 'Documentos para controlar', String(documentos)],
    [Weight, 'Peso total', peso(gramos || null)],
  ]
  return (
    <section aria-labelledby="titulo-mesa" className="flex flex-col rounded-panel border border-linea bg-hoja p-6">
      <h2 id="titulo-mesa" className="font-bold">
        Lo que hay en la mesa
      </h2>
      <p className="text-sm text-tenue">Todo lo pendiente, sumado.</p>
      <dl className="mt-4 divide-y divide-linea">
        {filas.map(([Icono, titulo, valor]) => (
          <div key={titulo} className="flex items-center gap-3 py-2.5">
            <Icono aria-hidden className="size-4 text-tenue" />
            <dt className="flex-1 text-sm">{titulo}</dt>
            <dd className="font-bold cifras">{valor}</dd>
          </div>
        ))}
      </dl>
      {demorados > 0 && (
        <p className="mt-auto flex items-center gap-2 rounded-lg bg-falta-claro px-3 py-2 text-sm font-medium text-falta">
          <Clock aria-hidden className="size-4 shrink-0" />
          {demorados === 1 ? '1 bolsín espera' : `${demorados} bolsines esperan`} hace 3 días o más.
        </p>
      )}
    </section>
  )
}
