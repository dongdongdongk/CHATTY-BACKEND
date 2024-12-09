import { Server, Socket } from 'socket.io';

export let soketIOPostObject: Server;

export class SocketIOPostHandler {
  private io: Server;

  constructor(io: Server) {
    this.io = io;
    soketIOPostObject = io;
  }

  public listen(): void {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    this.io.on('connection',(socket: Socket) => {
      console.log('Post soketio handler');
    });
  }
}
