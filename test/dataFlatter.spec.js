/* eslint-env node, mocha */
require('chai')
  .should()
const { DataFlatter } = require('../lib')

describe('DataFlatter', () => {
  describe('#constructor()', () => {
    it('throws for schema with tuple-aray', () => {
      const jsonSchema = {
        type: 'object',
        properties: {
          simpleProperty: {
            type: 'integer'
          },
          array: {
            type: 'array',
            items: [{
              type: 'integer'
            }, {
              type: 'string'
            }]
          }
        },
        required: ['simpleProperty']
      };
      (() => new DataFlatter(jsonSchema, 'collection'))
        .should.throw(/tuple array/)
    })
  })

  describe('#flatten()', () => {
    it('flattens basic data', () => {
      const jsonSchema = {
        type: 'object',
        properties: {
          booleanProperty: {
            type: 'boolean'
          },
          integerProperty: {
            type: 'integer'
          },
          stringProperty: {
            type: 'string'
          },
          enumProperty: {
            enum: ['option1', 'option2']
          },
          objectProperty: {
            type: 'object'
          }
        }
      }
      const data = {
        booleanProperty: true,
        integerProperty: 0,
        stringProperty: 'value',
        enumProperty: 'option1',
        objectProperty: {}
      }
      new DataFlatter(jsonSchema, 'collection').flatten(data)
        .should.deep.equal({
          collection: [data]
        })
    })

    it('flattens complex data', () => {
      const jsonSchema = {
        type: 'object',
        properties: {
          simpleProperty: {
            type: 'integer'
          },
          complexObject: {
            type: 'object',
            properties: {
              otherSimpleProperty: {
                type: 'integer'
              }
            }
          }
        },
        required: ['simpleProperty']
      }
      const data = {
        simpleProperty: 0,
        complexObject: {
          otherSimpleProperty: 0
        }
      }
      new DataFlatter(jsonSchema, 'collection').flatten(data)
        .should.deep.equal({
          collection: [{
            simpleProperty: 0
          }],
          'collection/complexObject': [{
            '$collection~simpleProperty': 0,
            otherSimpleProperty: 0
          }]
        })
    })
  })
})
