// Copyright (C) 2017-2019 Brainbean Apps OU (https://brainbeanapps.com).
// License AGPL-3.0 or later (https://www.gnu.org/licenses/agpl).

import 'ts-jest'
import { dataplug } from '../src'

describe('dataplug.config', () => {
  it('has "declare" function', () => {
    expect(dataplug.config).toHaveProperty('declare')
    expect(typeof dataplug.config.declare).toBe('function')
  })

  it('has "map" function', () => {
    expect(dataplug.config).toHaveProperty('map')
    expect(typeof dataplug.config.map).toBe('function')
  })

  describe('#declare()', () => {
    it('creates an instance of ConfigDeclaration', () => {
      expect(dataplug.config.declare()).toBeInstanceOf(
        dataplug.ConfigDeclaration,
      )
    })
  })

  describe('#map()', () => {
    it('creates an instance of ConfigMapping', () => {
      expect(dataplug.config.map()).toBeInstanceOf(dataplug.ConfigMapping)
    })
  })
})
