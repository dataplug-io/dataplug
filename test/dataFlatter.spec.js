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

    it('includes metadata', () => {
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
      new DataFlatter(jsonSchema, 'collection').flatten(data, true)
        .should.deep.equal({
          collection: {
            data: [{
              simpleProperty: 0
            }],
            metadata: {
              fields: {
                simpleProperty: {
                  identity: true,
                  type: 'integer'
                }
              },
              origin: '#',
              relations: {
                'collection/complexObject': 'one-to-one'
              }
            }
          },
          'collection/complexObject': {
            data: [{
              '$collection~simpleProperty': 0,
              otherSimpleProperty: 0
            }],
            metadata: {
              fields: {
                '$collection~simpleProperty': {
                  identity: true,
                  reference: {
                    depth: 1,
                    entity: 'collection',
                    field: 'simpleProperty'
                  },
                  relation: {
                    entity: 'collection',
                    field: 'simpleProperty'
                  },
                  type: 'integer'
                },
                otherSimpleProperty: {
                  type: 'integer'
                }
              },
              origin: '#/properties/complexObject'
            }
          }
        })
    })

    it('throws on invalid data', () => {
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
        additionalProperties: false,
        required: ['simpleProperty']
      }
      const data = {
        simpleProperty: 0,
        complexObject: {
          otherSimpleProperty: 0
        },
        extraProperty: true
      };
      (() => new DataFlatter(jsonSchema, 'collection').flatten(data))
        .should.throw(/Invalid data/)
    })
  })
})
