// Copyright (C) 2017-2019 Brainbean Apps OU (https://brainbeanapps.com).
// License AGPL-3.0 or later (https://www.gnu.org/licenses/agpl).

import { PassThrough } from 'stream'
import Source from '../src/source'
import Target from '../src/target'
import { ReplicationChainBuilder } from '../src'
import 'ts-jest'

describe('ReplicationChainBuilder', () => {
  it('replicates data', done => {
    const sourceStream = new PassThrough({
      objectMode: true,
    })
    const source = new Source({}, () => sourceStream)

    const targetStream = new PassThrough({
      objectMode: true,
    })
    const target = new Target({}, () => targetStream)

    let data: any = []
    targetStream.on('data', chunk => data.push(chunk))
    expect(
      new ReplicationChainBuilder()
        .from(source, {}, (chain: any) => chain.to(target, {}))
        .replicate()
        .then(() => {
          return data
        }),
    )
      .resolves.toMatchObject([{ property: 'valueA' }, { property: 'valueB' }])
      .then(done)

    sourceStream.write({ property: 'valueA' })
    sourceStream.write({ property: 'valueB' })
    sourceStream.end()
  })

  it('replicates data (complex source and target)', done => {
    const sourceStream = new PassThrough({
      objectMode: true,
    })
    const source = new Source({}, () => [sourceStream])

    const targetStream = new PassThrough({
      objectMode: true,
    })
    const target = new Target({}, () => [targetStream])

    let data: any[] = []
    targetStream.on('data', chunk => data.push(chunk))
    expect(
      new ReplicationChainBuilder()
        .from(source, {}, (chain: any) => chain.to(target, {}))
        .replicate()
        .then(() => {
          return data
        }),
    )
      .resolves.toMatchObject([{ property: 'valueA' }, { property: 'valueB' }])
      .then(done)

    sourceStream.write({ property: 'valueA' })
    sourceStream.write({ property: 'valueB' })
    sourceStream.end()
  })

  it('replicates data (async source and target)', done => {
    const sourceStream = new PassThrough({
      objectMode: true,
    })
    const source = new Source({}, async () => sourceStream)

    const targetStream = new PassThrough({
      objectMode: true,
    })
    const target = new Target({}, async () => targetStream)

    let data: any[] = []
    targetStream.on('data', chunk => data.push(chunk))
    expect(
      new ReplicationChainBuilder()
        .from(source, {}, (chain: any) => chain.to(target, {}))
        .replicate()
        .then(() => {
          return data
        }),
    )
      .resolves.toMatchObject([{ property: 'valueA' }, { property: 'valueB' }])
      .then(done)

    sourceStream.write({ property: 'valueA' })
    sourceStream.write({ property: 'valueB' })
    sourceStream.end()
  })

  it('replicates data (complex async source and target)', done => {
    const sourceStream = new PassThrough({
      objectMode: true,
    })
    const source = new Source({}, async () => [sourceStream])

    const targetStream = new PassThrough({
      objectMode: true,
    })
    const target = new Target({}, async () => [targetStream])

    let data: any[] = []
    targetStream.on('data', chunk => data.push(chunk))
    expect(
      new ReplicationChainBuilder()
        .from(source, {}, (chain: any) => chain.to(target, {}))
        .replicate()
        .then(() => {
          return data
        }),
    )
      .resolves.toMatchObject([{ property: 'valueA' }, { property: 'valueB' }])
      .then(done)

    sourceStream.write({ property: 'valueA' })
    sourceStream.write({ property: 'valueB' })
    sourceStream.end()
  })

  it('replicates data with transform', done => {
    const sourceStream = new PassThrough({
      objectMode: true,
    })
    const source = new Source({}, () => sourceStream)

    const targetStream = new PassThrough({
      objectMode: true,
    })
    const target = new Target({}, () => targetStream)

    const transform = new PassThrough({
      objectMode: true,
    })

    let data: any[] = []
    targetStream.on('data', chunk => data.push(chunk))
    expect(
      new ReplicationChainBuilder()
        .from(source, {}, (chain: any) => chain.via(transform).to(target, {}))
        .replicate()
        .then(() => {
          return data
        }),
    )
      .resolves.toMatchObject([{ property: 'valueA' }, { property: 'valueB' }])
      .then(done)

    sourceStream.write({ property: 'valueA' })
    sourceStream.write({ property: 'valueB' })
    sourceStream.end()
  })

  it('replicates data with transform (2)', done => {
    const sourceStream = new PassThrough({
      objectMode: true,
    })
    const source = new Source({}, () => sourceStream)

    const targetStream = new PassThrough({
      objectMode: true,
    })
    const target = new Target({}, () => targetStream)

    const transform = new PassThrough({
      objectMode: true,
    })

    let data: any = []
    targetStream.on('data', chunk => data.push(chunk))
    expect(
      new ReplicationChainBuilder()
        .from(source, {})
        .via(transform, (chain: any) => chain.to(target, {}))
        .replicate()
        .then(() => {
          return data
        }),
    )
      .resolves.toMatchObject([{ property: 'valueA' }, { property: 'valueB' }])
      .then(done)

    sourceStream.write({ property: 'valueA' })
    sourceStream.write({ property: 'valueB' })
    sourceStream.end()
  })

  it('handles error in source with stopping', done => {
    const sourceStream = new PassThrough({
      objectMode: true,
    })
    const source = new Source({}, () => sourceStream)

    const targetStream = new PassThrough({
      objectMode: true,
    })
    const target = new Target({}, () => targetStream)

    let data: any[] = []
    targetStream.on('data', chunk => data.push(chunk))
    expect(
      new ReplicationChainBuilder()
        .from(source, {})
        .to(target, {})
        .replicate(),
    ).rejects.toMatch('expected')
    targetStream.once('data', () => {
      sourceStream.emit('error', 'expected')
    })
    targetStream.on('finish', done)

    sourceStream.write({ property: 'valueA' })
    sourceStream.write({ property: 'valueB' })
  })
})
