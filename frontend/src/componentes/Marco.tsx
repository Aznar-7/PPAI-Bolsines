import { House, LogOut, PackageOpen, type LucideIcon } from 'lucide-react'
import { NavLink, Outlet, useNavigate, useNavigation, useRouteLoaderData } from 'react-router'
import { api, type InicioRecepcion } from '../api'
import { Marca } from './Marca'

/**
 * Layout comun de las pantallas con sesion: navegacion lateral (solo lo que existe en el CU 28),
 * quien esta trabajando y desde que comision medica, y el contenido.
 */
export function Marco() {
  const inicio = useRouteLoaderData('marco') as InicioRecepcion
  const navegacion = useNavigation()
  const navegar = useNavigate()
  const iniciales = inicio.nombreEmpleado
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')

  async function salir() {
    await api.salir().catch(() => undefined)
    navegar('/ingreso', { replace: true })
  }

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[15.5rem_1fr]">
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

      <aside className="sticky top-0 z-40 flex items-center gap-2 border-b border-linea bg-panel px-4 py-2.5 lg:h-dvh lg:flex-col lg:items-stretch lg:gap-0 lg:border-r lg:border-b-0 lg:px-3 lg:py-5">
        <div className="flex items-center gap-2.5 px-2 lg:mb-8">
          <Marca className="size-8" />
          <div className="leading-tight">
            <p className="font-bold tracking-tight">Bolsines</p>
            <p className="hidden text-xs text-tenue lg:block">Recepción</p>
          </div>
        </div>

        <nav aria-label="Principal" className="ml-auto lg:ml-0">
          <ul className="flex gap-1 lg:flex-col">
            <Item a="/inicio" icono={House} texto="Inicio" />
            <Item a="/recepcion" icono={PackageOpen} texto="Recibir bolsines" contador={inicio.bolsines.length} />
          </ul>
        </nav>

        <div className="hidden lg:mt-auto lg:block">
          <div className="rounded-xl border border-linea bg-hoja p-3">
            <div className="flex items-center gap-3">
              <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-full bg-sello text-sm font-bold text-white">
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
        </div>
        <button type="button" onClick={salir} aria-label="Salir" className="rounded-lg p-2 text-tenue hover:bg-hoja lg:hidden">
          <LogOut aria-hidden className="size-5" />
        </button>
      </aside>

      <main id="contenido" className="min-w-0 px-4 pt-6 pb-16 sm:px-8 lg:px-10 lg:pt-8">
        <div className="mx-auto max-w-[76rem]">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

function Item({ a, icono: Icono, texto, contador }: { a: string; icono: LucideIcon; texto: string; contador?: number }) {
  return (
    <li>
      <NavLink
        to={a}
        viewTransition
        className={({ isActive }) =>
          `flex items-center gap-3 rounded-lg px-3 py-2 text-[0.9375rem] font-medium transition-colors ${
            isActive ? 'bg-hoja text-sello shadow-[0_1px_2px_rgb(27_34_48/0.08)]' : 'text-tenue hover:bg-hoja/60 hover:text-grafito'
          }`
        }
      >
        <Icono aria-hidden className="size-[1.125rem] shrink-0" strokeWidth={2} />
        <span className="hidden sm:inline">{texto}</span>
        {contador !== undefined && contador > 0 && (
          <span className="ml-auto rounded-full bg-precinto px-2 py-px text-xs font-bold text-grafito cifras" aria-label={`${contador} pendientes`}>
            {contador}
          </span>
        )}
      </NavLink>
    </li>
  )
}
