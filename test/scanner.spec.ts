// Copyright (C) 2017-2019 Brainbean Apps OU (https://brainbeanapps.com).
// License AGPL-3.0 or later (https://www.gnu.org/licenses/agpl).

import 'ts-jest'
import { PassThrough } from 'stream'
import { Promise as BluebirdPromise } from 'bluebird'
import { Scanner } from '../src'

describe('Scanner', () => {
  it('passes through objects', done => {
    const object = {
      property: 'value',
    }

    const stream = new PassThrough({ objectMode: true })
    const scanner = new Scanner(() => {})
    expect(
      new BluebirdPromise((resolve, reject) =>
        scanner
          .on('end', resolve)
          .on('error', reject)
          .on('data', resolve),
      ),
    )
      .resolves.toMatchObject(object)
      .then(done)

    stream.pipe(scanner)
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
    const scanner = new Scanner(object => {
      if (object.property === 'bad') {
        throw new Error('expected')
      }
    })
    expect(
      new BluebirdPromise((resolve, reject) => {
        let data: any[] = []
        scanner
          .on('end', () => resolve(data))
          .on('error', reject)
          .on('data', chunk => data.push(chunk))
      }),
    )
      .resolves.toMatchObject([goodObject, badObject, goodObject])
      .then(done)

    stream.pipe(scanner)
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
    const scanner = new Scanner(async object => {
      if (object.property === 'bad') {
        throw new Error('expected')
      }
    })
    expect(
      new BluebirdPromise((resolve, reject) => {
        let data: any[] = []
        scanner
          .on('end', () => resolve(data))
          .on('error', reject)
          .on('data', chunk => data.push(chunk))
      }),
    )
      .resolves.toMatchObject([goodObject, badObject, goodObject])
      .then(done)

    stream.pipe(scanner)
    stream.write(goodObject)
    stream.write(badObject)
    stream.write(goodObject)
    stream.end()
  })

  it('handles async scanner callback correctly', done => {
    const object = {
      property: 'value',
    }

    const stream = new PassThrough({ objectMode: true })
    const scanner = new Scanner(
      async () =>
        new BluebirdPromise<void>(resolve => {
          setTimeout(() => {
            resolve()
          }, 25)
        }),
    )
    expect(
      new BluebirdPromise((resolve, reject) =>
        scanner
          .on('end', resolve)
          .on('error', reject)
          .on('data', resolve),
      ),
    )
      .resolves.toMatchObject(object)
      .then(done)

    stream.pipe(scanner)
    stream.write(object)
    stream.end()
  })
})
