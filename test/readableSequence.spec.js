/* eslint-env node, mocha */
require('chai')
  .use(require('chai-as-promised'))
  .should()
const { PassThrough } = require('stream')
const Promise = require('bluebird')
const logger = require('winston')
const { ReadableSequence } = require('../lib')

logger.clear()

describe('ReadableSequence', () => {
  it('supports array of streams', (done) => {
    const stream1 = new PassThrough()
    const stream2 = new PassThrough()
    const sequence = new ReadableSequence([stream1, stream2])
    let data = ''
    new Promise((resolve, reject) => sequence
        .on('end', () => resolve(data))
        .on('error', reject)
        .on('data', (chunk) => { data += chunk }))
      .should.eventually.be.equal('12')
      .notify(done)

    stream1.write('1')
    stream1.end()

    stream2.write('2')
    stream2.end()
  })

  it('supports functor', (done) => {
    const stream1 = new PassThrough()
    const stream2 = new PassThrough()
    const sequence = new ReadableSequence((oldStream, oldContext) => {
      if (oldStream === null) {
        return stream1
      }
      if (oldStream === stream1) {
        return stream2
      }
      return null
    })

    let data = ''
    new Promise((resolve, reject) => sequence
        .on('end', () => resolve(data))
        .on('error', reject)
        .on('data', (chunk) => { data += chunk }))
      .should.eventually.be.equal('12')
      .notify(done)

    stream1.write('1')
    stream1.end()

    stream2.write('2')
    stream2.end()
  })

  it('supports async functor', (done) => {
    const stream1 = new PassThrough()
    const stream2 = new PassThrough()
    const sequence = new ReadableSequence(async (oldStream, oldContext) => {
      if (oldStream === null) {
        return stream1
      }
      if (oldStream === stream1) {
        return stream2
      }
      return null
    })

    let data = ''
    new Promise((resolve, reject) => sequence
        .on('end', () => resolve(data))
        .on('error', reject)
        .on('data', (chunk) => { data += chunk }))
      .should.eventually.be.equal('12')
      .notify(done)

    stream1.write('1')
    stream1.end()

    stream2.write('2')
    stream2.end()
  })

  it('handles errors', (done) => {
    const sequence = new ReadableSequence(async (oldStream, oldContext) => {
      throw new Error('expected')
    })

    let data = ''
    new Promise((resolve, reject) => sequence
        .on('end', () => resolve(data))
        .on('error', reject)
        .on('data', (chunk) => { data += chunk }))
      .should.eventually.be.rejectedWith(/expected/)
      .notify(done)
  })

  it('supports destroy', (done) => {
    const stream1 = new PassThrough()
    const stream2 = new PassThrough()
    const sequence = new ReadableSequence([stream1, stream2])
    let data = ''
    new Promise((resolve, reject) => sequence
        .on('end', () => resolve(data))
        .on('error', reject)
        .on('data', (chunk) => { data += chunk }))
      .should.eventually.be.rejectedWith(/expected/)
      .notify(done)

    stream1.write('1')
    sequence.destroy('expected')
    stream1.write('2')
  })

  it('handles underlying destroy', (done) => {
    const stream1 = new PassThrough()
    const stream2 = new PassThrough()
    const sequence = new ReadableSequence([stream1, stream2])
    let data = ''
    new Promise((resolve, reject) => sequence
        .on('end', () => resolve(data))
        .on('error', reject)
        .on('data', (chunk) => { data += chunk }))
      .should.eventually.be.equal('12')
      .notify(done)

    sequence.once('data', () => {
      stream1.destroy()
    })
    stream1.write('1')
    stream2.write('2')
    stream2.end()
  })

  it('supports underlying error', (done) => {
    const stream = new PassThrough()
    const sequence = new ReadableSequence([stream], false, true)
    new Promise((resolve, reject) => sequence
        .on('end', () => {
          reject(new Error())
        })
        .on('error', (error) => {
          resolve(error)
        }))
      .should.eventually.be.equal('expected')
      .notify(done)

    sequence.once('data', (chunk) => {
      stream.emit('error', 'expected')
    })
    stream.write('1')
  })

  it('supports underlying error (tolerant)', (done) => {
    const stream1 = new PassThrough()
    const stream2 = new PassThrough()
    const sequence = new ReadableSequence([stream1, stream2], false, false)
    let data = ''
    new Promise((resolve, reject) => sequence
        .on('end', () => resolve(data))
        .on('error', (error) => {
          error.should.be.equal('expected')
        })
        .on('data', (chunk) => { data += chunk }))
      .should.eventually.be.equal('12')
      .notify(done)

    sequence.once('data', () => {
      stream1.emit('error', 'expected')
      stream1.end()
    })
    stream1.write('1')
    stream2.write('2')
    stream2.end()
  })

  it('supports underlying error (intolerant)', (done) => {
    const stream1 = new PassThrough()
    const stream2 = new PassThrough()
    const sequence = new ReadableSequence([stream1, stream2], false, true)
    let data = ''
    new Promise((resolve, reject) => sequence
        .on('end', () => resolve(data))
        .on('error', reject)
        .on('data', (chunk) => { data += chunk }))
      .should.eventually.be.rejectedWith(/expected/)
      .notify(done)

    sequence.once('data', () => {
      stream1.emit('error', 'expected')
      stream1.end()
    })
    stream1.write('1')
    stream2.write('2')
    stream2.end()
  })
})
