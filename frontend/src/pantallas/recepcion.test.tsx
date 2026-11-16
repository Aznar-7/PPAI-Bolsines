import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { rutas } from '../rutas'

const bolsin = { id: 1, numeroBolsin: 1287, numeroPrecinto: '004512', cmOrigen: 'CM Mendoza', cantidadRemitos: 1, cantidadDocumentos: 2, peso: 1250, fechaEnvio: null }
const inicio = (cmEsCentral: boolean) => ({ nombreEmpleado: 'Silvina Romero', cmUsuario: 'Comision Medica Central', cmEsCentral, bolsines: [bolsin] })
const detalle = {
  bolsin,
  cmDestino: 'Comision Medica Central',
  remitos: [
    {
      numero: 213,
      documentacion: [
        { id: 101, numero: 4, asunto: 'Expediente 5521', tipo: 'Expediente' },
        { id: 102, numero: 5, asunto: 'Radiografia 6034', tipo: 'Estudio medico' },
      ],
    },
  ],
}

/** API simulada: guarda lo que la pantalla le manda al gestor y responde como el gestor de verdad. */
function api(cmEsCentral = true) {
  const pedidos: { url: string; metodo: string; cuerpo?: unknown }[] = []
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init?: RequestInit) => {
      const metodo = init?.method ?? 'GET'
      const cuerpo = init?.body ? JSON.parse(String(init.body)) : undefined
      pedidos.push({ url, metodo, cuerpo })
      const responder = (estado: number, json?: unknown) => new Response(json === undefined ? null : JSON.stringify(json), { status: estado })
      if (url === '/api/recepcion') return responder(200, inicio(cmEsCentral))
      if (url === '/api/recepcion/1') return responder(200, detalle)
      if (url === '/api/recepcion/seleccion' && metodo === 'DELETE') return responder(204)
      if (url === '/api/recepcion/seleccion') {
        const marcas = cuerpo as Record<string, string>
        const documentacion = detalle.remitos[0].documentacion.map((d) => ({ ...d, remito: 213, situacion: marcas[d.id] ?? 'RECIBIDA' }))
        const completo = documentacion.every((d) => d.situacion === 'RECIBIDA')
        return responder(200, {
          bolsin: detalle,
          estadoFinalBolsin: 'Recibido en CM destino',
          remitos: [{ numero: 213, estadoFinal: completo ? 'Recibido y aceptado' : 'Recibido y aceptado parcial' }],
          documentacion,
          cmANotificar: ['CM Mendoza'],
        })
      }
      if (url === '/api/recepcion/confirmacion')
        return responder(200, {
          fechaHora: '2026-11-16T18:00:00',
          responsable: 'Silvina Romero',
          resumen: { bolsin: detalle, estadoFinalBolsin: 'Recibido en CM destino', remitos: [{ numero: 213, estadoFinal: 'Recibido y aceptado' }], documentacion: [], cmANotificar: ['CM Mendoza'] },
          avisos: [{ cmDestino: 'CM Mendoza', email: 'mesa@mendoza.gob.ar', asunto: 'Recepcion del bolsin 1287', detalle: ['Recibidas y aceptadas: 2 de 2'] }],
        })
      return responder(404, { detail: 'no encontrado' })
    }),
  )
  return pedidos
}

function abrir(url: string) {
  const router = createMemoryRouter(rutas, { initialEntries: [url] })
  render(<RouterProvider router={router} />)
  return router
}

beforeEach(() => sessionStorage.clear())
afterEach(() => vi.unstubAllGlobals())

