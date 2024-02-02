import { IrcClient } from "../../src";

export interface Env {
	// Example binding to Durable Object. Learn more at https://developers.cloudflare.com/workers/runtime-apis/durable-objects/
	// MY_DURABLE_OBJECT: DurableObjectNamespace;
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const client = new IrcClient({
			host: "efnet.portlane.se",
			port: 6666
		}, false);

		await client.connect("nora");

		//await client.sendMessage("LIST");
		await client.sendMessage("JOIN #football");

		await new Promise((resolve) => setTimeout(resolve, 30000));

		return new Response('Hello World!');
	},
};
