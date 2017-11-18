/* eslint-env node, mocha */
require('chai')
  .use(require('chai-as-promised'))
  .should()
const { PassThrough } = require('stream')
const Promise = require('bluebird')
const logger = require('winston')
const { Mapper } = require('../lib')

logger.clear()

describe('Mapper', () => {
  it('maps input to streams', (done) => {
    const input = PassThrough()
    const mapper = new Mapper((data) => {
      data = data.toString()
      const stream = new PassThrough()
      setTimeout(() => {
        stream.write(data + '1')
        stream.write(data + '2')
        stream.end()
      }, 25)
      return stream
    })
    new Promise((resolve, reject) => {
      let data = ''
      mapper
        .on('end', () => resolve(data))
        .on('error', (error) => { reject(new Error(error + ':' + data)) })
        .on('data', (chunk) => { data += chunk })
    })
      .should.eventually.be.equal('a1a2b1b2')
      .notify(done)

    input
      .pipe(mapper)
    input.write('a')
    input.write('b')
    input.end()
  })

  it('supports async', (done) => {
    const input = PassThrough()
    const mapper = new Mapper(async (data) => {
      data = data.toString()
      const stream = new PassThrough()
      setTimeout(() => {
        stream.write(data + '1')
        stream.write(data + '2')
        stream.end()
      }, 25)
      return stream
    })
    new Promise((resolve, reject) => {
      let data = ''
      mapper
        .on('end', () => resolve(data))
        .on('error', (error) => { reject(new Error(error + ':' + data)) })
        .on('data', (chunk) => { data += chunk })
    })
      .should.eventually.be.equal('a1a2b1b2')
      .notify(done)

    input
      .pipe(mapper)
    input.write('a')
    input.write('b')
    input.end()
  })

  it('handles exceptions', (done) => {
    const input = PassThrough()
    const mapper = new Mapper((data) => {
      data = data.toString()
      if (data === '!') {
        throw new Error('expected')
      }
      const stream = new PassThrough()
      setTimeout(() => {
        stream.write(data + '1')
        stream.write(data + '2')
        stream.end()
      }, 25)
      return stream
    })
    new Promise((resolve, reject) => {
      let data = ''
      mapper
        .on('end', () => resolve(data))
        .on('error', (error) => { reject(new Error(error + ':' + data)) })
        .on('data', (chunk) => { data += chunk })
    })
      .should.eventually.be.equal('a1a2b1b2')
      .notify(done)

    input
      .pipe(mapper)
    input.write('a')
    input.write('!')
    input.write('b')
    input.end()
  })

  it('handles async exceptions', (done) => {
    const input = PassThrough()
    const mapper = new Mapper(async (data) => {
      data = data.toString()
      if (data === '!') {
        throw new Error('expected')
      }
      const stream = new PassThrough()
      setTimeout(() => {
        stream.write(data + '1')
        stream.write(data + '2')
        stream.end()
      }, 25)
      return stream
    })
    new Promise((resolve, reject) => {
      let data = ''
      mapper
        .on('end', () => resolve(data))
        .on('error', (error) => { reject(new Error(error + ':' + data)) })
        .on('data', (chunk) => { data += chunk })
    })
      .should.eventually.be.equal('a1a2b1b2')
      .notify(done)

    input
      .pipe(mapper)
    input.write('a')
    input.write('!')
    input.write('b')
    input.end()
  })

  it('handles errors', (done) => {
    const input = PassThrough()
    const mapper = new Mapper((data) => {
      data = data.toString()
      const stream = new PassThrough()
      setTimeout(() => {
        stream.write(data + '1')
        stream.emit('error', new Error('expected'))
        stream.write(data + '2')
      }, 25)
      return stream
    })
    new Promise((resolve, reject) => {
      let data = ''
      mapper
        .on('end', () => resolve(data))
        .on('error', (error) => { reject(new Error(error + ':' + data)) })
        .on('data', (chunk) => { data += chunk })
    })
      .should.eventually.be.equal('a1b1')
      .notify(done)

    input
      .pipe(mapper)
    input.write('a')
    input.write('b')
    input.end()
  })

  it('aborts on errors', (done) => {
    const input = PassThrough()
    const mapper = new Mapper((data) => {
      data = data.toString()
      const stream = new PassThrough()
      setTimeout(() => {
        stream.write(data + '1')
        stream.emit('error', new Error('expected'))
        stream.write(data + '2')
      }, 25)
      return stream
    }, { abortOnError: true })
    new Promise((resolve, reject) => {
      let data = ''
      mapper
        .on('end', () => resolve(data))
        .on('error', (error) => { reject(new Error(error + ':' + data)) })
        .on('data', (chunk) => { data += chunk })
    })
      .should.eventually.be.rejectedWith('expected:a1')
      .notify(done)

    input
      .pipe(mapper)
    input.write('a')
    input.write('b')
    input.end()
  })

  it('handles destroy', (done) => {
    const input = PassThrough()
    const mapper = new Mapper((data) => {
      data = data.toString()
      const stream = new PassThrough()
      setTimeout(() => {
        stream.write(data + '1')
        stream.emit('error', new Error('expected'))
        stream.write(data + '2')
      }, 25)
      return stream
    }, { abortOnError: true })
    new Promise((resolve, reject) => {
      let data = ''
      mapper
        .on('end', () => resolve(data))
        .on('error', (error) => { reject(new Error(error + ':' + data)) })
        .on('data', (chunk) => {
          data += chunk
          setImmediate(() => mapper.destroy())
        })
    })
      .should.eventually.be.rejectedWith('expected:a1')
      .notify(done)

    input
      .pipe(mapper)
    input.write('a')
    input.write('b')
    input.end()
  })
})
