// Copyright (C) 2017-2019 Brainbean Apps OU (https://brainbeanapps.com).
// License AGPL-3.0 or later (https://www.gnu.org/licenses/agpl).

import { forOwn, clone, isRegExp } from 'lodash'
import check from 'check-types'

export default class ConfigMapping {
  /**
   * @constructor
   * @param that Other mapping to clone
   */
  constructor(that?: Object) {
    if (that) {
      forOwn(that, (declaration, selector) => {
        this[selector] = clone(declaration)
      })
    }
  }

  /**
   * Returns copy of this mapping, extended using specified modifier
   *
   * @param modifier An modifier functor
   * @return Copy of this mapping
   */
  extended(modifier?: Function) {
    const clone = new ConfigMapping(this)
    return modifier ? modifier(clone) : clone
  }

  /**
   * Remaps a parameter matched to specified selector using specified mapper
   *
   * @param selector Parameter selector, supports regexp
   * @param mapper Mapper function
   * @return This instance (for chaining purposes)
   */
  remap(selector: string | RegExp, mapper: Function) {
    check.assert(
      check.any([check.instance(selector, RegExp), check.not.null(selector)]),
    )

    // Convert regexp to a string, if needed
    if (isRegExp(selector)) {
      // @ts-ignore
      selector = selector.toString().match(/^\/(.*?)\/[gimuy]?$/)[1]
      if (!selector) {
        throw new Error(`'${selector}' selector is not valid Regexp`)
      }
    }
    if (this[selector] && this[selector].mapper) {
      throw new Error(`'${selector}' selector already mapped`)
    }

    this[selector] = Object.assign({}, this[selector], {
      mapper,
    })

    return this
  }

  /**
   * Renames a parameter
   *
   * @param selector Parameter selector, supports regexp
   * @param newName New name for matching parameter
   * @return This instance (for chaining purposes)
   */
  rename(selector: string, newName: string) {
    check.assert.nonEmptyString(newName)

    return this.remap(selector, (value: any) => {
      if (!value) {
        return
      }
      let mapped = {}
      mapped[newName] = value
      return mapped
    })
  }

  /**
   * Uses parameter as-is
   *
   * @param selector Parameter selector, supports regexp
   * @return This instance (for chaining purposes)
   */
  asIs(selector: string) {
    return this.remap(selector, (value: any, currentName: string) => {
      if (!value) {
        return
      }
      let mapped = {}
      mapped[currentName] = value
      return mapped
    })
  }

  /**
   * Sets default value factory for the selector
   *
   * @param selector Parameter selector, supports regexp
   * @param defaultValueFactory Default value factory
   * @return This instance (for chaining purposes)
   */
  default(selector: string, defaultValueFactory: Function) {
    // TODO: check selector type

    if (this[selector] && this[selector].defaultValueFactory) {
      throw new Error(
        `'${selector}' selector already has default value factory`,
      )
    }

    this[selector] = Object.assign({}, this[selector], {
      defaultValueFactory,
    })

    return this
  }

  /**
   * Applies mappings to given values
   *
   * @param values Values to map
   * @return Mapped values
   */
  apply(values: Object) {
    let mappedValues = {}
    forOwn(this, (declaration: any, selector) => {
      let wasMatched = false
      if (declaration.mapper) {
        let matched = 0
        forOwn(values, (parameterValue, parameter) => {
          if (!parameter.match(new RegExp(selector))) {
            return
          }

          const mappedValue = declaration.mapper(
            parameterValue,
            parameter,
            values,
          )
          if (mappedValue === undefined) {
            return
          }

          mappedValues = Object.assign({}, mappedValues, mappedValue)
          matched++
        })
        wasMatched = matched > 0
      }

      if (!wasMatched && declaration.defaultValueFactory) {
        const defaultValue = declaration.defaultValueFactory()
        if (defaultValue) {
          let defaultValueObject = {}
          defaultValueObject[selector] = defaultValue
          mappedValues = Object.assign({}, mappedValues, defaultValueObject)
        }
      }
    })

    return mappedValues
  }
}
