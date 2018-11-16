import 'mocha'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { Promise as BluebirdPromise } from 'bluebird'
import { PassThrough } from 'stream'
import Counter from '../src/counter'
import * as logger from 'winston'

chai.use(chaiAsPromised)
chai.should()
logger.clear()

describe('Counter', () => {
  it('passes through objects', done => {
    const object = {
      property: 'value',
    }

    const stream = new PassThrough({ objectMode: true })
    const counter = new Counter()
    new BluebirdPromise((resolve, reject) =>
      counter
        .on('end', resolve)
        .on('error', reject)
        .on('data', resolve),
    ).should.eventually.be.deep
      .equal(object)
      .notify(done)

    stream.pipe(counter)
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
    const counter = new Counter({
      counter: object => {
        if (object.property === 'bad') {
          throw new Error('expected')
        }
        return true
      },
    })
    new Promise((resolve, reject) => {
      let data: any[] = []
      counter
        .on('end', () => resolve(data))
        .on('error', reject)
        .on('data', (chunk: any) => data.push(chunk))
    }).should.eventually.be.deep
      .equal([goodObject, badObject, goodObject])
      .notify(done)

    stream.pipe(counter)
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
    const counter = new Counter({
      counter: async object => {
        if (object.property === 'bad') {
          throw new Error('expected')
        }
        return true
      },
    })
    new Promise((resolve, reject) => {
      let data: any[] = []
      counter
        .on('end', () => resolve(data))
        .on('error', reject)
        .on('data', chunk => data.push(chunk))
    }).should.eventually.be.deep
      .equal([goodObject, badObject, goodObject])
      .notify(done)

    stream.pipe(counter)
    stream.write(goodObject)
    stream.write(badObject)
    stream.write(goodObject)
    stream.end()
  })
})
