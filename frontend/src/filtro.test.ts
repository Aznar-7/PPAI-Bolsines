import { describe, expect, it } from 'vitest'
import type { BolsinResumen } from './api'
import { filtrarBolsines } from './filtro'

const bolsin = (id: number, numeroPrecinto: string, cmOrigen: string): BolsinResumen => ({
  id,
  numeroBolsin: 1000 + id,
  numeroPrecinto,
  cmOrigen,
  cantidadRemitos: 1,
  cantidadDocumentos: 2,
  peso: null,
  fechaEnvio: null,
})

const bolsines = [bolsin(1, '004512', 'CM Mendoza'), bolsin(2, '004533', 'CM Córdoba'), bolsin(3, '004577', 'CM Paraná')]

describe('filtrarBolsines (paso 4, A1 y A2)', () => {
  it('sin filtros muestra todos', () => {
    expect(filtrarBolsines(bolsines, '', '')).toEqual({ lista: bolsines, sinResultados: null })
  })

  it('filtra por parte del precinto', () => {
    expect(filtrarBolsines(bolsines, '512', '').lista.map((b) => b.id)).toEqual([1])
  })

  it('la CM de origen no distingue mayusculas ni tildes', () => {
    expect(filtrarBolsines(bolsines, '', 'cordoba').lista.map((b) => b.id)).toEqual([2])
  })

  it('A1: precinto que no existe', () => {
    expect(filtrarBolsines(bolsines, '9999', '').sinResultados).toBe('precinto')
  })

  it('A2: CM de origen sin bolsines', () => {
    expect(filtrarBolsines(bolsines, '', 'Salta').sinResultados).toBe('cm')
  })

  it('los dos filtros existen por separado pero no juntos', () => {
    expect(filtrarBolsines(bolsines, '4512', 'Paraná').sinResultados).toBe('combinacion')
  })

  it('sin bolsines no es un problema de filtros', () => {
    expect(filtrarBolsines([], '1', '').sinResultados).toBeNull()
  })
})
