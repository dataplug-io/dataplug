import 'mocha'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { PassThrough } from 'stream'
import * as logger from 'winston'
import Sequence from '../src/sequence'

chai.use(chaiAsPromised)
chai.should()
logger.clear()

describe('Sequence', () => {
  it('supports array of streams', done => {
    const stream1 = new PassThrough()
    const stream2 = new PassThrough()
    const sequence = new Sequence([stream1, stream2])
    let data = ''
    new Promise((resolve, reject) =>
      sequence
        .on('end', () => resolve(data))
        .on('error', reject)
        .on('data', chunk => {
          data += chunk
        }),
    ).should.eventually.be
      .equal('12')
      .notify(done)

    stream1.write('1')
    stream1.end()

    stream2.write('2')
    stream2.end()
  })

  it('supports functor', done => {
    const stream1 = new PassThrough()
    const stream2 = new PassThrough()
    const sequence = new Sequence((oldStream: any, oldContext: any) => {
      if (oldStream === null) {
        return stream1
      }
      if (oldStream === stream1) {
        return stream2
      }
      return null
    })

    let data = ''
    new Promise((resolve, reject) =>
      sequence
        .on('end', () => resolve(data))
        .on('error', reject)
        .on('data', chunk => {
          data += chunk
        }),
    ).should.eventually.be
      .equal('12')
      .notify(done)

    stream1.write('1')
    stream1.end()

    stream2.write('2')
    stream2.end()
  })

  it('supports async functor', done => {
    const stream1 = new PassThrough()
    const stream2 = new PassThrough()
    const sequence = new Sequence(async (oldStream: any, oldContext: any) => {
      if (oldStream === null) {
        return stream1
      }
      if (oldStream === stream1) {
        return stream2
      }
      return null
    })

    let data = ''
    new Promise((resolve, reject) =>
      sequence
        .on('end', () => resolve(data))
        .on('error', reject)
        .on('data', chunk => {
          data += chunk
        }),
    ).should.eventually.be
      .equal('12')
      .notify(done)

    stream1.write('1')
    stream1.end()

    stream2.write('2')
    stream2.end()
  })

  it('handles errors', done => {
    const stream1 = new PassThrough()
    const stream2 = new PassThrough()
    const sequence = new Sequence(async (oldStream: any, oldContext: any) => {
      if (oldStream === null) {
        setTimeout(() => {
          stream1.write('1')
          stream1.emit('error', new Error('expected'))
          stream1.write('!')
        }, 25)
        return stream1
      }
      if (oldStream === stream1) {
        setTimeout(() => {
          stream2.write('2')
          stream2.emit('error', new Error('expected'))
          stream2.write('!')
        }, 25)
        return stream2
      }
      return null
    })

    let data = ''
    new Promise((resolve, reject) =>
      sequence
        .on('end', () => resolve(data))
        .on('error', reject)
        .on('data', chunk => {
          data += chunk
        }),
    ).should.eventually.be
      .equal('12')
      .notify(done)
  })

  it('handles exceptions', done => {
    const sequence = new Sequence((oldStream: any, oldContext: any) => {
      throw new Error('expected')
    })

    let data = ''
    new Promise((resolve, reject) =>
      sequence
        .on('end', () => resolve(data))
        .on('error', reject)
        .on('data', chunk => {
          data += chunk
        }),
    ).should.eventually.be
      .equal('')
      .notify(done)
  })

  it('handles async exceptions', done => {
    const sequence = new Sequence(async (oldStream: any, oldContext: any) => {
      throw new Error('expected')
    })

    let data = ''
    new Promise((resolve, reject) =>
      sequence
        .on('end', () => resolve(data))
        .on('error', reject)
        .on('data', chunk => {
          data += chunk
        }),
    ).should.eventually.be
      .equal('')
      .notify(done)
  })

  it('supports destroy', done => {
    const stream1 = new PassThrough()
    const stream2 = new PassThrough()
    const sequence = new Sequence([stream1, stream2])
    let data = ''
    new Promise((resolve, reject) =>
      sequence
        .on('end', () => resolve(data))
        .on('error', reject)
        .on('data', chunk => {
          data += chunk
        }),
    ).should.eventually.be
      .rejectedWith(/expected/)
      .notify(done)

    stream1.write('1')
    sequence.destroy(new Error('expected'))
    stream1.write('2')
  })

  it('handles underlying destroy', done => {
    const stream1 = new PassThrough()
    const stream2 = new PassThrough()
    const sequence = new Sequence([stream1, stream2])
    let data = ''
    new Promise((resolve, reject) =>
      sequence
        .on('end', () => resolve(data))
        .on('error', reject)
        .on('data', chunk => {
          data += chunk
        }),
    ).should.eventually.be
      .equal('12')
      .notify(done)

    sequence.once('data', () => {
      stream1.destroy()
    })
    stream1.write('1')
    stream2.write('2')
    stream2.end()
  })

  it('supports underlying error', done => {
    const stream = new PassThrough()
    const sequence = new Sequence([stream], { abortOnError: true })
    new Promise((resolve, reject) =>
      sequence
        .on('end', () => {
          reject(new Error())
        })
        .on('error', error => {
          resolve(error)
        }),
    ).should.eventually.be
      .equal('expected')
      .notify(done)

    sequence.once('data', chunk => {
      stream.emit('error', 'expected')
    })
    stream.write('1')
  })

  it('supports underlying error (tolerant)', done => {
    const stream1 = new PassThrough()
    const stream2 = new PassThrough()
    const sequence = new Sequence([stream1, stream2], { abortOnError: false })
    let data = ''
    new Promise((resolve, reject) =>
      sequence
        .on('end', () => resolve(data))
        .on('error', error => {
          error.should.be.equal('expected')
        })
        .on('data', chunk => {
          data += chunk
        }),
    ).should.eventually.be
      .equal('12')
      .notify(done)

    sequence.once('data', () => {
      stream1.emit('error', 'expected')
      stream1.end()
    })
    stream1.write('1')
    stream2.write('2')
    stream2.end()
  })

  it('supports underlying error (intolerant)', done => {
    const stream1 = new PassThrough()
    const stream2 = new PassThrough()
    const sequence = new Sequence([stream1, stream2], { abortOnError: true })
    let data = ''
    new Promise((resolve, reject) =>
      sequence
        .on('end', () => resolve(data))
        .on('error', reject)
        .on('data', chunk => {
          data += chunk
        }),
    ).should.eventually.be
      .rejectedWith(/expected/)
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
