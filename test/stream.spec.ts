// Copyright (C) 2017-2019 Brainbean Apps OU (https://brainbeanapps.com).
// License AGPL-3.0 or later (https://www.gnu.org/licenses/agpl).

import 'ts-jest'
import {
  PassThrough,
  Transform,
  Duplex,
  Readable,
  Writable,
  Stream,
} from 'stream'
import { isReadableStream, isWritableStream } from '../src'

describe('Stream', () => {
  describe('isReadableStream()', () => {
    it('accepts PassThrough', () => {
      expect(isReadableStream(new PassThrough())).toBe(true)
    })

    it('accepts Transform', () => {
      expect(isReadableStream(new Transform())).toBe(true)
    })

    it('accepts Duplex', () => {
      expect(isReadableStream(new Duplex())).toBe(true)
    })

    it('accepts Readable', () => {
      expect(isReadableStream(new Readable())).toBe(true)
    })

    it('rejects Writable', () => {
      expect(isReadableStream(new Writable())).toBe(false)
    })

    it('rejects Stream', () => {
      expect(isReadableStream(new Stream())).toBe(false)
    })
  })

  describe('isWritableStream()', () => {
    it('accepts PassThrough', () => {
      expect(isWritableStream(new PassThrough())).toBe(true)
    })

    it('accepts Transform', () => {
      expect(isWritableStream(new Transform())).toBe(true)
    })

    it('accepts Duplex', () => {
      expect(isWritableStream(new Duplex())).toBe(true)
    })

    it('accepts Writable', () => {
      expect(isWritableStream(new Writable())).toBe(true)
    })

    it('rejects Readable', () => {
      expect(isWritableStream(new Readable())).toBe(false)
    })

    it('rejects Stream', () => {
      expect(isWritableStream(new Stream())).toBe(false)
    })
  })
})
