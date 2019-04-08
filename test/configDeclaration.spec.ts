// Copyright (C) 2017-2019 Brainbean Apps OU (https://brainbeanapps.com).
// License AGPL-3.0 or later (https://www.gnu.org/licenses/agpl).

import 'mocha'
import { should as initializeChaiShould } from 'chai'
import ConfigDeclaration from '../src/configDeclaration'

initializeChaiShould()

describe('ConfigDeclaration', () => {
  describe('#constructor()', () => {
    it('has default parameters', () => {
      ;(() => new ConfigDeclaration()).should.not.throw()
    })

    it('clones instance', () => {
      const that = new ConfigDeclaration().parameter('param', {})
      new ConfigDeclaration(that).should.have.property('param')
    })
  })

  describe('#include()', () => {
    it('includes instance', () => {
      const that = new ConfigDeclaration().parameter('param', {})
      new ConfigDeclaration().include(that).should.have.property('param')
    })

    it('throws on duplicate parameter', () => {
      const that = new ConfigDeclaration().parameter('param', {})
      ;(() =>
        new ConfigDeclaration()
          .parameter('param', {})
          .include(that)).should.throw(/parameter already declared/)
    })

    it('overwrites duplicate parameter', () => {
      const that = new ConfigDeclaration().parameter('param', {
        description: 'that',
      })
      new ConfigDeclaration()
        .parameter('param', { description: 'this' })
        .include(that, true)
        .should.have.deep.property('param', { description: 'that' })
    })
  })

  describe('#parameter()', () => {
    it('throws on duplicate parameter', () => {
      ;(() =>
        new ConfigDeclaration()
          .parameter('param', {})
          .parameter('param', {})).should.throw(/parameter already declared/)
    })

    it('overwrites duplicate parameter', () => {
      new ConfigDeclaration()
        .parameter('param', { description: 'this' })
        .parameter('param', { description: 'that' }, true)
        .should.have.deep.property('param', { description: 'that' })
    })
  })

  describe('#conflicts()', () => {
    it('throws on invalid number of arguments', () => {
      ;(() =>
        new ConfigDeclaration().parameter('a', {}).conflicts('a')).should.throw(
        /At least two conflicting names must be specified/,
      )
    })

    it('throws on undefined parameters', () => {
      ;(() =>
        new ConfigDeclaration()
          .parameter('a', {})
          .conflicts('a', 'b')).should.throw(/parameter is not declared/)
    })

    it('sets mutual conflict', () => {
      new ConfigDeclaration()
        .parameter('a', {})
        .parameter('b', {})
        .conflicts('a', 'b')
        .should.be.deep.equal({
          a: { conflicts: ['b'] },
          b: { conflicts: ['a'] },
        })
    })

    it('sets conflict for 3 params', () => {
      new ConfigDeclaration()
        .parameter('a', {})
        .parameter('b', {})
        .parameter('c', {})
        .conflicts('a', 'b', 'c')
        .should.be.deep.equal({
          a: { conflicts: ['b', 'c'] },
          b: { conflicts: ['a', 'c'] },
          c: { conflicts: ['a', 'b'] },
        })
    })
  })

  describe('#extended()', () => {
    it('has default parameters', () => {
      ;(() => new ConfigDeclaration().extended()).should.not.throw()
    })

    it('clones other instance', () => {
      new ConfigDeclaration()
        .parameter('param', {})
        .extended()
        .should.have.property('param')
    })
  })

  describe('#toJSONSchema()', () => {
    it('converts to JSON Schema', () => {
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
        .toJSONSchema()
        .should.be.deep.equal({
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
