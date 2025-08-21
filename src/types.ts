export enum Status {
  Idle = 'Idle',
  Uploading = 'Uploading',
  ProcessingFile = 'Processing File',
  Running = 'Running',
  WaitingToRetry = 'Waiting to Retry',
  Paused = 'Paused',
  Stopped = 'Stopped',
  Finished = 'Finished',
  Error = 'Error',
}

export interface TraceLog {
  timestamp: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
}
