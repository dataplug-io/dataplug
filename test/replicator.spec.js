/* eslint-env node, mocha */
require('chai')
  .should()
const { PassThrough } = require('stream')
const { Replicator, Source, Target } = require('../lib')

describe('Replicator', () => {
  it('replicates data', (done) => {
    const sourceStream = new PassThrough({
      objectMode: true
    })
    sourceStream.write({ property: 'valueA' })
    sourceStream.write({ property: 'valueB' })
    const source = new Source({}, () => sourceStream)

    const targetStream = new PassThrough({
      objectMode: true
    })
    const target = new Target({}, () => targetStream)

    let data = []
    targetStream
      .on('data', (chunk) => data.push(chunk))
    new Replicator(source, {})
      .toTarget(target, {})
      .replicate()
      .then(() => {
        return data
      })
      .should.eventually.be.deep.equal([
        { property: 'valueA' },
        { property: 'valueB' }
      ]).and.notify(done)
    sourceStream.end()
  })

  it('supports procesors', (done) => {
    const sourceStream = new PassThrough({
      objectMode: true
    })
    sourceStream.write({ property: 'valueA' })
    sourceStream.write({ property: 'valueB' })
    const source = new Source({}, () => sourceStream)

    const targetStream = new PassThrough({
      objectMode: true
    })
    const target = new Target({}, () => targetStream)

    let data = []
    new Replicator(source, {})
      .toTarget(target, {})
      .withProcessor((chunk) => data.push(chunk))
      .replicate()
      .then(() => {
        return data
      })
      .should.eventually.be.deep.equal([
        { property: 'valueA' },
        { property: 'valueB' }
      ]).and.notify(done)
    sourceStream.end()
  })
})
