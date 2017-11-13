/* eslint-env node, mocha */
require('chai')
  .should()
const { ConfigDeclaration } = require('../lib')

describe('ConfigDeclaration', () => {
  describe('#constructor()', () => {
    it('has default parameters', () => {
      (() => new ConfigDeclaration())
        .should.not.throw()
    })

    it('clones other instance', () => {
      const other = new ConfigDeclaration()
        .parameter('param', {})
      new ConfigDeclaration(other)
        .should.have.property('param')
    })
  })

  describe('#extended()', () => {
    it('has default parameters', () => {
      (() => new ConfigDeclaration().extended())
        .should.not.throw()
    })

    it('clones other instance', () => {
      new ConfigDeclaration()
        .parameter('param', {})
        .extended()
        .should.have.property('param')
    })
  })
})
