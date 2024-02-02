export type IrcUrlProperties = {
  host: string;
  secure?: boolean;
  port?: number;
  channel?: string;
  channelKeyword?: string;
};

export type IrcUriScheme = "irc" | "ircs" | "irc6";
