// Copyright (C) 2017-2019 Brainbean Apps OU (https://brainbeanapps.com).
// License AGPL-3.0 or later (https://www.gnu.org/licenses/agpl).

import 'ts-jest'
import { PassThrough } from 'stream'
import { Promise as BluebirdPromise } from 'bluebird'
import { Source, Target, ReplicationChainBuilder } from '../src'

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

    const builder = new ReplicationChainBuilder().from(source, {}, builder =>
      builder.to(target, {}),
    )
    const chains = builder.toChains()
    expect(chains).toHaveLength(1)
    expect(chains[0]).toHaveLength(2)

    let data: any = []
    targetStream.on('data', chunk => data.push(chunk))
    expect(
      builder.replicate().then(() => {
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

    const builder = new ReplicationChainBuilder().from(source, {}, builder =>
      builder.to(target, {}),
    )
    const chains = builder.toChains()
    expect(chains).toHaveLength(1)
    expect(chains[0]).toHaveLength(2)

    let data: any[] = []
    targetStream.on('data', chunk => data.push(chunk))
    expect(
      builder.replicate().then(() => {
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

    const builder = new ReplicationChainBuilder().from(source, {}, builder =>
      builder.to(target, {}),
    )
    const chains = builder.toChains()
    expect(chains).toHaveLength(1)
    expect(chains[0]).toHaveLength(2)

    let data: any[] = []
    targetStream.on('data', chunk => data.push(chunk))
    expect(
      builder.replicate().then(() => {
        return data
      }),
    )
      .resolves.toMatchObject([{ property: 'valueA' }, { property: 'valueB' }])
      .then(done)

    sourceStream.write({ property: 'valueA' })
    sourceStream.write({ property: 'valueB' })
    sourceStream.end()
  })

  it('replicates data (promised source and target)', done => {
    const sourceStream = new PassThrough({
      objectMode: true,
    })
    const promisedSourceStream = BluebirdPromise.resolve(sourceStream)
    const source = new Source({}, () => promisedSourceStream)

    const targetStream = new PassThrough({
      objectMode: true,
    })
    const promisedTargetStream = BluebirdPromise.resolve(targetStream)
    const target = new Target({}, () => promisedTargetStream)

    const builder = new ReplicationChainBuilder().from(source, {}, builder =>
      builder.to(target, {}),
    )
    const chains = builder.toChains()
    expect(chains).toHaveLength(1)
    expect(chains[0]).toHaveLength(2)

    let data: any[] = []
    targetStream.on('data', chunk => data.push(chunk))
    expect(
      builder.replicate().then(() => {
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
    const promisedSourceStream = BluebirdPromise.resolve(sourceStream)
    const source = new Source({}, () => [promisedSourceStream])

    const targetStream = new PassThrough({
      objectMode: true,
    })
    const promisedTargetStream = BluebirdPromise.resolve(targetStream)
    const target = new Target({}, () => [promisedTargetStream])

    const builder = new ReplicationChainBuilder().from(source, {}, builder =>
      builder.to(target, {}),
    )
    const chains = builder.toChains()
    expect(chains).toHaveLength(1)
    expect(chains[0]).toHaveLength(2)

    let data: any[] = []
    targetStream.on('data', chunk => data.push(chunk))
    expect(
      builder.replicate().then(() => {
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
        .from(source, {}, builder => builder.via(transform).to(target, {}))
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
        .via(transform, builder => builder.to(target, {}))
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
    ).rejects.toThrow(/expected/)
    targetStream.once('data', () => {
      sourceStream.emit('error', new Error('expected'))
    })
    targetStream.on('finish', done)

    sourceStream.write({ property: 'valueA' })
    sourceStream.write({ property: 'valueB' })
  })
})
