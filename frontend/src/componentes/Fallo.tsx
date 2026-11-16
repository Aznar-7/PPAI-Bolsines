import { TriangleAlert } from 'lucide-react'
import { Link, isRouteErrorResponse, useRouteError } from 'react-router'
import { ErrorApi } from '../api'

/**
 * Cuando el gestor rechaza algo (RecepcionException) o el sistema no responde, se muestra el
 * motivo en la misma pantalla con una salida clara, nunca una pagina de error en blanco.
 */
export function Fallo() {
  const error = useRouteError()
  const noExiste = isRouteErrorResponse(error) && error.status === 404
  const titulo = noExiste ? 'Esta pantalla no existe' : 'No se pudo seguir'
  const mensaje =
    error instanceof ErrorApi
      ? error.message
      : noExiste
        ? 'Puede que el enlace esté mal escrito. Desde la bandeja seguís donde estabas.'
        : 'Algo falló en el sistema. Volvé a intentar en unos segundos.'

  return (
    <section role="alert" className="mx-auto max-w-xl py-16">
      <div className="rounded-panel border border-rechazo/25 bg-hoja p-6 shadow-hoja sm:p-8">
        <div className="flex items-start gap-4">
          <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-full bg-rechazo-claro text-rechazo">
            <TriangleAlert className="size-5" />
          </span>
          <div>
            <h1 className="text-xl font-bold">{titulo}</h1>
            <p className="mt-2 text-tenue">{mensaje}</p>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-3 pl-14">
          <Link
            to="/recepcion"
            viewTransition
            className="rounded-lg bg-sello px-4 py-2.5 font-semibold text-sobre-sello transition-colors hover:bg-sello-hondo"
          >
            Volver a los bolsines
          </Link>
          <Link to="/inicio" viewTransition className="rounded-lg px-4 py-2.5 font-medium text-sello hover:bg-sello-claro">
            Ir al inicio
          </Link>
        </div>
      </div>
    </section>
  )
}
