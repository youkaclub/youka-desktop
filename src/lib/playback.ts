import { Video } from "./video";
import EventEmitter from "eventemitter3";
import * as library from "./library";
import * as karaoke from "./karaoke";
const amplitude = require("amplitude-js");
const debug = require("debug")("youka:desktop");

type Event =
  | ["nowPlayingChanged", (nowPlaying: Video) => void]
  | ["queueChanged", (queue: Video[]) => void]
  | [
      "processingStatusChanged",
      (processingStatus: ProcessingStatus | undefined) => void
    ];

export interface ProcessingStatus {
  videoId: string;
  statusText: string;
}

export class Playback {
  // Increment this number whenever state save is changed in a way that is not
  // backwards compatible, to clear any old values that have been persisted
  private static currentStateSaveVersion = 1;

  private events: EventEmitter;
  private nowPlaying?: Video;
  private playbackFinished: boolean;
  private queue: Video[];
  private processingStatus?: ProcessingStatus;

  constructor() {
    this.events = new EventEmitter();
    this.queue = [];
    this.playbackFinished = false;
    this.loadState();
    this.processNextVideo();
  }

  // accessors

  public async getNowPlaying(): Promise<Video | undefined> {
    return this.nowPlaying;
  }

  public async getQueue(): Promise<Video[]> {
    return this.queue;
  }

  public async getProcessingStatus(): Promise<ProcessingStatus | undefined> {
    return this.processingStatus;
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
    this.processNextVideo();
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

  private sendProcessingStatus() {
    this.events.emit("processingStatusChanged", this.processingStatus);
  }

  private saveState() {
    localStorage.setItem(
      "playbackState",
      JSON.stringify({
        version: Playback.currentStateSaveVersion,
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
    if (state.version !== Playback.currentStateSaveVersion) return;
    this.nowPlaying = state.nowPlaying;
    this.playbackFinished = state.playbackFinished;
    this.queue = state.queue;
  }

  private async processNextVideo() {
    if (this.processingStatus) return;

    const allVideos = [this.nowPlaying, ...this.queue].filter(
      Boolean
    ) as Video[];
    let nextUnprocessedVideo: Video | undefined = undefined;
    for (const video of allVideos) {
      if (!(await library.isLoaded(video.id))) {
        nextUnprocessedVideo = video;
        break;
      }
    }

    if (nextUnprocessedVideo) {
      const videoId = nextUnprocessedVideo.id;
      try {
        this.processingStatus = {
          videoId,
          statusText: "Initializing",
        };
        this.sendProcessingStatus();
        const start = new Date();
        await karaoke.generate(
          videoId,
          nextUnprocessedVideo.title,
          (statusText) => {
            if (this.processingStatus?.videoId !== videoId) return;

            this.processingStatus = {
              ...this.processingStatus,
              statusText,
            };
            this.sendProcessingStatus();
          }
        );
        const end = new Date();
        const duration = Math.abs((end.getTime() - start.getTime()) / 1000);
        debug("generate time", duration);
        amplitude.getInstance().logEvent("CREATE_KARAOKE", { duration });
      } finally {
        this.processingStatus = undefined;
        this.sendProcessingStatus();
        setTimeout(() => this.processNextVideo(), 1000);
      }
    }
  }
}
