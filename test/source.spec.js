/* eslint-env node, mocha */
require('chai')
  .use(require('chai-as-promised'))
  .should()
const { PassThrough } = require('stream')
const { Source } = require('../lib')

describe('Source', () => {
  it('supports instantly-available stream', (done) => {
    const stream = new PassThrough()
    new Source({}, () => stream).createOutput({})
      .should.eventually.be.deep.equal(stream)
      .notify(done)
  })

  it('supports promised stream', (done) => {
    const stream = new PassThrough()
    new Source({}, async () => stream).createOutput({})
      .should.eventually.be.deep.equal(stream)
      .notify(done)
  })

  it('supports instantly-available streams', (done) => {
    const stream = new PassThrough()
    new Source({}, () => [stream]).createOutput({})
      .should.eventually.be.deep.equal([stream])
      .notify(done)
  })

  it('supports promised streams', (done) => {
    const stream = new PassThrough()
    new Source({}, async () => [stream]).createOutput({})
      .should.eventually.be.deep.equal([stream])
      .notify(done)
  })
})
