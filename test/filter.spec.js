/* eslint-env node, mocha */
require('chai')
  .use(require('chai-as-promised'))
  .should()
const { PassThrough } = require('stream')
const Promise = require('bluebird')
const { Filter } = require('../lib')

describe('Filter', () => {
  it('passes through objects', (done) => {
    const object = {
      property: 'value'
    }

    const stream = new PassThrough({ objectMode: true })
    const filter = new Filter(() => true)
    new Promise((resolve, reject) => filter
        .on('end', resolve)
        .on('error', reject)
        .on('data', resolve))
      .should.eventually.be.deep.equal(object)
      .notify(done)

    stream
      .pipe(filter)
    stream.write(object)
    stream.end()
  })

  it('handles immediate exceptions', (done) => {
    const object = {
      property: 'value'
    }

    const stream = new PassThrough({ objectMode: true })
    const filter = new Filter(() => {
      throw new Error('Unexpected error')
    })
    let data = []
    new Promise((resolve, reject) => filter
        .on('end', () => resolve(data))
        .on('error', reject)
        .on('data', (chunk) => data.push(chunk)))
      .should.eventually.be.deep.equal([])
      .notify(done)

    stream
      .pipe(filter)
    stream.write(object)
    stream.end()
  })

  it('handles future exceptions', (done) => {
    const object = {
      property: 'value'
    }

    const stream = new PassThrough({ objectMode: true })
    const filter = new Filter(async () => {
      throw new Error('Unexpected error')
    })
    let data = []
    new Promise((resolve, reject) => filter
        .on('end', () => resolve(data))
        .on('error', reject)
        .on('data', (chunk) => data.push(chunk)))
      .should.eventually.be.deep.equal([])
      .notify(done)

    stream
      .pipe(filter)
    stream.write(object)
    stream.end()
  })

  it('handles async filter callback correctly', (done) => {
    const object = {
      property: 'value'
    }

    const stream = new PassThrough({ objectMode: true })
    const filter = new Filter(async () => new Promise((resolve) => {
      setTimeout(() => {
        resolve(true)
      }, 25)
    }))
    new Promise((resolve, reject) => filter
        .on('end', resolve)
        .on('error', reject)
        .on('data', resolve))
      .should.eventually.be.deep.equal(object)
      .notify(done)

    stream
      .pipe(filter)
    stream.write(object)
    stream.end()
  })
})
