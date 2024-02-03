# cloudflare-irc-client
A quick thrown together IRC client using the TCP Sockets API, suitable for Cloudflare Workers.

```
npm i cloudflare-irc-client
```

```ts
import { IrcClient } from "cloudflare-irc-client";
import { MessageEvent } from "cloudflare-irc-client";

const client = new IrcClient("efnet.portlane.se", 6666, false);

client.addEventListener("message", (event: Event) => {
  if(event instanceof MessageEvent) {
    console.debug(event.message);
  }
});

await client.connect("nora");

await client.list();
```
