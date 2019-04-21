// Copyright (C) 2017-2019 Brainbean Apps OU (https://brainbeanapps.com).
// License AGPL-3.0 or later (https://www.gnu.org/licenses/agpl).

import 'ts-jest'
import { PassThrough } from 'stream'
import { Source } from '../src'

describe('Source', () => {
  it('supports instantly-available stream', done => {
    const stream = new PassThrough()
    expect(new Source({}, () => stream).createOutput({}))
      .resolves.toStrictEqual(stream)
      .then(done)
  })

  it('supports promised stream', done => {
    const stream = new PassThrough()
    expect(new Source({}, async () => stream).createOutput({}))
      .resolves.toStrictEqual(stream)
      .then(done)
  })

  it('supports instantly-available streams', done => {
    const stream = new PassThrough()
    expect(new Source({}, () => [stream]).createOutput({}))
      .resolves.toStrictEqual([stream])
      .then(done)
  })

  it('supports promised streams', done => {
    const stream = new PassThrough()
    expect(new Source({}, async () => [stream]).createOutput({}))
      .resolves.toStrictEqual([stream])
      .then(done)
  })
})
