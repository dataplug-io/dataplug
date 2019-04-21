// Copyright (C) 2017-2019 Brainbean Apps OU (https://brainbeanapps.com).
// License AGPL-3.0 or later (https://www.gnu.org/licenses/agpl).

import 'ts-jest'
import { PassThrough } from 'stream'
import { Promise as BluebirdPromise } from 'bluebird'
import { Sequence } from '../src'

describe('Sequence', () => {
  it('supports array of streams', done => {
    const stream1 = new PassThrough()
    const stream2 = new PassThrough()
    const sequence = new Sequence([stream1, stream2])
    let data = ''
    expect(
      new BluebirdPromise((resolve, reject) =>
        sequence
          .on('end', () => resolve(data))
          .on('error', reject)
          .on('data', (chunk: any) => {
            data += chunk
          }),
      ),
    )
      .resolves.toEqual('12')
      .then(done)

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
    expect(
      new BluebirdPromise((resolve, reject) =>
        sequence
          .on('end', () => resolve(data))
          .on('error', reject)
          .on('data', (chunk: any) => {
            data += chunk
          }),
      ),
    )
      .resolves.toEqual('12')
      .then(done)

    stream1.write('1')
    stream1.end()

    stream2.write('2')
    stream2.end()
  })

  it('supports async functor', done => {
    const stream1 = new PassThrough()
    const stream2 = new PassThrough()
    const sequence = new Sequence(async (oldStream, oldContext) => {
      if (oldStream === null) {
        return stream1
      }
      if (oldStream === stream1) {
        return stream2
      }
      return null
    })

    let data = ''
    expect(
      new BluebirdPromise((resolve, reject) =>
        sequence
          .on('end', () => resolve(data))
          .on('error', reject)
          .on('data', (chunk: any) => {
            data += chunk
          }),
      ),
    )
      .resolves.toEqual('12')
      .then(done)

    stream1.write('1')
    stream1.end()

    stream2.write('2')
    stream2.end()
  })

  it('handles errors', done => {
    const stream1 = new PassThrough()
    const stream2 = new PassThrough()
    const sequence = new Sequence(async (oldStream, oldContext) => {
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
    expect(
      new BluebirdPromise((resolve, reject) =>
        sequence
          .on('end', () => resolve(data))
          .on('error', reject)
          .on('data', (chunk: any) => {
            data += chunk
          }),
      ),
    )
      .resolves.toEqual('12')
      .then(done)
  })

  it('handles exceptions', done => {
    const sequence = new Sequence((oldStream: any, oldContext: any) => {
      throw new Error('expected')
    })

    let data = ''
    expect(
      new BluebirdPromise((resolve, reject) =>
        sequence
          .on('end', () => resolve(data))
          .on('error', reject)
          .on('data', (chunk: any) => {
            data += chunk
          }),
      ),
    )
      .resolves.toEqual('')
      .then(done)
  })

  it('handles async exceptions', done => {
    const sequence = new Sequence(async (oldStream, oldContext) => {
      throw new Error('expected')
      return null
    })

    let data = ''
    expect(
      new BluebirdPromise((resolve, reject) =>
        sequence
          .on('end', () => resolve(data))
          .on('error', reject)
          .on('data', (chunk: any) => {
            data += chunk
          }),
      ),
    )
      .resolves.toEqual('')
      .then(done)
  })

  it('supports destroy', done => {
    const stream1 = new PassThrough()
    const stream2 = new PassThrough()
    const sequence = new Sequence([stream1, stream2])
    let data = ''
    expect(
      new BluebirdPromise((resolve, reject) =>
        sequence
          .on('end', () => resolve(data))
          .on('error', reject)
          .on('data', (chunk: any) => {
            data += chunk
          }),
      ),
    )
      .rejects.toThrowError('expected')
      .then(done)

    stream1.write('1')
    sequence.destroy(new Error('expected'))
    stream1.write('2')
  })

  it('handles underlying destroy', done => {
    const stream1 = new PassThrough()
    const stream2 = new PassThrough()
    const sequence = new Sequence([stream1, stream2])
    let data = ''
    expect(
      new BluebirdPromise((resolve, reject) =>
        sequence
          .on('end', () => resolve(data))
          .on('error', reject)
          .on('data', (chunk: any) => {
            data += chunk
          }),
      ),
    )
      .resolves.toEqual('12')
      .then(done)

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
    expect(
      new BluebirdPromise((resolve, reject) =>
        sequence
          .on('end', () => {
            reject(new Error())
          })
          .on('error', error => {
            resolve(error)
          }),
      ),
    )
      .resolves.toEqual('expected')
      .then(done)

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
    expect(
      new BluebirdPromise((resolve, reject) =>
        sequence
          .on('end', () => resolve(data))
          .on('error', error => {
            expect(error).toThrow('expected')
          })
          .on('data', (chunk: any) => {
            data += chunk
          }),
      ),
    )
      .resolves.toEqual('12')
      .then(done)

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
    expect(
      new BluebirdPromise((resolve, reject) =>
        sequence
          .on('end', () => resolve(data))
          .on('error', reject)
          .on('data', (chunk: any) => {
            data += chunk
          }),
      ),
    )
      .rejects.toMatch(/expected/)
      .then(done)

    sequence.once('data', () => {
      stream1.emit('error', 'expected')
      stream1.end()
    })
    stream1.write('1')
    stream2.write('2')
    stream2.end()
  })
})
