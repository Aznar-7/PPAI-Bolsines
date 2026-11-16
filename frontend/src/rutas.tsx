import { redirect, type RouteObject } from 'react-router'
import { api, ErrorApi } from './api'
import { Cargando } from './componentes/Cargando'
import { Fallo } from './componentes/Fallo'
import { Marco } from './componentes/Marco'
import { Ingreso } from './pantallas/Ingreso'

/** Sin sesion, cualquier pantalla de la recepcion manda al ingreso y despues vuelve a donde estaba. */
async function conSesion<T>(pedido: () => Promise<T>, url: string): Promise<T> {
  try {
    return await pedido()
  } catch (e) {
    if (e instanceof ErrorApi && e.estado === 401) {
      const { pathname, search } = new URL(url)
      throw redirect(`/ingreso?volver=${encodeURIComponent(pathname + search)}`)
    }
    throw e
  }
}

// Cada pantalla se baja recien cuando se abre: el ingreso carga liviano.
export const rutas: RouteObject[] = [
  {
    path: '/ingreso',
    Component: Ingreso,
    HydrateFallback: Cargando,
    loader: async () => {
      const sesion = await api.sesion()
      if (sesion.logueado) throw redirect('/inicio')
      return sesion
    },
  },
  {
    // habilitarPantalla: la CM y los bolsines se piden una vez y los comparten Inicio y Bandeja.
    id: 'marco',
    Component: Marco,
    ErrorBoundary: Fallo,
    HydrateFallback: Cargando,
    loader: ({ request }) => conSesion(api.opcionRegistrarRecepcionDelBolsin, request.url),
    shouldRevalidate: ({ currentUrl, nextUrl, defaultShouldRevalidate }) =>
      // al volver a la bandeja desde otra pantalla se actualiza; filtrar no vuelve a pedir nada
      nextUrl.pathname !== currentUrl.pathname && defaultShouldRevalidate,
    children: [
      { index: true, loader: () => redirect('/inicio'), Component: () => null },
      { path: 'inicio', lazy: async () => ({ Component: (await import('./pantallas/Inicio')).Inicio }) },
      { path: 'recepcion', lazy: async () => ({ Component: (await import('./pantallas/Bandeja')).Bandeja }) },
      {
        path: 'recepcion/:idBolsin',
        ErrorBoundary: Fallo,
        loader: ({ params, request }) => conSesion(() => api.tomarSeleccionBolsin(Number(params.idBolsin)), request.url),
        lazy: async () => ({ Component: (await import('./pantallas/Control')).Control }),
      },
      { path: 'recepcion/:idBolsin/confirmar', lazy: async () => ({ Component: (await import('./pantallas/Confirmar')).Confirmar }) },
      { path: 'recepcion/:idBolsin/registrada', lazy: async () => ({ Component: (await import('./pantallas/Registrada')).Registrada }) },
      { path: '*', ErrorBoundary: Fallo, Component: () => null, loader: () => { throw new Response('', { status: 404 }) } },
    ],
  },
]
