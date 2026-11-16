import { redirect, type RouteObject } from 'react-router'
import { api, ErrorApi } from './api'
import { Fallo } from './componentes/Fallo'
import { Marco } from './componentes/Marco'
import { Bandeja } from './pantallas/Bandeja'
import { Control } from './pantallas/Control'
import { Ingreso } from './pantallas/Ingreso'
import { Inicio } from './pantallas/Inicio'

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

export const rutas: RouteObject[] = [
  {
    path: '/ingreso',
    Component: Ingreso,
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
    loader: ({ request }) => conSesion(api.opcionRegistrarRecepcionDelBolsin, request.url),
    shouldRevalidate: ({ currentUrl, nextUrl, defaultShouldRevalidate }) =>
      // al volver a la bandeja desde otra pantalla se actualiza; filtrar no vuelve a pedir nada
      nextUrl.pathname !== currentUrl.pathname && defaultShouldRevalidate,
    children: [
      { index: true, loader: () => redirect('/inicio') },
      { path: 'inicio', Component: Inicio },
      { path: 'recepcion', Component: Bandeja },
      {
        path: 'recepcion/:idBolsin',
        Component: Control,
        ErrorBoundary: Fallo,
        loader: ({ params, request }) => conSesion(() => api.tomarSeleccionBolsin(Number(params.idBolsin)), request.url),
      },
      { path: '*', ErrorBoundary: Fallo, loader: () => { throw new Response('', { status: 404 }) } },
    ],
  },
]
