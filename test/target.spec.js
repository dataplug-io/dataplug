/* eslint-env node, mocha */
require('chai')
  .use(require('chai-as-promised'))
  .should()
const { PassThrough } = require('stream')
const { Target } = require('../lib')

describe('Target', () => {
  it('supports instantly-available stream', (done) => {
    const stream = new PassThrough()
    new Target({}, () => stream).createInput({})
      .should.eventually.be.deep.equal(stream)
      .notify(done)
  })

  it('supports promised stream', (done) => {
    const stream = new PassThrough()
    new Target({}, async () => stream).createInput({})
      .should.eventually.be.deep.equal(stream)
      .notify(done)
  })

  it('supports instantly-available streams', (done) => {
    const stream = new PassThrough()
    new Target({}, () => [stream]).createInput({})
      .should.eventually.be.deep.equal([stream])
      .notify(done)
  })

  it('supports promised streams', (done) => {
    const stream = new PassThrough()
    new Target({}, async () => [stream]).createInput({})
      .should.eventually.be.deep.equal([stream])
      .notify(done)
  })
})
