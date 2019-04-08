import 'mocha'
import { should as initializeChaiShould } from 'chai'
import ConfigMapping from '../src/configMapping'
initializeChaiShould()

describe('ConfigMapping', () => {
  describe('#constructor()', () => {
    it('has default parameters', () => {
      ;(() => new ConfigMapping()).should.not.throw()
    })

    it('clones other instance', () => {
      const mapper = (value: any) => {}
      const other = new ConfigMapping().remap('property', mapper)
      new ConfigMapping(other).should.have.property('property')
    })
  })

  describe('#extended()', () => {
    it('has default parameters', () => {
      ;(() => new ConfigMapping().extended()).should.not.throw()
    })

    it('clones other instance', () => {
      new ConfigMapping()
        .remap('property', (value: any) => {})
        .extended()
        .should.have.property('property')
    })
  })

  describe('#remap()', () => {
    it('renames key and alters value', () => {
      new ConfigMapping()
        .remap('property', () => {
          return { otherProperty: 'otherValue' }
        })
        .apply({ property: 'value' })
        .should.deep.equal({ otherProperty: 'otherValue' })
    })

    it('matches multiple keys and keeps value', () => {
      new ConfigMapping()
        .remap(/key([AB])/, (value: any, key: any) => {
          let result = {}
          result[`${key}_altered`] = value
          return result
        })
        .apply({
          keyA: 'valueA',
          keyB: 'valueB',
          keyC: 'valueC',
        })
        .should.deep.equal({
          keyA_altered: 'valueA',
          keyB_altered: 'valueB',
        })
    })
  })

  describe('#rename()', () => {
    it('renames key and copies value as-is', () => {
      new ConfigMapping()
        .rename('property', 'otherProperty')
        .apply({ property: 'value' })
        .should.deep.equal({ otherProperty: 'value' })
    })
  })

  describe('#asIs()', () => {
    it('copies key and value as-is', () => {
      new ConfigMapping()
        .asIs('property')
        .apply({ property: 'value' })
        .should.deep.equal({ property: 'value' })
    })
  })

  describe('#default()', () => {
    it('sets default value', () => {
      new ConfigMapping()
        .default('otherProperty', () => 'otherValue')
        .apply({ property: 'value' })
        .should.deep.equal({ otherProperty: 'otherValue' })
    })
  })

  describe('#apply()', () => {})
})
