export interface CounterOptions {
  counter: (data: any, count: (...args: any[]) => void) => void
  logger: (...args: any[]) => void
  prefixComponents: string[]
  suffixComponents: string[]
  thresholds: number[]
  abortOnError: boolean
}
