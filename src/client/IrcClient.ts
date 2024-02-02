import { IrcUrlProperties } from "../models/IrcUrlProperties";
import { connect } from 'cloudflare:sockets';

export class IrcClient {
  private readonly address: string;
  private socket?: Socket;
  private writer?: WritableStreamDefaultWriter;
  private reader?: ReadableStreamDefaultReader;

  constructor(urlOrUrlProperties: string | IrcUrlProperties, private readonly secure?: boolean) {
    this.address = (typeof urlOrUrlProperties === "string")?(urlOrUrlProperties):(IrcClient.getUrlFromProperties(urlOrUrlProperties));
    
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

  private static getUrlFromProperties({ host, port = 6667, channel, channelKeyword }: IrcUrlProperties) {
    let url = `${host}:${port}`;

    if(channel) {
      url += `:${channel}`;

      if(channelKeyword) {
        url += `?${channelKeyword}`;
      }
    }

    return url;
  }
}