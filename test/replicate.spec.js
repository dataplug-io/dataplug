/* eslint-env node, mocha */
require('chai')
  .use(require('chai-as-promised'))
  .should()
const { PassThrough } = require('stream')
const logger = require('winston')
const { replicate, Source, Target } = require('../lib')

logger.clear()

describe('replicate()', () => {
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
    replicate([ source.createOutput({}), target.createInput({}) ])
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

  it('replicates data (complex source and target)', (done) => {
    const sourceStream = new PassThrough({
      objectMode: true
    })
    const source = new Source({}, () => [sourceStream])

    const targetStream = new PassThrough({
      objectMode: true
    })
    const target = new Target({}, () => [targetStream])

    let data = []
    targetStream
      .on('data', (chunk) => data.push(chunk))
    replicate([ source.createOutput({}), target.createInput({}) ])
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

  it('replicates data (async source and target)', (done) => {
    const sourceStream = new PassThrough({
      objectMode: true
    })
    const source = new Source({}, async () => sourceStream)

    const targetStream = new PassThrough({
      objectMode: true
    })
    const target = new Target({}, async () => targetStream)

    let data = []
    targetStream
      .on('data', (chunk) => data.push(chunk))
    replicate([ source.createOutput({}), target.createInput({}) ])
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

  it('replicates data (complex async source and target)', (done) => {
    const sourceStream = new PassThrough({
      objectMode: true
    })
    const source = new Source({}, async () => [sourceStream])

    const targetStream = new PassThrough({
      objectMode: true
    })
    const target = new Target({}, async () => [targetStream])

    let data = []
    targetStream
      .on('data', (chunk) => data.push(chunk))
    replicate([ source.createOutput({}), target.createInput({}) ])
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

  it('replicates data with transform', (done) => {
    const sourceStream = new PassThrough({
      objectMode: true
    })
    const source = new Source({}, () => sourceStream)

    const targetStream = new PassThrough({
      objectMode: true
    })
    const target = new Target({}, () => targetStream)

    const transform = new PassThrough({
      objectMode: true
    })

    let data = []
    targetStream
      .on('data', (chunk) => data.push(chunk))
    replicate([ source.createOutput({}), transform, target.createInput({}) ])
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
    replicate([ source.createOutput({}), target.createInput({}) ], false)
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
    replicate([ source.createOutput({}), target.createInput({}) ], true)
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
