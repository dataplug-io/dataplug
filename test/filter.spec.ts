import 'mocha'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { Promise as BluebirdPromise } from 'bluebird'
import Filter from '../src/filter'
import { PassThrough } from 'stream'
import * as logger from 'winston'

chai.use(chaiAsPromised)
chai.should()
logger.clear()

describe('Filter', () => {
  it('passes through objects', done => {
    const object = {
      property: 'value',
    }

    const stream = new PassThrough({ objectMode: true })
    const filter = new Filter(() => true)
    new BluebirdPromise((resolve, reject) =>
      filter
        .on('end', resolve)
        .on('error', reject)
        .on('data', resolve),
    ).should.eventually.be.deep
      .equal(object)
      .notify(done)

    stream.pipe(filter)
    stream.write(object)
    stream.end()
  })

  it('handles immediate exceptions', done => {
    const goodObject = {
      property: 'good',
    }
    const badObject = {
      property: 'bad',
    }

    const stream = new PassThrough({ objectMode: true })
    const filter = new Filter((object: any) => {
      if (object.property === 'bad') {
        throw new Error('expected')
      }
      return true
    })
    new Promise((resolve, reject) => {
      let data: any[] = []
      filter
        .on('end', () => resolve(data))
        .on('error', reject)
        .on('data', chunk => data.push(chunk))
    }).should.eventually.be.deep
      .equal([goodObject, goodObject])
      .notify(done)

    stream.pipe(filter)
    stream.write(goodObject)
    stream.write(badObject)
    stream.write(goodObject)
    stream.end()
  })

  it('handles future exceptions', done => {
    const goodObject = {
      property: 'good',
    }
    const badObject = {
      property: 'bad',
    }

    const stream = new PassThrough({ objectMode: true })
    const filter = new Filter(async (object: any) => {
      if (object.property === 'bad') {
        throw new Error('expected')
      }
      return true
    })
    new Promise((resolve, reject) => {
      let data: any[] = []
      filter
        .on('end', () => resolve(data))
        .on('error', reject)
        .on('data', chunk => data.push(chunk))
    }).should.eventually.be.deep
      .equal([goodObject, goodObject])
      .notify(done)

    stream.pipe(filter)
    stream.write(goodObject)
    stream.write(badObject)
    stream.write(goodObject)
    stream.end()
  })

  it('handles async filter callback correctly', done => {
    const object = {
      property: 'value',
    }

    const stream = new PassThrough({ objectMode: true })
    const filter = new Filter(
      async () =>
        new Promise(resolve => {
          setTimeout(() => {
            resolve(true)
          }, 25)
        }),
    )
    new Promise((resolve, reject) =>
      filter
        .on('end', resolve)
        .on('error', reject)
        .on('data', resolve),
    ).should.eventually.be.deep
      .equal(object)
      .notify(done)

    stream.pipe(filter)
    stream.write(object)
    stream.end()
  })
})
