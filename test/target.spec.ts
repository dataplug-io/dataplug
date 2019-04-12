// Copyright (C) 2017-2019 Brainbean Apps OU (https://brainbeanapps.com).
// License AGPL-3.0 or later (https://www.gnu.org/licenses/agpl).

import { PassThrough } from 'stream'
import Target from '../src/target'
import 'ts-jest'

describe('Target', () => {
  it('supports instantly-available stream', done => {
    const stream = new PassThrough()
    expect(new Target({}, () => stream).createInput({}))
      .resolves.toStrictEqual(stream)
      .then(done)
  })

  it('supports promised stream', done => {
    const stream = new PassThrough()
    expect(new Target({}, async () => stream).createInput({}))
      .resolves.toStrictEqual(stream)
      .then(done)
  })

  it('supports instantly-available streams', done => {
    const stream = new PassThrough()
    expect(new Target({}, () => [stream]).createInput({}))
      .resolves.toStrictEqual([stream])
      .then(done)
  })

  it('supports promised streams', done => {
    const stream = new PassThrough()
    expect(new Target({}, async () => [stream]).createInput({}))
      .resolves.toStrictEqual([stream])
      .then(done)
  })
})
