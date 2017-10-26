/* eslint-env node, mocha */
require('chai')
  .should()
const { ConfigMapping } = require('../lib')

describe('ConfigMapping', () => {
  describe('#constructor()', () => {
    it('has default parameters', () => {
      (() => new ConfigMapping())
        .should.not.throw()
    })

    it('clones other instance', () => {
      const mapper = (value) => {}
      const other = new ConfigMapping()
        .remap('property', mapper)
      new ConfigMapping(other)
        .should.have.property('property').that.equal(mapper)
    })
  })

  describe('#extended()', () => {
  })

  describe('#remap()', () => {
  })

  describe('#rename()', () => {
  })

  describe('#asIs()', () => {
  })

  describe('#apply()', () => {
  })

  describe('#remap()', () => {
  })

  describe('#remap()', () => {
  })
})
