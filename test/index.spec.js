/* eslint-env node, mocha */
require('chai')
  .should()
const dataplug = require('../lib')

describe('dataplug', () => {
  it('has "config" field', () => {
    dataplug
      .should.have.property('config')
      .that.is.an('object')
  })

  it('has "ConfigDeclaration" class', () => {
    dataplug
      .should.have.property('ConfigDeclaration')
      .that.is.an('function')
  })

  it('has "ConfigMapping" class', () => {
    dataplug
      .should.have.property('ConfigMapping')
      .that.is.an('function')
  })

  it('has "Filter" class', () => {
    dataplug
      .should.have.property('Filter')
      .that.is.an('function')
  })

  it('has "JsonUtils" class', () => {
    dataplug
      .should.have.property('JsonUtils')
      .that.is.an('function')
  })

  it('has "MappedStream" class', () => {
    dataplug
      .should.have.property('MappedStream')
      .that.is.an('function')
  })

  it('has "replicate" function', () => {
    dataplug
      .should.have.property('replicate')
      .that.is.an('function')
  })

  it('has "Replicator" class', () => {
    dataplug
      .should.have.property('Replicator')
      .that.is.an('function')
  })

  it('has "ReplicationChainBuilder" class', () => {
    dataplug
      .should.have.property('ReplicationChainBuilder')
      .that.is.an('function')
  })

  it('has "ReadableSequence" class', () => {
    dataplug
      .should.have.property('ReadableSequence')
      .that.is.an('function')
  })

  it('has "Scanner" class', () => {
    dataplug
      .should.have.property('Scanner')
      .that.is.an('function')
  })

  it('has "source" function', () => {
    dataplug
      .should.have.property('source')
      .that.is.an('function')
  })

  it('has "Source" class', () => {
    dataplug
      .should.have.property('Source')
      .that.is.an('function')
  })

  it('has "target" function', () => {
    dataplug
      .should.have.property('target')
      .that.is.an('function')
  })

  it('has "Target" class', () => {
    dataplug
      .should.have.property('Target')
      .that.is.an('function')
  })

  describe('#source()', () => {
    it('creates an instance of Source', () => {
      dataplug.source({}, null)
        .should.be.an.instanceof(dataplug.Source)
    })
  })

  describe('#target()', () => {
    it('creates an instance of Target', () => {
      dataplug.target({}, null)
        .should.be.an.instanceof(dataplug.Target)
    })
  })
})
