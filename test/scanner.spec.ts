// Copyright (C) 2017-2019 Brainbean Apps OU (https://brainbeanapps.com).
// License AGPL-3.0 or later (https://www.gnu.org/licenses/agpl).

import 'mocha'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { PassThrough } from 'stream'
import * as logger from 'winston'
import Scanner from '../src/scanner'

chai.use(chaiAsPromised)
chai.should()
logger.clear()

describe('Scanner', () => {
  it('passes through objects', done => {
    const object = {
      property: 'value',
    }

    const stream = new PassThrough({ objectMode: true })
    const scanner = new Scanner(() => {})
    new Promise((resolve, reject) =>
      scanner
        .on('end', resolve)
        .on('error', reject)
        .on('data', resolve),
    ).should.eventually.be.deep
      .equal(object)
      .notify(done)

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
    const scanner = new Scanner((object: any) => {
      if (object.property === 'bad') {
        throw new Error('expected')
      }
      return true
    })
    new Promise((resolve, reject) => {
      let data: any[] = []
      scanner
        .on('end', () => resolve(data))
        .on('error', reject)
        .on('data', chunk => data.push(chunk))
    }).should.eventually.be.deep
      .equal([goodObject, badObject, goodObject])
      .notify(done)

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
    const scanner = new Scanner(async (object: any) => {
      if (object.property === 'bad') {
        throw new Error('expected')
      }
      return true
    })
    new Promise((resolve, reject) => {
      let data: any[] = []
      scanner
        .on('end', () => resolve(data))
        .on('error', reject)
        .on('data', chunk => data.push(chunk))
    }).should.eventually.be.deep
      .equal([goodObject, badObject, goodObject])
      .notify(done)

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
        new Promise(resolve => {
          setTimeout(() => {
            resolve(true)
          }, 25)
        }),
    )
    new Promise((resolve, reject) =>
      scanner
        .on('end', resolve)
        .on('error', reject)
        .on('data', resolve),
    ).should.eventually.be.deep
      .equal(object)
      .notify(done)

    stream.pipe(scanner)
    stream.write(object)
    stream.end()
  })
})
