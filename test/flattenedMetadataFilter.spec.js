/* eslint-env node, mocha */
require('chai')
  .use(require('chai-as-promised'))
  .should()
const { PassThrough } = require('stream')
const Promise = require('bluebird')
const { FlattenedMetadataFilter } = require('../lib')

describe('FlattenedMetadataFilter', () => {
  it('tolerantly removes data', (done) => {
    const stream = new PassThrough({ objectMode: true })
    const sequence = new FlattenedMetadataFilter(true)
    let data = []
    new Promise((resolve, reject) => sequence
        .on('end', () => resolve(data))
        .on('error', reject)
        .on('data', (chunk) => { data.push(chunk) }))
      .should.eventually.be.deep.equal([{
        entity1: [{}],
        entity2: [{}]
      }])
      .notify(done)

    stream.pipe(sequence)

    stream.write({
      entity1: {
        metadata: {},
        data: [{}]
      },
      entity2: [{}]
    })
    stream.end()
  })

  it('throws intolerantly on invalid data', (done) => {
    const stream = new PassThrough({ objectMode: true })
    const sequence = new FlattenedMetadataFilter(false)
    let data = []
    new Promise((resolve, reject) => sequence
        .on('end', () => resolve(data))
        .on('error', reject)
        .on('data', (chunk) => { data.push(chunk) }))
      .should.eventually.be.rejectedWith(/Invalid object format/)
      .notify(done)

    stream.pipe(sequence)

    stream.write({
      entity1: {
        metadata: {},
        data: [{}]
      },
      entity2: [{}]
    })
    stream.end()
  })
})
