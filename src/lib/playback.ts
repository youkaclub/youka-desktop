import { Video } from "./video";
import EventEmitter from "eventemitter3";

type Event =
  | ["nowPlayingChanged", (nowPlaying: Video) => void]
  | ["queueChanged", (queue: Video[]) => void];

// Increment this number whenever state save is changed in a way that is not
// backwards compatible, to clear any old values that have been persisted
const currentStateSaveVersion = 1;

export class Playback {
  private events: EventEmitter;
  private nowPlaying?: Video;
  private playbackFinished: boolean;
  private queue: Video[];

  constructor() {
    this.events = new EventEmitter();
    this.queue = [];
    this.playbackFinished = false;
    this.loadState();
  }

  // accessors

  public async getNowPlaying(): Promise<Video | undefined> {
    return this.nowPlaying;
  }

  public async getQueue(): Promise<Video[]> {
    return this.queue;
  }

  // events

  public on(...[name, handler]: Event) {
    this.events.on(name, handler);
  }

  public off(...[name, handler]: Event) {
    this.events.off(name, handler);
  }

  // methods

  public async enqueueVideo(video: Video): Promise<void> {
    if (this.videoIsQueued(video.id)) {
      return;
    }

    if (this.nowPlaying && !this.playbackFinished) {
      this.queue = [...this.queue, video];
      this.sendQueue();
    } else {
      this.nowPlaying = video;
      this.sendNowPlaying();
      this.playbackFinished = false;
    }
    this.saveState();
  }

  public async finishPlayback(videoId: string): Promise<void> {
    if (this.nowPlaying?.id !== videoId) return;

    if (this.queue.length > 0) {
      this.nowPlaying = this.queue[0];
      this.queue = this.queue.slice(1);
      this.sendNowPlaying();
      this.sendQueue();
    } else {
      this.playbackFinished = true;
    }
    this.saveState();
  }

  public async skipToQueuedVideo(videoId: string): Promise<void> {
    const queueIndex = this.queue.findIndex((item) => item.id === videoId);
    if (queueIndex >= 0) {
      const newQueue = this.queue.slice();
      const [queueVideo] = newQueue.splice(queueIndex, 1);
      this.nowPlaying = queueVideo;
      this.queue = newQueue;
      this.playbackFinished = false;
      this.sendNowPlaying();
      this.sendQueue();
      this.saveState();
    }
  }

  // private

  private videoIsQueued(id: string) {
    return this.nowPlaying?.id === id || this.queue.some((x) => x.id === id);
  }

  private sendNowPlaying() {
    this.events.emit("nowPlayingChanged", this.nowPlaying);
  }

  private sendQueue() {
    this.events.emit("queueChanged", this.queue);
  }

  private saveState() {
    localStorage.setItem(
      "playbackState",
      JSON.stringify({
        version: currentStateSaveVersion,
        nowPlaying: this.nowPlaying,
        playbackFinished: this.playbackFinished,
        queue: this.queue,
      })
    );
  }

  private loadState() {
    const json = localStorage.getItem("playbackState");
    if (!json) return;
    const state = JSON.parse(json);
    if (state.version !== currentStateSaveVersion) return;
    this.nowPlaying = state.nowPlaying;
    this.playbackFinished = state.playbackFinished;
    this.queue = state.queue;
  }
}
