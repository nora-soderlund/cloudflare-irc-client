import { IrcUrlProperties } from "../models/IrcUrlProperties";
import { connect } from 'cloudflare:sockets';

export class IrcClient {
  private readonly address: string;
  private socket?: Socket;
  private writer?: WritableStreamDefaultWriter;
  private reader?: ReadableStreamDefaultReader;

  constructor(host: string, port = 6667, private readonly secure?: boolean) {
    this.address = `${host}:${port}`;
  }

  public async connect(nickname: string): Promise<void> {
    return new Promise((resolve, reject) => {
      console.debug("Connecting to IRC address", { address: this.address });

      this.socket = connect(this.address, {
        secureTransport: "starttls",
        allowHalfOpen: true
      });

      if(this.secure) {
        console.debug("Starting TLS");
  
        this.socket = this.socket.startTls({
          expectedServerHostname: this.address
        });
      }
  
      this.socket.opened.then(() => {
        console.debug("Connection opened");
      
        this.writer = this.socket!.writable.getWriter();  
        this.reader = this.socket!.readable.getReader();
        this.read();

        this.sendMessage(`USER ${nickname} 0 * :${nickname}`);
        this.sendMessage(`NICK ${nickname}`);

        resolve();
      }, reject);
    });
  }

  public async sendMessage(message: string) {
    await this.writer?.write(new TextEncoder().encode(`${message}\r\n`));
  }

  private read() {
    this.reader?.read().then(({ done, value }) => {
      const message = new TextDecoder().decode(value);

      console.info(message);
  
      if(!done) {
        this.read();
      }
    });
  }
}