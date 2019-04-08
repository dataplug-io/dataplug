import 'mocha'
import { should as initializeChaiShould } from 'chai'
import { dataplug } from '../src'
initializeChaiShould()

describe('dataplug.config', () => {
  it('has "declare" function', () => {
    return dataplug.config.should.have
      .property('declare')
      .that.is.an('function')
  })

  it('has "map" function', () => {
    return dataplug.config.should.have.property('map').that.is.an('function')
  })

  describe('#declare()', () => {
    it('creates an instance of ConfigDeclaration', () => {
      return dataplug.config
        .declare()
        .should.be.an.instanceof(dataplug.ConfigDeclaration)
    })
  })

  describe('#map()', () => {
    it('creates an instance of ConfigMapping', () => {
      return dataplug.config
        .map()
        .should.be.an.instanceof(dataplug.ConfigMapping)
    })
  })
})
