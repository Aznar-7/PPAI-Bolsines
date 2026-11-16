import { Link, useLoaderData } from 'react-router'
import type { DetalleBolsin } from '../api'
import { Pasos } from '../componentes/Pasos'
import { EtiquetaPrecinto } from '../componentes/Precinto'
import { plural } from '../formato'

/**
 * Controlar contenido (paso 6): por cada remito su numero (mostrarNroRemito) y por cada
 * documentacion su asunto y su tipo (mostrarAsuntoDocumentacion, mostrarTipoDocumentacion).
 * El marcado documento por documento llega en la T8.
 */
export function Control() {
  const { bolsin, cmDestino, remitos } = useLoaderData() as DetalleBolsin

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <Link to="/recepcion" viewTransition className="text-sm font-medium text-sello hover:underline">
          Volver a los bolsines
        </Link>
        <Pasos actual={2} />
      </div>

      <header className="flex flex-wrap items-center gap-x-6 gap-y-4">
        <EtiquetaPrecinto numero={bolsin.numeroPrecinto} id={bolsin.id} grande />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bolsín N.º {bolsin.numeroBolsin}</h1>
          <p className="text-tenue">
            Desde {bolsin.cmOrigen} hacia {cmDestino}. {plural(bolsin.cantidadRemitos, 'remito', 'remitos')},{' '}
            {plural(bolsin.cantidadDocumentos, 'documento', 'documentos')}.
          </p>
        </div>
      </header>

      <div className="space-y-6">
        {remitos.map((remito) => (
          <section key={remito.numero} aria-labelledby={`remito-${remito.numero}`} className="rounded-panel bg-hoja shadow-hoja">
            <h2 id={`remito-${remito.numero}`} className="border-b border-linea px-6 py-4 font-semibold cifras">
              Remito N.º {remito.numero}
            </h2>
            <ul>
              {remito.documentacion.map((doc) => (
                <li key={doc.id} className="flex items-center justify-between gap-4 border-b border-linea px-6 py-4 last:border-b-0">
                  <span className="font-medium">{doc.asunto}</span>
                  <span className="shrink-0 rounded-full bg-papel px-3 py-1 text-sm text-tenue">{doc.tipo}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}
