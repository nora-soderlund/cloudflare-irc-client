import { IrcClient, MessageEvent } from "cloudflare-irc-client";

export default {
	/**
	 * Connects to the IRC server with the nick 'nora' and then requests a list of all channels.
	 */
	async fetch(_request: Request, _env: never, context: ExecutionContext): Promise<Response> {
		const client = new IrcClient("efnet.portlane.se", 6666, false);

		// pipe the messages to the response in plain text
    let { readable, writable } = new TransformStream();

		const writer = writable.getWriter();

		client.addEventListener("message", (event: Event) => {
			if(event instanceof MessageEvent) {
				console.debug(event.message);

				writer.write(new TextEncoder().encode(event.message));
			}
		});

		context.waitUntil(client.connect("nora").then(async () => {
			//await client.sendMessage("LIST");
			//await client.sendMessage("JOIN #football");

			await client.list();

			await new Promise((resolve) => setTimeout(resolve, 30000));
		}));

    return new Response(readable);
	},
};
