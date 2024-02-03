export class MessageEvent extends Event {
  constructor(public readonly message: string) {
    super("message");
  }
}
