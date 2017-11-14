/* eslint-env node, mocha */
require('chai')
  .should()
const { PassThrough } = require('stream')
const logger = require('winston')
const { Replicator, Source, Target } = require('../lib')

logger.clear()

describe('Replicator', () => {
  it('replicates data', (done) => {
    const sourceStream = new PassThrough({
      objectMode: true
    })
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
      ])
      .and.notify(done)

    sourceStream.write({ property: 'valueA' })
    sourceStream.write({ property: 'valueB' })
    sourceStream.end()
  })

  it('supports processors', (done) => {
    const sourceStream = new PassThrough({
      objectMode: true
    })
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
      ])
      .and.notify(done)

    sourceStream.write({ property: 'valueA' })
    sourceStream.write({ property: 'valueB' })
    sourceStream.end()
  })

  it('handles error in source without stopping', (done) => {
    const sourceStream = new PassThrough({
      objectMode: true
    })
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
      .andDontStopOnError()
      .replicate()
      .then(() => {
        return data
      })
      .should.eventually.be.deep.equal([
        { property: 'valueA' },
        { property: 'valueB' }
      ])
      .and.notify(done)
    targetStream.once('data', () => {
      sourceStream.emit('error', 'expected')
    })

    sourceStream.write({ property: 'valueA' })
    sourceStream.write({ property: 'valueB' })
    sourceStream.end()
  })

  it('handles error in source with stopping', (done) => {
    const sourceStream = new PassThrough({
      objectMode: true
    })
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
      .andStopOnError()
      .replicate()
      .catch((error) => {
        error
          .should.be.equal('expected')
      })
    targetStream.once('data', () => {
      sourceStream.emit('error', 'expected')
    })
    targetStream.on('finish', done)

    sourceStream.write({ property: 'valueA' })
    sourceStream.write({ property: 'valueB' })
  })
})
