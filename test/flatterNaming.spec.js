/* eslint-env node, mocha */
require('chai')
  .should()
const { FlatterNaming } = require('../lib')

describe('FlatterNaming', () => {
  describe('#constructor()', () => {
    it('has default value for \'pathSeparator\'', () => {
      new FlatterNaming().pathSeparator
        .should.be.equal(FlatterNaming.DEFAULT_PATH_SEPARATOR)
    })

    it('has default value for \'generatedFieldPrefix\'', () => {
      new FlatterNaming().generatedFieldPrefix
        .should.be.equal(FlatterNaming.DEFAULT_GENERATED_FIELD_PREFIX)
    })

    it('has default value for \'placeholder\'', () => {
      new FlatterNaming().placeholder
        .should.be.equal(FlatterNaming.DEFAULT_PLACEHOLDER)
    })
  })

  describe('#getEntityFqName()', () => {
    it('returns empty entity name if no components specified', () => {
      new FlatterNaming().getEntityFqName()
        .should.be.equal('')
    })

    it('returns entity name if 1 components specified', () => {
      new FlatterNaming().getEntityFqName('entity')
        .should.be.equal('entity')
    })

    it('returns entity name if 2 components specified', () => {
      new FlatterNaming().getEntityFqName('entity', 'subentity')
        .should.be.equal(`entity${FlatterNaming.DEFAULT_PATH_SEPARATOR}subentity`)
    })
  })
})
