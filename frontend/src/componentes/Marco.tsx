import { Link, Outlet, useNavigate, useNavigation, useRouteLoaderData } from 'react-router'
import { api, type InicioRecepcion } from '../api'
import { Marca } from './Marca'

/** Layout comun de las pantallas con sesion: encabezado con la CM y el usuario, y el contenido. */
export function Marco() {
  const inicio = useRouteLoaderData('marco') as InicioRecepcion
  const navegacion = useNavigation()
  const navegar = useNavigate()

  async function salir() {
    await api.salir().catch(() => undefined)
    navegar('/ingreso', { replace: true })
  }

  return (
    <div className="min-h-dvh">
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
      <header className="border-b border-linea bg-hoja/85 backdrop-blur supports-[backdrop-filter]:bg-hoja/70 sticky top-0 z-40">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
          <Link to="/inicio" viewTransition className="flex items-center gap-2.5 rounded-md">
            <Marca />
            <span className="text-lg font-bold tracking-tight">Bolsines</span>
          </Link>
          <div className="ml-auto flex min-w-0 items-center gap-3 sm:gap-5">
            <div className="hidden min-w-0 text-right leading-tight sm:block">
              <p className="truncate text-sm font-semibold">{inicio.nombreEmpleado}</p>
              <p className="truncate text-xs text-tenue ancho-denso">{inicio.cmUsuario}</p>
            </div>
            <button
              type="button"
              onClick={salir}
              className="rounded-lg border border-linea px-3 py-1.5 text-sm font-medium text-tenue transition-colors hover:border-linea-fuerte hover:text-grafito"
            >
              Salir
            </button>
          </div>
        </div>
      </header>
      <main id="contenido" className="mx-auto max-w-6xl px-4 pt-8 pb-20 sm:px-6 sm:pt-12">
        <Outlet />
      </main>
    </div>
  )
}
