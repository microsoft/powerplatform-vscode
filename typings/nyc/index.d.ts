declare module 'nyc' {
    export default class NYC {
      createTempDirectory(): Promise<void>
      writeCoverageFile(): Promise<void>
    }
  }