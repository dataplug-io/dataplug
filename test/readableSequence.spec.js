/* eslint-env node, mocha */
require('chai')
  .use(require('chai-as-promised'))
  .should()
const { PassThrough } = require('stream')
const Promise = require('bluebird')
const { ReadableSequence } = require('../lib')

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
})
