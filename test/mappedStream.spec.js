/* eslint-env node, mocha */
require('chai')
  .use(require('chai-as-promised'))
  .should()
const { PassThrough } = require('stream')
const Promise = require('bluebird')
const logger = require('winston')
const { MappedStream } = require('../lib')

logger.clear()

describe('MappedStream', () => {
  it('passes through objects', (done) => {
    const object = {
      property: 'value'
    }

    const stream = new PassThrough({ objectMode: true })
    const mappedStream = new MappedStream((stream, data) => {
      stream.push(data)
    })
    new Promise((resolve, reject) => mappedStream
        .on('end', resolve)
        .on('error', reject)
        .on('data', resolve))
      .should.eventually.be.deep.equal(object)
      .notify(done)

    stream
      .pipe(mappedStream)
    stream.write(object)
    stream.end()
  })

  it('emits objects after input end', (done) => {
    const object = {
      property: 'value'
    }

    const stream = new PassThrough({ objectMode: true })
    const mappedStream = new MappedStream((stream, data) => {
      if (data) {
        return
      }

      stream.push(object)
    })
    new Promise((resolve, reject) => mappedStream
        .on('end', resolve)
        .on('error', reject)
        .on('data', resolve))
      .should.eventually.be.deep.equal(object)
      .notify(done)

    stream
      .pipe(mappedStream)
    stream.end()
  })

  it('handles async mappers correctly', (done) => {
    const object = {
      property: 'value'
    }

    const stream = new PassThrough({ objectMode: true })
    const mappedStream = new MappedStream(async (stream, data) => new Promise((resolve) => {
      setTimeout(() => {
        stream.push(data)
        resolve()
      }, 25)
    }))
    new Promise((resolve, reject) => mappedStream
        .on('end', resolve)
        .on('error', reject)
        .on('data', resolve))
      .should.eventually.be.deep.equal(object)
      .notify(done)

    stream
      .pipe(mappedStream)
    stream.write(object)
    stream.end()
  })

  it('handles exceptions', (done) => {
    const object = {
      property: 'value'
    }

    const stream = new PassThrough({ objectMode: true })
    const mappedStream = new MappedStream(() => {
      throw new Error('expected')
    })
    new Promise((resolve, reject) => mappedStream
        .on('end', resolve)
        .on('error', reject)
        .on('data', resolve))
      .should.eventually.be.rejectedWith(/expected/)
      .notify(done)

    stream
      .pipe(mappedStream)
    stream.write(object)
    stream.end()
  })

  it('handles async exceptions', (done) => {
    const object = {
      property: 'value'
    }

    const stream = new PassThrough({ objectMode: true })
    const mappedStream = new MappedStream(async () => {
      throw new Error('expected')
    })
    new Promise((resolve, reject) => mappedStream
        .on('end', resolve)
        .on('error', reject)
        .on('data', resolve))
      .should.eventually.be.rejectedWith(/expected/)
      .notify(done)

    stream
      .pipe(mappedStream)
    stream.write(object)
    stream.end()
  })
})
