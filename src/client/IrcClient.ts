import { connect } from 'cloudflare:sockets';
import { MessageEvent } from '../index';

export class IrcClient extends EventTarget {
  private readonly address: string;
  private socket?: Socket;
  private writer?: WritableStreamDefaultWriter;
  private reader?: ReadableStreamDefaultReader;

  constructor(host: string, port = 6667, private readonly secure?: boolean) {
    super();

    this.address = `${host}:${port}`;
  }

  public async connect(nickname: string): Promise<void> {
    return new Promise((resolve, reject) => {
      console.debug("Connecting to IRC address", { address: this.address });

      this.socket = connect(this.address, {
        secureTransport: "starttls",
        allowHalfOpen: true
      });

      if (this.secure) {
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

        this.user(nickname, 0, '*', nickname);
        this.nick(nickname);

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

      this.dispatchEvent(new MessageEvent(message));

      if (!done) {
        this.read();
      }
    });
  }

  public async nick(nickname: string) {
    await this.sendMessage(`NICK ${nickname}`);
  }

  public async user(username: string, mode: number, unused: string, realname: string) {
    await this.sendMessage(`USER ${username} ${mode} ${unused} :${realname}`);
  }

  // because I am lazy, the following mappings where done using generative AI
  // there's a chance that some of them are nothing but made up garbage. bite me
  public async pass(password: string) {
    await this.sendMessage(`PASS ${password}`);
  }

  public async oper(name: string, password: string) {
    await this.sendMessage(`OPER ${name} ${password}`);
  }

  public async mode(target: string, mode: string, params?: string) {
    await this.sendMessage(`MODE ${target} ${mode}${params ? ` ${params}` : ''}`);
  }

  public async service(nickname: string, reserved: string, distribution: string, type: string, reserved2: string, info: string) {
    await this.sendMessage(`SERVICE ${nickname} ${reserved} ${distribution} ${type} ${reserved2} ${info}`);
  }

  public async quit(message?: string) {
    await this.sendMessage(`QUIT${message ? ` :${message}` : ''}`);
  }

  // Channel Operations
  public async join(channels: string, keys?: string) {
    await this.sendMessage(`JOIN ${channels}${keys ? ` ${keys}` : ''}`);
  }

  public async part(channels: string, message?: string) {
    await this.sendMessage(`PART ${channels}${message ? ` :${message}` : ''}`);
  }

  public async channelMode(channel: string, mode: string, params?: string) {
    await this.sendMessage(`MODE ${channel} ${mode}${params ? ` ${params}` : ''}`);
  }

  public async topic(channel: string, newTopic?: string) {
    await this.sendMessage(`TOPIC ${channel}${newTopic ? ` :${newTopic}` : ''}`);
  }

  public async names(channels?: string) {
    await this.sendMessage(`NAMES${channels ? ` ${channels}` : ''}`);
  }

  public async list(channels?: string, server?: string) {
    await this.sendMessage(`LIST${channels ? ` ${channels}` : ''}${server ? ` ${server}` : ''}`);
  }

  public async invite(nickname: string, channel: string) {
    await this.sendMessage(`INVITE ${nickname} ${channel}`);
  }

  public async kick(channel: string, user: string, comment?: string) {
    await this.sendMessage(`KICK ${channel} ${user}${comment ? ` :${comment}` : ''}`);
  }

  // Sending Messages
  public async privmsg(target: string, message: string) {
    await this.sendMessage(`PRIVMSG ${target} :${message}`);
  }

  public async notice(target: string, message: string) {
    await this.sendMessage(`NOTICE ${target} :${message}`);
  }

  // Server Queries and Commands
  public async motd(target?: string) {
    await this.sendMessage(`MOTD${target ? ` ${target}` : ''}`);
  }

  public async lusers(mask?: string, server?: string) {
    await this.sendMessage(`LUSERS${mask ? ` ${mask}` : ''}${server ? ` ${server}` : ''}`);
  }

  public async version(target?: string) {
    await this.sendMessage(`VERSION${target ? ` ${target}` : ''}`);
  }

  public async stats(query: string, target?: string) {
    await this.sendMessage(`STATS ${query}${target ? ` ${target}` : ''}`);
  }

  public async links(remoteServer?: string, serverMask?: string) {
    await this.sendMessage(`LINKS${remoteServer ? ` ${remoteServer}` : ''}${serverMask ? ` ${serverMask}` : ''}`);
  }

  public async time(target?: string) {
    await this.sendMessage(`TIME${target ? ` ${target}` : ''}`);
  }

  public async trace(target?: string) {
    await this.sendMessage(`TRACE${target ? ` ${target}` : ''}`);
  }

  public async admin(target?: string) {
    await this.sendMessage(`ADMIN${target ? ` ${target}` : ''}`);
  }

  public async info(target?: string) {
    await this.sendMessage(`INFO${target ? ` ${target}` : ''}`);
  }

  // Service Query and Commands
  public async servlist(mask?: string, type?: string) {
    await this.sendMessage(`SERVLIST${mask ? ` ${mask}` : ''}${type ? ` ${type}` : ''}`);
  }

  public async squery(servicename: string, text: string) {
    await this.sendMessage(`SQUERY ${servicename} :${text}`);
  }

  // User based queries
  public async who(name: string, o: string) {
    await this.sendMessage(`WHO ${name}${o ? ` ${o}` : ''}`);
  }

  public async whois(target: string, mask: string) {
    await this.sendMessage(`WHOIS ${target} ${mask}`);
  }

  public async whowas(nickname: string, count?: number, target?: string) {
    await this.sendMessage(`WHOWAS ${nickname}${count ? ` ${count}` : ''}${target ? ` ${target}` : ''}`);
  }

  // Miscellaneous Commands
  public async ping(server1: string, server2?: string) {
    await this.sendMessage(`PING ${server1}${server2 ? ` ${server2}` : ''}`);
  }

  public async pong(server: string, server2?: string) {
    await this.sendMessage(`PONG ${server}${server2 ? ` ${server2}` : ''}`);
  }

  public async away(message?: string) {
    await this.sendMessage(`AWAY${message ? ` :${message}` : ''}`);
  }

  public async rehash() {
    await this.sendMessage(`REHASH`);
  }

  public async die() {
    await this.sendMessage(`DIE`);
  }

  public async restart() {
    await this.sendMessage(`RESTART`);
  }

  public async summon(user: string, target?: string, channel?: string) {
    await this.sendMessage(`SUMMON ${user}${target ? ` ${target}` : ''}${channel ? ` :${channel}` : ''}`);
  }

  public async users(server?: string) {
    await this.sendMessage(`USERS${server ? ` ${server}` : ''}`);
  }

  public async wallops(text: string) {
    await this.sendMessage(`WALLOPS :${text}`);
  }

  public async userhost(nicknames: string) {
    await this.sendMessage(`USERHOST ${nicknames}`);
  }

  public async ison(nicknames: string) {
    await this.sendMessage(`ISON ${nicknames}`);
  }
}
