import 'mocha'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { PassThrough } from 'stream'
import * as logger from 'winston'
import Source from '../src/source'
import Target from '../src/target'
import { ReplicationChainBuilder } from '../src'

chai.use(chaiAsPromised)
chai.should()

logger.clear()

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
    new ReplicationChainBuilder()
      .from(source, {}, (chain: any) => chain.to(target, {}))
      .replicate()
      .then(() => {
        return data
      })
      .should.eventually.be.deep.equal([
        { property: 'valueA' },
        { property: 'valueB' },
      ])
      .and.notify(done)

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
    new ReplicationChainBuilder()
      .from(source, {}, (chain: any) => chain.to(target, {}))
      .replicate()
      .then(() => {
        return data
      })
      .should.eventually.be.deep.equal([
        { property: 'valueA' },
        { property: 'valueB' },
      ])
      .and.notify(done)

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
    new ReplicationChainBuilder()
      .from(source, {}, (chain: any) => chain.to(target, {}))
      .replicate()
      .then(() => {
        return data
      })
      .should.eventually.be.deep.equal([
        { property: 'valueA' },
        { property: 'valueB' },
      ])
      .and.notify(done)

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
    new ReplicationChainBuilder()
      .from(source, {}, (chain: any) => chain.to(target, {}))
      .replicate()
      .then(() => {
        return data
      })
      .should.eventually.be.deep.equal([
        { property: 'valueA' },
        { property: 'valueB' },
      ])
      .and.notify(done)

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
    new ReplicationChainBuilder()
      .from(source, {}, (chain: any) => chain.via(transform).to(target, {}))
      .replicate()
      .then(() => {
        return data
      })
      .should.eventually.be.deep.equal([
        { property: 'valueA' },
        { property: 'valueB' },
      ])
      .and.notify(done)

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
    new ReplicationChainBuilder()
      .from(source, {})
      .via(transform, (chain: any) => chain.to(target, {}))
      .replicate()
      .then(() => {
        return data
      })
      .should.eventually.be.deep.equal([
        { property: 'valueA' },
        { property: 'valueB' },
      ])
      .and.notify(done)

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
    new ReplicationChainBuilder()
      .from(source, {})
      .to(target, {})
      .replicate()
      .catch(error => {
        error.should.be.equal('expected')
      })
    targetStream.once('data', () => {
      sourceStream.emit('error', 'expected')
    })
    targetStream.on('finish', done)

    sourceStream.write({ property: 'valueA' })
    sourceStream.write({ property: 'valueB' })
  })
})
