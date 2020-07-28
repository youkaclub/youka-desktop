/// <reference types="react-scripts" />

declare module "libass-wasm" {
  class SubtitlesOctopus {
    constructor(options: any);
    freeTrack(): void;
    setTrack(track: string): void;
  }
  export default SubtitlesOctopus;
}
