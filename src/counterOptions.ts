// Copyright (C) 2017-2019 Brainbean Apps OU (https://brainbeanapps.com).
// License AGPL-3.0 or later (https://www.gnu.org/licenses/agpl).

export interface CounterOptions {
  counter: (data: any, count: (...args: any[]) => void) => void
  logger: (...args: any[]) => void
  prefixComponents: string[]
  suffixComponents: string[]
  thresholds: number[]
  abortOnError: boolean
}
