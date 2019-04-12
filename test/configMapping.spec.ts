// Copyright (C) 2017-2019 Brainbean Apps OU (https://brainbeanapps.com).
// License AGPL-3.0 or later (https://www.gnu.org/licenses/agpl).

import 'ts-jest'
import ConfigMapping from '../src/configMapping'

describe('ConfigMapping', () => {
  describe('#constructor()', () => {
    it('has default parameters', () => {
      expect(() => new ConfigMapping()).not.toThrow()
    })

    it('clones other instance', () => {
      const mapper = (value: any) => {}
      const other = new ConfigMapping().remap('property', mapper)
      expect(new ConfigMapping(other)).toHaveProperty('property')
    })
  })

  describe('#extended()', () => {
    it('has default parameters', () => {
      expect(() => new ConfigMapping().extended()).not.toThrow()
    })

    it('clones other instance', () => {
      expect(
        new ConfigMapping().remap('property', (value: any) => {}).extended(),
      ).toHaveProperty('property')
    })
  })

  describe('#remap()', () => {
    it('renames key and alters value', () => {
      expect(
        new ConfigMapping()
          .remap('property', () => {
            return { otherProperty: 'otherValue' }
          })
          .apply({ property: 'value' }),
      ).toEqual({ otherProperty: 'otherValue' })
    })

    it('matches multiple keys and keeps value', () => {
      expect(
        new ConfigMapping()
          .remap(/key([AB])/, (value: any, key: any) => {
            let result = {}
            result[`${key}_altered`] = value
            return result
          })
          .apply({
            keyA: 'valueA',
            keyB: 'valueB',
            keyC: 'valueC',
          }),
      ).toEqual({
        keyA_altered: 'valueA',
        keyB_altered: 'valueB',
      })
    })
  })

  describe('#rename()', () => {
    it('renames key and copies value as-is', () => {
      expect(
        new ConfigMapping()
          .rename('property', 'otherProperty')
          .apply({ property: 'value' }),
      ).toEqual({ otherProperty: 'value' })
    })
  })

  describe('#asIs()', () => {
    it('copies key and value as-is', () => {
      expect(
        new ConfigMapping().asIs('property').apply({ property: 'value' }),
      ).toEqual({ property: 'value' })
    })
  })

  describe('#default()', () => {
    it('sets default value', () => {
      expect(
        new ConfigMapping()
          .default('otherProperty', () => 'otherValue')
          .apply({ property: 'value' }),
      ).toEqual({ otherProperty: 'otherValue' })
    })
  })
})
