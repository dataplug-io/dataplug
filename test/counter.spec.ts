// Copyright (C) 2017-2019 Brainbean Apps OU (https://brainbeanapps.com).
// License AGPL-3.0 or later (https://www.gnu.org/licenses/agpl).

import 'ts-jest'
import { Promise as BluebirdPromise } from 'bluebird'
import { PassThrough } from 'stream'
import { Counter } from '../src'

describe('Counter', () => {
  it('passes through objects', done => {
    const object = {
      property: 'value',
    }

    const stream = new PassThrough({ objectMode: true })
    const counter = new Counter()
    expect(
      new BluebirdPromise((resolve, reject) =>
        counter
          .on('end', resolve)
          .on('error', reject)
          .on('data', resolve),
      ),
    )
      .resolves.toEqual(object)
      .then(done)

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
    expect(
      new BluebirdPromise((resolve, reject) => {
        let data: any[] = []
        counter
          .on('end', () => resolve(data))
          .on('error', reject)
          .on('data', (chunk: any) => data.push(chunk))
      }),
    )
      .resolves.toEqual([goodObject, badObject, goodObject])
      .then(done)

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
    expect(
      new BluebirdPromise((resolve, reject) => {
        let data: any[] = []
        counter
          .on('end', () => resolve(data))
          .on('error', reject)
          .on('data', chunk => data.push(chunk))
      }),
    )
      .resolves.toEqual([goodObject, badObject, goodObject])
      .then(done)

    stream.pipe(counter)
    stream.write(goodObject)
    stream.write(badObject)
    stream.write(goodObject)
    stream.end()
  })
})
