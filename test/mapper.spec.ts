// Copyright (C) 2017-2019 Brainbean Apps OU (https://brainbeanapps.com).
// License AGPL-3.0 or later (https://www.gnu.org/licenses/agpl).

import 'mocha'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { Promise as BluebirdPromise } from 'bluebird'
import { PassThrough } from 'stream'
import * as logger from 'winston'
import Mapper from '../src/mapper'

chai.use(chaiAsPromised)
chai.should()
logger.clear()

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
    }).should.eventually.be
      .equal('a1a2b1b2')
      .notify(done)

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
    new BluebirdPromise((resolve, reject) => {
      let data = ''
      mapper
        .on('end', () => resolve(data))
        .on('error', error => {
          reject(new Error(error + ':' + data))
        })
        .on('data', chunk => {
          data += chunk
        })
    }).should.eventually.be
      .equal('a1a2b1b2')
      .notify(done)

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
    new Promise((resolve, reject) => {
      let data = ''
      mapper
        .on('end', () => resolve(data))
        .on('error', error => {
          reject(new Error(error + ':' + data))
        })
        .on('data', chunk => {
          data += chunk
        })
    }).should.eventually.be
      .equal('a1a2b1b2')
      .notify(done)

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
    new Promise((resolve, reject) => {
      let data = ''
      mapper
        .on('end', () => resolve(data))
        .on('error', error => {
          reject(new Error(error + ':' + data))
        })
        .on('data', chunk => {
          data += chunk
        })
    }).should.eventually.be
      .equal('a1a2b1b2')
      .notify(done)

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
    new Promise((resolve, reject) => {
      let data = ''
      mapper
        .on('end', () => resolve(data))
        .on('error', error => {
          reject(new Error(error + ':' + data))
        })
        .on('data', chunk => {
          data += chunk
        })
    }).should.eventually.be
      .equal('a1b1')
      .notify(done)

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
    new Promise((resolve, reject) => {
      let data = ''
      mapper
        .on('end', () => resolve(data))
        .on('error', (error: Error) => {
          reject(new Error(error + ':' + data))
        })
        .on('data', (chunk: any) => {
          data += chunk
        })
    }).should.eventually.be
      .rejectedWith('expected:a1')
      .notify(done)

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
    new Promise((resolve, reject) => {
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
    }).should.eventually.be
      .rejectedWith('expected:a1')
      .notify(done)

    input.pipe(mapper)
    input.write('a')
    input.write('b')
    input.end()
  })
})
