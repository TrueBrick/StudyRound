declare module 'ws' {
  import { Server as HttpServer } from 'http';
  import { EventEmitter } from 'events';

  export class WebSocket extends EventEmitter {
    static OPEN: number;
    static CLOSED: number;
    readyState: number;
    OPEN: number;
    CLOSED: number;
    send(data: any, cb?: (err?: Error) => void): void;
    close(code?: number, data?: string): void;
  }

  export interface ServerOptions {
    server?: HttpServer;
    port?: number;
    path?: string;
  }

  export class WebSocketServer extends EventEmitter {
    constructor(options?: ServerOptions);
    close(cb?: (err?: Error) => void): void;
  }
}
