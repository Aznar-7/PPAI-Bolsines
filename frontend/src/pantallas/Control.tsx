import { FileText } from 'lucide-react'
import { Link, useLoaderData } from 'react-router'
import type { DetalleBolsin } from '../api'
import { FichaBolsin } from '../componentes/FichaBolsin'
import { Pasos } from '../componentes/Pasos'
import { boton } from '../componentes/estilos'
import { EncabezadoPagina } from '../componentes/ui'
import { plural } from '../formato'

/**
 * Controlar contenido (paso 6): por cada remito su numero (mostrarNroRemito) y por cada
 * documentacion su asunto y su tipo (mostrarAsuntoDocumentacion, mostrarTipoDocumentacion).
 * El marcado documento por documento llega en la T8.
 */
export function Control() {
  const { bolsin, cmDestino, remitos } = useLoaderData() as DetalleBolsin

  return (
    <div className="space-y-6">
      <EncabezadoPagina
        migas={[
          { texto: 'Inicio', a: '/inicio' },
          { texto: 'Recibir bolsines', a: '/recepcion' },
          { texto: `Bolsín N.º ${bolsin.numeroBolsin}` },
        ]}
        titulo="Controlá lo que vino en el bolsín"
        descripcion={`Abrí el bolsín y compará con esta lista: ${plural(bolsin.cantidadRemitos, 'remito', 'remitos')} con ${plural(bolsin.cantidadDocumentos, 'documento', 'documentos')} en total.`}
        extra={<Pasos actual={2} />}
      />

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_21rem]">
        <div className="min-w-0 space-y-5">
          {remitos.map((remito) => (
            <section key={remito.numero} aria-labelledby={`remito-${remito.numero}`} className="overflow-hidden rounded-panel border border-linea bg-hoja">
              <div className="flex items-center justify-between gap-4 border-b border-linea bg-papel/70 px-5 py-3">
                <h2 id={`remito-${remito.numero}`} className="font-bold cifras">
                  Remito N.º {remito.numero}
                </h2>
                <span className="text-sm text-tenue">{plural(remito.documentacion.length, 'documento', 'documentos')}</span>
              </div>
              <table className="w-full text-left text-[0.9375rem]">
                <thead className="sr-only sm:not-sr-only">
                  <tr className="border-b border-linea">
                    <th scope="col" className="px-5 py-2 tabla-encabezado">Asunto</th>
                    <th scope="col" className="px-5 py-2 tabla-encabezado">Tipo</th>
                    <th scope="col" className="hidden px-5 py-2 text-right tabla-encabezado sm:table-cell">N.º</th>
                  </tr>
                </thead>
                <tbody>
                  {remito.documentacion.map((doc) => (
                    <tr key={doc.id} className="border-b border-linea last:border-b-0">
                      <td className="py-3.5 pr-3 pl-5">
                        <span className="flex items-center gap-3 font-medium">
                          <FileText aria-hidden className="size-4 shrink-0 text-tenue" />
                          {doc.asunto}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="rounded-full border border-linea bg-papel px-2.5 py-0.5 text-sm whitespace-nowrap text-tenue">{doc.tipo}</span>
                      </td>
                      <td className="hidden px-5 py-3.5 text-right text-sm text-tenue cifras sm:table-cell">{doc.numero}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          ))}
        </div>

        <aside aria-label="Bolsín que estás controlando" className="space-y-4 xl:sticky xl:top-8">
          <div className="rounded-panel border border-linea bg-hoja p-5">
            <FichaBolsin bolsin={bolsin} cmDestino={cmDestino} conTransicion />
          </div>
          <Link to="/recepcion" viewTransition className={`${boton.secundario} w-full`}>
            Elegir otro bolsín
          </Link>
        </aside>
      </div>
    </div>
  )
}
