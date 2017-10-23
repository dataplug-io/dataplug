/* eslint-env node, mocha */
require('chai')
  .should()
const dataplug = require('../lib')

describe('dataplug', () => {
  it('should have a "config" field', () => {
    dataplug
      .should.have.property('config')
      .that.is.an('object')
  })

  it('should have "Filter" class', () => {
    dataplug
      .should.have.property('Filter')
      .that.is.an('function')
  })

  it('should have "Flatter" class', () => {
    dataplug
      .should.have.property('Flatter')
      .that.is.an('function')
  })

  it('should have "Scanner" class', () => {
    dataplug
      .should.have.property('Scanner')
      .that.is.an('function')
  })

  it('should have "source" function', () => {
    dataplug
      .should.have.property('source')
      .that.is.an('function')
  })

  it('should have "Source" class', () => {
    dataplug
      .should.have.property('Source')
      .that.is.an('function')
  })

  it('should have "target" function', () => {
    dataplug
      .should.have.property('target')
      .that.is.an('function')
  })

  it('should have "Target" class', () => {
    dataplug
      .should.have.property('Target')
      .that.is.an('function')
  })

  describe('#source()', () => {
    it('should create an instance of Source', () => {
      dataplug.source(null, null)
        .should.be.an.instanceof(dataplug.Source)
    })
  })

  describe('#target()', () => {
    it('should create an instance of Target', () => {
      dataplug.target(null, null)
        .should.be.an.instanceof(dataplug.Target)
    })
  })
})
