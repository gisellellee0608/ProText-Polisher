export enum ProcessingStatus {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export interface PolishResponse {
  originalText: string;
  polishedText: string;
  status: ProcessingStatus;
  errorMessage?: string;
}