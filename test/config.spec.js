/* eslint-env node, mocha */
require('chai')
  .should()
const dataplug = require('../lib')

describe('dataplug.config', () => {
  it('has "declare" function', () => {
    dataplug.config
      .should.have.property('declare')
      .that.is.an('function')
  })

  it('has "map" function', () => {
    dataplug.config
      .should.have.property('map')
      .that.is.an('function')
  })

  describe('#declare()', () => {
    it('creates an instance of ConfigDeclaration', () => {
      dataplug.config.declare()
        .should.be.an.instanceof(dataplug.ConfigDeclaration)
    })
  })

  describe('#map()', () => {
    it('creates an instance of ConfigMapping', () => {
      dataplug.config.map()
        .should.be.an.instanceof(dataplug.ConfigMapping)
    })
  })
})
