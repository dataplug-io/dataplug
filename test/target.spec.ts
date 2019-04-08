// Copyright (C) 2017-2019 Brainbean Apps OU (https://brainbeanapps.com).
// License AGPL-3.0 or later (https://www.gnu.org/licenses/agpl).

import 'mocha'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { PassThrough } from 'stream'
import Target from '../src/target'

chai.use(chaiAsPromised)
chai.should()

describe('Target', () => {
  it('supports instantly-available stream', done => {
    const stream = new PassThrough()
    new Target({}, () => stream)
      .createInput({})
      .should.eventually.be.deep.equal(stream)
      .notify(done)
  })

  it('supports promised stream', done => {
    const stream = new PassThrough()
    new Target({}, async () => stream)
      .createInput({})
      .should.eventually.be.deep.equal(stream)
      .notify(done)
  })

  it('supports instantly-available streams', done => {
    const stream = new PassThrough()
    new Target({}, () => [stream])
      .createInput({})
      .should.eventually.be.deep.equal([stream])
      .notify(done)
  })

  it('supports promised streams', done => {
    const stream = new PassThrough()
    new Target({}, async () => [stream])
      .createInput({})
      .should.eventually.be.deep.equal([stream])
      .notify(done)
  })
})
