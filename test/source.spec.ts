import 'mocha'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { PassThrough } from 'stream'
import Source from '../src/source'

chai.use(chaiAsPromised)
chai.should()

describe('Source', () => {
  it('supports instantly-available stream', done => {
    const stream = new PassThrough()
    new Source({}, () => stream)
      .createOutput({})
      .should.eventually.be.deep.equal(stream)
      .notify(done)
  })

  it('supports promised stream', done => {
    const stream = new PassThrough()
    new Source({}, async () => stream)
      .createOutput({})
      .should.eventually.be.deep.equal(stream)
      .notify(done)
  })

  it('supports instantly-available streams', done => {
    const stream = new PassThrough()
    new Source({}, () => [stream])
      .createOutput({})
      .should.eventually.be.deep.equal([stream])
      .notify(done)
  })

  it('supports promised streams', done => {
    const stream = new PassThrough()
    new Source({}, async () => [stream])
      .createOutput({})
      .should.eventually.be.deep.equal([stream])
      .notify(done)
  })
})