describe('T8: control, confirmacion y exito', () => {
  it('muestra cada remito con su numero y cada documentacion con asunto y tipo', async () => {
    api()
    abrir('/recepcion/1')
    expect(await screen.findByRole('heading', { name: 'Remito N.º 213' })).toBeInTheDocument()
    expect(screen.getByText('Expediente 5521')).toBeInTheDocument()
    expect(screen.getByText(/Estudio medico/)).toBeInTheDocument()
  })

  it('un usuario que no es de la CMC no ve la opcion Redirigir', async () => {
    api(false)
    abrir('/recepcion/1')
    await screen.findByRole('heading', { name: 'Remito N.º 213' })
    expect(screen.queryByRole('radio', { name: /Redirigir/ })).not.toBeInTheDocument()
    expect(screen.getAllByRole('radio', { name: /Falta/ })).toHaveLength(2)
  })

  it('con "Llegó todo" y confirmar se completa el flujo principal y el aviso pasa a Enviado', async () => {
    const pedidos = api()
    const router = abrir('/recepcion/1')
    // la barra fija de pantallas chicas repite la accion: se usa la del resumen
    await userEvent.click((await screen.findAllByRole('button', { name: 'Llegó todo' }))[0])
    await userEvent.click(screen.getAllByRole('button', { name: /Revisar y confirmar/ })[0])
    expect(await screen.findByRole('heading', { name: 'Revisá cómo va a quedar y confirmá' })).toBeInTheDocument()
    expect(pedidos.find((p) => p.url === '/api/recepcion/seleccion')?.cuerpo).toEqual({ 101: 'RECIBIDA', 102: 'RECIBIDA' })

    await userEvent.click(screen.getByRole('button', { name: /Confirmar recepción/ }))
    expect(await screen.findByRole('heading', { name: 'Recepción registrada' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/recepcion/1/registrada')
    expect(screen.getByText('Enviando…')).toBeInTheDocument()
    expect(await screen.findByText('Enviado', {}, { timeout: 3000 })).toBeInTheDocument()
    expect(await screen.findByText('El mail ha sido enviado')).toBeInTheDocument()
  })

  it('un documento que falta aparece en el resumen con el estado en que va a quedar', async () => {
    api()
    abrir('/recepcion/1')
    await userEvent.click((await screen.findAllByRole('radio', { name: /Falta/ }))[1])
    await userEvent.click(screen.getAllByRole('button', { name: 'El resto llegó' })[0])
    await userEvent.click(screen.getAllByRole('button', { name: /Revisar y confirmar/ })[0])
    const comprobante = await screen.findByRole('article', { name: 'Comprobante de la recepción' })
    expect(within(comprobante).getByText('Quedan como no recibida (1)')).toBeInTheDocument()
    expect(within(comprobante).getByText('Recibido y aceptado parcial')).toBeInTheDocument()
  })

  it('"Volver y revisar" vuelve al control con las marcas intactas', async () => {
    api()
    abrir('/recepcion/1')
    await userEvent.click((await screen.findAllByRole('radio', { name: /No corresponde/ }))[0])
    await userEvent.click(screen.getAllByRole('button', { name: 'El resto llegó' })[0])
    await userEvent.click(screen.getAllByRole('button', { name: /Revisar y confirmar/ })[0])
    await userEvent.click(await screen.findByRole('button', { name: /Volver y revisar/ }))
    await screen.findByRole('heading', { name: 'Marcá cómo llegó cada documento' })
    expect(screen.getAllByRole('radio', { name: /No corresponde/ })[0]).toBeChecked()
    expect(screen.getAllByRole('radio', { name: /Llegó/ })[1]).toBeChecked()
  })

  it('cancelar, despues de confirmar el "¿seguro?", vuelve a la bandeja sin registrar nada', async () => {
    const pedidos = api()
    const router = abrir('/recepcion/1')
    await userEvent.click(await screen.findByRole('button', { name: 'Cancelar la recepción' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Sí, cancelar' }))
    await screen.findByRole('heading', { name: 'Elegí el bolsín que vas a recibir' })
    expect(router.state.location.pathname).toBe('/recepcion')
    expect(pedidos.some((p) => p.url === '/api/recepcion/seleccion' && p.metodo === 'DELETE')).toBe(true)
    expect(pedidos.some((p) => p.url === '/api/recepcion/confirmacion')).toBe(false)
  })
})
