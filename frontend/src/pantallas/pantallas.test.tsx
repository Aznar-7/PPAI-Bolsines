import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { rutas } from '../rutas'

const inicio = {
  nombreEmpleado: 'Silvina Romero',
  cmUsuario: 'Comision Medica Central',
  cmEsCentral: true,
  bolsines: [
    { id: 1, numeroBolsin: 1287, numeroPrecinto: '004512', cmOrigen: 'CM Mendoza', cantidadRemitos: 3, cantidadDocumentos: 6, peso: 1250, fechaEnvio: null },
    { id: 2, numeroBolsin: 1291, numeroPrecinto: '004533', cmOrigen: 'CM Cordoba', cantidadRemitos: 1, cantidadDocumentos: 3, peso: 480, fechaEnvio: null },
  ],
}

/** Simula la API de la pantalla: cada URL devuelve [estado, cuerpo]. */
function api(respuestas: Record<string, [number, unknown]>) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      const [estado, cuerpo] = respuestas[url] ?? [404, { detail: 'no encontrado' }]
      return new Response(estado === 204 ? null : JSON.stringify(cuerpo), { status: estado })
    }),
  )
}

function abrir(url: string) {
  const router = createMemoryRouter(rutas, { initialEntries: [url] })
  render(<RouterProvider router={router} />)
  return router
}

afterEach(() => vi.unstubAllGlobals())

describe('T7: ingreso, inicio y bandeja', () => {
  it('sin sesion, la bandeja manda al ingreso', async () => {
    api({ '/api/recepcion': [401, { detail: 'Ingresá' }], '/api/sesion': [200, { logueado: false, modoDePrueba: false }] })
    const router = abrir('/recepcion')
    expect(await screen.findByRole('heading', { name: 'Ingresá al sistema' })).toBeInTheDocument()
    expect(router.state.location.search).toBe('?volver=%2Frecepcion')
  })

  it('con datos incorrectos muestra el error y no entra', async () => {
    api({ '/api/sesion': [200, { logueado: false, modoDePrueba: false }] })
    abrir('/ingreso')
    await userEvent.type(await screen.findByLabelText('Usuario'), 'silvina')
    await userEvent.type(screen.getByLabelText('Contraseña'), 'mal')
    api({ '/api/sesion': [401, { detail: 'El usuario o la contraseña no son correctos.' }] })
    await userEvent.click(screen.getByRole('button', { name: 'Ingresar' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('El usuario o la contraseña no son correctos.')
  })

  it('el inicio muestra el nombre y la comision medica del usuario', async () => {
    api({ '/api/recepcion': [200, inicio] })
    abrir('/inicio')
    expect(await screen.findByRole('heading', { name: 'Silvina' })).toBeInTheDocument()
    expect(screen.getAllByText('Comision Medica Central').length).toBeGreaterThan(0)
  })

  it('la bandeja lista CM origen y precinto, y avisa A1 con opcion de ver todos', async () => {
    api({ '/api/recepcion': [200, inicio] })
    abrir('/recepcion')
    expect(await screen.findByText('CM Mendoza')).toBeInTheDocument()
    expect(screen.getByText('004533')).toBeInTheDocument()

    await userEvent.type(screen.getByLabelText('Número de precinto'), '9999')
    expect(await screen.findByText('No hay ningún bolsín con el precinto 9999')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Ver todos los bolsines' }))
    expect(await screen.findByText('CM Cordoba')).toBeInTheDocument()
  })

  it('A2: una CM de origen sin bolsines', async () => {
    api({ '/api/recepcion': [200, inicio] })
    abrir('/recepcion?cm=Salta')
    expect(await screen.findByText('No llegó ningún bolsín desde Salta')).toBeInTheDocument()
  })

  it('seleccionar un bolsin pasa a la pantalla de control', async () => {
    api({
      '/api/recepcion': [200, inicio],
      '/api/recepcion/1': [200, { bolsin: inicio.bolsines[0], cmDestino: 'Comision Medica Central', remitos: [{ numero: 213, documentacion: [{ id: 101, numero: 101, asunto: 'Dictamen medico', tipo: 'Dictamen' }] }] }],
    })
    abrir('/recepcion')
    await userEvent.click(await screen.findByRole('link', { name: /CM Mendoza/ }))
    expect(await screen.findByRole('heading', { name: 'Remito N.º 213' })).toBeInTheDocument()
    expect(screen.getByText('Dictamen medico')).toBeInTheDocument()
  })

  it('un rechazo del gestor muestra su mensaje en la pantalla', async () => {
    api({
      '/api/recepcion': [200, inicio],
      '/api/recepcion/7': [409, { detail: 'El bolsin 1300 no esta pendiente de recepcion en tu comision medica.' }],
    })
    abrir('/recepcion/7')
    expect(await screen.findByRole('alert')).toHaveTextContent('no esta pendiente de recepcion')
  })
})
