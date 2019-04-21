// Copyright (C) 2017-2019 Brainbean Apps OU (https://brainbeanapps.com).
// License AGPL-3.0 or later (https://www.gnu.org/licenses/agpl).

import 'ts-jest'
import * as dataplug from '../src'

describe('dataplug', () => {
  it('has "config" field', () => {
    expect(dataplug).toHaveProperty('config')
    expect(typeof dataplug.config).toBe('object')
  })

  it('has "ConfigDeclaration" class', () => {
    expect(dataplug).toHaveProperty('ConfigDeclaration')
    expect(typeof dataplug.ConfigDeclaration).toBe('function')
  })

  it('has "ConfigMapping" class', () => {
    expect(dataplug).toHaveProperty('ConfigMapping')
    expect(typeof dataplug.ConfigMapping).toBe('function')
  })

  it('has "Counter" class', () => {
    expect(dataplug).toHaveProperty('Counter')
    expect(typeof dataplug.Counter).toBe('function')
  })

  it('has "Filter" class', () => {
    expect(dataplug).toHaveProperty('Filter')
    expect(typeof dataplug.Filter).toBe('function')
  })

  it('has "Mapper" class', () => {
    expect(dataplug).toHaveProperty('Mapper')
    expect(typeof dataplug.Mapper).toBe('function')
  })

  it('has "replicate" function', () => {
    expect(dataplug).toHaveProperty('replicate')
    expect(typeof dataplug.replicate).toBe('function')
  })

  it('has "Replicator" class', () => {
    expect(dataplug).toHaveProperty('Replicator')
    expect(typeof dataplug.Replicator).toBe('function')
  })

  it('has "ReplicationChainBuilder" class', () => {
    expect(dataplug).toHaveProperty('ReplicationChainBuilder')
    expect(typeof dataplug.ReplicationChainBuilder).toBe('function')
  })

  it('has "Sequence" class', () => {
    expect(dataplug).toHaveProperty('Sequence')
    expect(typeof dataplug.Sequence).toBe('function')
  })

  it('has "Scanner" class', () => {
    expect(dataplug).toHaveProperty('Scanner')
    expect(typeof dataplug.Scanner).toBe('function')
  })

  it('has "source" function', () => {
    expect(dataplug).toHaveProperty('source')
    expect(typeof dataplug.source).toBe('function')
  })

  it('has "Source" class', () => {
    expect(dataplug).toHaveProperty('Source')
    expect(typeof dataplug.Source).toBe('function')
  })

  it('has "target" function', () => {
    expect(dataplug).toHaveProperty('target')
    expect(typeof dataplug.target).toBe('function')
  })

  it('has "Target" class', () => {
    expect(dataplug).toHaveProperty('Target')
    expect(typeof dataplug.Target).toBe('function')
  })

  describe('#source()', () => {
    it('creates an instance of Source', () => {
      expect(dataplug.source({}, null)).toBeInstanceOf(dataplug.Source)
    })
  })

  describe('#target()', () => {
    it('creates an instance of Target', () => {
      expect(dataplug.target({}, null)).toBeInstanceOf(dataplug.Target)
    })
  })

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
})
