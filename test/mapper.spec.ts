// Copyright (C) 2017-2019 Brainbean Apps OU (https://brainbeanapps.com).
// License AGPL-3.0 or later (https://www.gnu.org/licenses/agpl).

import 'ts-jest'
import { Promise as BluebirdPromise } from 'bluebird'
import { PassThrough } from 'stream'
import { Mapper } from '../src'

describe('Mapper', () => {
  it('maps input to streams', done => {
    const input = new PassThrough()
    const mapper = new Mapper((data: any) => {
      data = data.toString()
      const stream = new PassThrough()
      setTimeout(() => {
        stream.write(data + '1')
        stream.write(data + '2')
        stream.end()
      }, 25)
      return stream
    })
    expect(
      new BluebirdPromise((resolve, reject) => {
        let data = ''
        mapper
          .on('end', () => resolve(data))
          .on('error', (error: Error) => {
            reject(new Error(error + ':' + data))
          })
          .on('data', (chunk: any) => {
            data += chunk
          })
      }),
    )
      .resolves.toEqual('a1a2b1b2')
      .then(done)

    input.pipe(mapper)
    input.write('a')
    input.write('b')
    input.end()
  })

  it('supports async', done => {
    const input = new PassThrough()
    const mapper = new Mapper(async (data: any) => {
      data = data.toString()
      const stream = new PassThrough()
      setTimeout(() => {
        stream.write(data + '1')
        stream.write(data + '2')
        stream.end()
      }, 25)
      return stream
    })
    expect(
      new BluebirdPromise((resolve, reject) => {
        let data = ''
        mapper
          .on('end', () => resolve(data))
          .on('error', error => {
            reject(new Error(error + ':' + data))
          })
          .on('data', (chunk: any) => {
            data += chunk
          })
      }),
    )
      .resolves.toEqual('a1a2b1b2')
      .then(done)

    input.pipe(mapper)
    input.write('a')
    input.write('b')
    input.end()
  })

  it('handles exceptions', done => {
    const input = new PassThrough()
    const mapper = new Mapper((data: any) => {
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
    expect(
      new BluebirdPromise((resolve, reject) => {
        let data = ''
        mapper
          .on('end', () => resolve(data))
          .on('error', error => {
            reject(new Error(error + ':' + data))
          })
          .on('data', (chunk: any) => {
            data += chunk
          })
      }),
    )
      .resolves.toEqual('a1a2b1b2')
      .then(done)

    input.pipe(mapper)
    input.write('a')
    input.write('!')
    input.write('b')
    input.end()
  })

  it('handles async exceptions', done => {
    const input = new PassThrough()
    const mapper = new Mapper(async (data: any) => {
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
    expect(
      new BluebirdPromise((resolve, reject) => {
        let data = ''
        mapper
          .on('end', () => resolve(data))
          .on('error', error => {
            reject(new Error(error + ':' + data))
          })
          .on('data', (chunk: any) => {
            data += chunk
          })
      }),
    )
      .resolves.toEqual('a1a2b1b2')
      .then(done)

    input.pipe(mapper)
    input.write('a')
    input.write('!')
    input.write('b')
    input.end()
  })

  it('handles errors', done => {
    const input = new PassThrough()
    const mapper = new Mapper((data: any) => {
      data = data.toString()
      const stream = new PassThrough()
      setTimeout(() => {
        stream.write(data + '1')
        stream.emit('error', new Error('expected'))
        stream.write(data + '2')
      }, 25)
      return stream
    })
    expect(
      new BluebirdPromise((resolve, reject) => {
        let data = ''
        mapper
          .on('end', () => resolve(data))
          .on('error', error => {
            reject(new Error(error + ':' + data))
          })
          .on('data', (chunk: any) => {
            data += chunk
          })
      }),
    )
      .resolves.toEqual('a1b1')
      .then(done)

    input.pipe(mapper)
    input.write('a')
    input.write('b')
    input.end()
  })

  it('aborts on errors', done => {
    const input = new PassThrough()
    const mapper = new Mapper(
      (data: any) => {
        data = data.toString()
        const stream = new PassThrough()
        setTimeout(() => {
          stream.write(data + '1')
          stream.emit('error', new Error('expected'))
          stream.write(data + '2')
        }, 25)
        return stream
      },
      { abortOnError: true },
    )
    expect(
      new BluebirdPromise((resolve, reject) => {
        let data = ''
        mapper
          .on('end', () => resolve(data))
          .on('error', (error: Error) => {
            reject(new Error(error + ':' + data))
          })
          .on('data', (chunk: any) => {
            data += chunk
          })
      }),
    )
      .rejects.toThrow('Error: expected:a1')
      .then(done)

    input.pipe(mapper)
    input.write('a')
    input.write('b')
    input.end()
  })

  it('handles destroy', done => {
    const input = new PassThrough()
    const mapper = new Mapper(
      (data: any) => {
        data = data.toString()
        const stream = new PassThrough()
        setTimeout(() => {
          stream.write(data + '1')
          stream.emit('error', new Error('expected'))
          stream.write(data + '2')
        }, 25)
        return stream
      },
      { abortOnError: true },
    )
    expect(
      new BluebirdPromise((resolve, reject) => {
        let data = ''
        mapper
          .on('end', () => resolve(data))
          .on('error', (error: Error) => {
            reject(new Error(error + ':' + data))
          })
          .on('data', (chunk: any) => {
            data += chunk
            setImmediate(() => mapper.destroy())
          })
      }),
    )
      .rejects.toThrow('Error: expected:a1')
      .then(done)

    input.pipe(mapper)
    input.write('a')
    input.write('b')
    input.end()
  })

  it('error handling', done => {
    const input = new PassThrough()
    const mapper = new Mapper(
      () => {
        throw new Error('emulated error')
      },
      { abortOnError: true },
    )
    expect(
      new BluebirdPromise((resolve, reject) => {
        mapper.on('end', resolve).on('error', reject)
      }),
    )
      .rejects.toThrow('emulated error')
      .then(done)

    input.pipe(mapper)
    input.write('a')
    input.write('b')
    input.end()
  })
})
