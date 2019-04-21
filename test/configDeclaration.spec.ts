// Copyright (C) 2017-2019 Brainbean Apps OU (https://brainbeanapps.com).
// License AGPL-3.0 or later (https://www.gnu.org/licenses/agpl).

import 'ts-jest'
import { ConfigDeclaration } from '../src'

describe('ConfigDeclaration', () => {
  describe('#constructor()', () => {
    it('has default parameters', () => {
      expect(() => new ConfigDeclaration()).not.toThrow()
    })

    it('clones instance', () => {
      const that = new ConfigDeclaration().parameter('param', {})
      expect(new ConfigDeclaration(that)).toHaveProperty('param')
    })
  })

  describe('#include()', () => {
    it('includes instance', () => {
      const that = new ConfigDeclaration().parameter('param', {})
      expect(new ConfigDeclaration().include(that)).toHaveProperty('param')
    })

    it('throws on duplicate parameter', () => {
      const that = new ConfigDeclaration().parameter('param', {})
      expect(() =>
        new ConfigDeclaration().parameter('param', {}).include(that),
      ).toThrow(/parameter already declared/)
    })

    it('overwrites duplicate parameter', () => {
      const that = new ConfigDeclaration().parameter('param', {
        description: 'that',
      })
      expect(
        new ConfigDeclaration()
          .parameter('param', { description: 'this' })
          .include(that, true),
      ).toHaveProperty('param.description', 'that')
    })
  })

  describe('#parameter()', () => {
    it('throws on duplicate parameter', () => {
      expect(() =>
        new ConfigDeclaration().parameter('param', {}).parameter('param', {}),
      ).toThrow(/parameter already declared/)
    })

    it('overwrites duplicate parameter', () => {
      expect(
        new ConfigDeclaration()
          .parameter('param', { description: 'this' })
          .parameter('param', { description: 'that' }, true),
      ).toHaveProperty('param.description', 'that')
    })
  })

  describe('#conflicts()', () => {
    it('throws on invalid number of arguments', () => {
      expect(() =>
        new ConfigDeclaration().parameter('a', {}).conflicts('a'),
      ).toThrow(/At least two conflicting names must be specified/)
    })

    it('throws on undefined parameters', () => {
      expect(() =>
        new ConfigDeclaration().parameter('a', {}).conflicts('a', 'b'),
      ).toThrow(/parameter is not declared/)
    })

    it('sets mutual conflict', () => {
      expect(
        new ConfigDeclaration()
          .parameter('a', {})
          .parameter('b', {})
          .conflicts('a', 'b'),
      ).toEqual({
        a: { conflicts: ['b'] },
        b: { conflicts: ['a'] },
      })
    })

    it('sets conflict for 3 params', () => {
      expect(
        new ConfigDeclaration()
          .parameter('a', {})
          .parameter('b', {})
          .parameter('c', {})
          .conflicts('a', 'b', 'c'),
      ).toEqual({
        a: { conflicts: ['b', 'c'] },
        b: { conflicts: ['a', 'c'] },
        c: { conflicts: ['a', 'b'] },
      })
    })
  })

  describe('#extended()', () => {
    it('has default parameters', () => {
      expect(() => () => new ConfigDeclaration().extended()).not.toThrow(
        /parameter is not declared/,
      )
    })

    it('clones other instance', () => {
      expect(
        new ConfigDeclaration().parameter('param', {}).extended(),
      ).toHaveProperty('param')
    })
  })

  describe('#toJSONSchema()', () => {
    it('converts to JSON Schema', () => {
      expect(
        new ConfigDeclaration()
          .parameter('boolean', {
            description: 'description of boolean',
            type: 'boolean',
            default: false,
            required: true,
          })
          .parameter('enum', {
            description: 'description of enum',
            enum: ['a', 'b'],
          })
          .parameter('array', {
            description: 'description of array',
            item: 'integer',
          })
          .parameter('string', {
            description: 'description of string',
            type: 'string',
            format: 'datetime',
          })
          .parameter('string-array', {
            description: 'description of string-array',
            item: 'string',
            format: 'datetime',
          })
          .conflicts('array', 'string', 'enum')
          .toJSONSchema(),
      ).toEqual({
        type: 'object',
        additionalProperties: false,
        properties: {
          boolean: {
            description: 'description of boolean',
            type: 'boolean',
            default: false,
          },
          enum: {
            description: 'description of enum',
            enum: ['a', 'b'],
          },
          array: {
            description: 'description of array',
            items: {
              type: 'integer',
            },
          },
          string: {
            description: 'description of string',
            type: 'string',
            format: 'datetime',
          },
          'string-array': {
            description: 'description of string-array',
            items: {
              type: 'string',
              format: 'datetime',
            },
          },
        },
        required: ['boolean'],
      })
    })
  })
})
