import { House, LogOut, PackageOpen, PanelLeftClose, PanelLeftOpen, type LucideIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { NavLink, Outlet, useNavigate, useNavigation, useRouteLoaderData } from 'react-router'
import { api, type InicioRecepcion } from '../api'
import { Marca } from './Marca'
import { SelectorTema } from './Tema'

const CLAVE_PLEGADO = 'bolsines-lateral-plegado'

function leerPlegado() {
  try {
    return localStorage.getItem(CLAVE_PLEGADO) === '1'
  } catch {
    return false
  }
}

/**
 * Layout comun de las pantallas con sesion: navegacion lateral (solo lo que existe en el CU 28),
 * quien esta trabajando y desde que comision medica, y el contenido. En escritorio la barra se
 * puede plegar a una tira de iconos para dejarle todo el ancho a la tarea.
 */
export function Marco() {
  const inicio = useRouteLoaderData('marco') as InicioRecepcion
  const navegacion = useNavigation()
  const navegar = useNavigate()
  const [plegado, setPlegado] = useState(leerPlegado)
  const iniciales = inicio.nombreEmpleado
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')

  useEffect(() => {
    try {
      localStorage.setItem(CLAVE_PLEGADO, plegado ? '1' : '0')
    } catch {
      /* sin almacenamiento: vale para esta pestana */
    }
  }, [plegado])

  async function salir() {
    await api.salir().catch(() => undefined)
    navegar('/ingreso', { replace: true })
  }

  // En escritorio y plegada, los textos quedan solo para lectores de pantalla.
  const soloAbierta = plegado ? 'lg:sr-only' : ''

  return (
    <div
      className={`min-h-dvh transition-[grid-template-columns] duration-300 ease-salida lg:grid ${
        plegado ? 'lg:grid-cols-[4.25rem_minmax(0,1fr)]' : 'lg:grid-cols-[15.5rem_minmax(0,1fr)]'
      }`}
    >
      <div
        aria-hidden
        className={`fixed inset-x-0 top-0 z-50 h-0.5 origin-left bg-sello transition-transform duration-700 ease-salida ${
          navegacion.state === 'idle' ? 'scale-x-0 opacity-0' : 'scale-x-90'
        }`}
      />
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-hoja focus:px-3 focus:py-2"
      >
        Ir al contenido
      </a>

      <aside
        className={`sticky top-0 z-40 flex items-center gap-2 overflow-hidden border-b border-linea bg-panel px-4 py-2.5 lg:h-dvh lg:flex-col lg:items-stretch lg:gap-0 lg:border-r lg:border-b-0 lg:py-5 ${
          plegado ? 'lg:px-2.5' : 'lg:px-3'
        }`}
      >
        <div className={`flex items-center gap-2.5 lg:mb-8 ${plegado ? 'lg:flex-col lg:gap-3 lg:px-0' : 'px-2'}`}>
          <Marca className="size-8 shrink-0" />
          <div className={`leading-tight ${soloAbierta}`}>
            <p className="font-bold tracking-tight">Bolsines</p>
            <p className="hidden text-xs text-tenue lg:block">Recepción</p>
          </div>
          <button
            type="button"
            onClick={() => setPlegado((p) => !p)}
            aria-expanded={!plegado}
            aria-label={plegado ? 'Mostrar la barra lateral' : 'Plegar la barra lateral'}
            title={plegado ? 'Mostrar la barra lateral' : 'Plegar la barra lateral'}
            className={`hidden size-8 shrink-0 place-items-center rounded-lg text-tenue transition-colors hover:bg-hoja hover:text-grafito lg:grid ${plegado ? '' : 'ml-auto'}`}
          >
            {plegado ? <PanelLeftOpen aria-hidden className="size-[1.125rem]" /> : <PanelLeftClose aria-hidden className="size-[1.125rem]" />}
          </button>
        </div>

        <nav aria-label="Principal" className="ml-auto lg:ml-0">
          <ul className="flex gap-1 lg:flex-col">
            <Item a="/inicio" icono={House} texto="Inicio" plegado={plegado} />
            <Item a="/recepcion" icono={PackageOpen} texto="Recibir bolsines" contador={inicio.bolsines.length} plegado={plegado} />
          </ul>
        </nav>

        <div className="hidden lg:mt-auto lg:block lg:space-y-3">
          {plegado ? (
            <div className="grid justify-items-center gap-2">
              <SelectorTema compacto />
              <span
                title={`${inicio.nombreEmpleado}, ${inicio.cmUsuario}`}
                className="grid size-9 place-items-center rounded-full bg-sello text-sm font-bold text-sobre-sello"
              >
                <span aria-hidden>{iniciales}</span>
                <span className="sr-only">
                  {inicio.nombreEmpleado}, {inicio.cmUsuario}
                </span>
              </span>
              <button
                type="button"
                onClick={salir}
                aria-label="Salir"
                title="Salir"
                className="grid size-9 place-items-center rounded-lg text-tenue transition-colors hover:bg-hoja hover:text-grafito"
              >
                <LogOut aria-hidden className="size-[1.125rem]" />
              </button>
            </div>
          ) : (
            <>
              <div className="px-1">
                <p className="mb-1.5 px-1 text-xs text-tenue">Tema</p>
                <SelectorTema />
              </div>
              <div className="rounded-xl border border-linea bg-hoja p-3">
                <div className="flex items-center gap-3">
                  <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-full bg-sello text-sm font-bold text-sobre-sello">
                    {iniciales}
                  </span>
                  <div className="min-w-0 leading-tight">
                    <p className="truncate text-sm font-semibold">{inicio.nombreEmpleado}</p>
                    <p className="truncate text-xs text-tenue" title={inicio.cmUsuario}>
                      {inicio.cmUsuario}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={salir}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-linea px-3 py-2 text-sm font-medium text-tenue transition-colors hover:border-linea-fuerte hover:bg-papel hover:text-grafito"
                >
                  <LogOut aria-hidden className="size-4" />
                  Salir
                </button>
              </div>
            </>
          )}
        </div>
        <span className="lg:hidden">
          <SelectorTema compacto />
        </span>
        <button type="button" onClick={salir} aria-label="Salir" className="rounded-lg p-2 text-tenue hover:bg-hoja lg:hidden">
          <LogOut aria-hidden className="size-5" />
        </button>
      </aside>

      <main id="contenido" className="mesa min-w-0 px-4 pt-6 pb-16 sm:px-8 lg:px-10 lg:pt-8">
        <div className={`mx-auto transition-[max-width] duration-300 ${plegado ? 'max-w-[84rem]' : 'max-w-[76rem]'}`}>
          <Outlet />
        </div>
      </main>
    </div>
  )
}

function Item({
  a,
  icono: Icono,
  texto,
  contador,
  plegado,
}: {
  a: string
  icono: LucideIcon
  texto: string
  contador?: number
  plegado: boolean
}) {
  const hayPendientes = contador !== undefined && contador > 0
  return (
    <li>
      <NavLink
        to={a}
        viewTransition
        title={plegado ? (hayPendientes ? `${texto} (${contador})` : texto) : undefined}
        className={({ isActive }) =>
          `relative flex items-center gap-3 rounded-lg px-3 py-2 text-[0.9375rem] font-medium transition-colors ${
            plegado ? 'lg:justify-center lg:px-0' : ''
          } ${isActive ? 'bg-hoja-alta text-sello shadow-[0_1px_2px_rgb(0_0_0/0.1)]' : 'text-tenue hover:bg-hoja/60 hover:text-grafito'}`
        }
      >
        <Icono aria-hidden className="size-[1.125rem] shrink-0" strokeWidth={2} />
        <span className={`hidden whitespace-nowrap sm:inline ${plegado ? 'lg:sr-only' : ''}`}>{texto}</span>
        {hayPendientes && (
          <span
            className={`rounded-full bg-precinto text-xs font-bold text-tinta cifras ${
              plegado ? 'lg:absolute lg:top-0.5 lg:right-1 lg:grid lg:size-4 lg:place-items-center lg:px-0 lg:text-[0.625rem]' : ''
            } ml-auto px-2 py-px`}
            aria-label={`${contador} pendientes`}
          >
            {contador}
          </span>
        )}
      </NavLink>
    </li>
  )
}
