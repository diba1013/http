import type { ServiceEndpoint, ServiceRequestBody, ServiceResponseBody } from "@/global.types";
import { Router } from "@/route";
import { type TemplatedApp, App as createApp, us_socket_local_port } from "uWebSockets.js";

export type ServerlessOptions = {
	port?: number;
};

// Inspired by https://github.com/ionited/fiber
export class Server {
	private readonly $app: TemplatedApp = createApp();
	private readonly $router = new Router();

	private readonly $options: ServerlessOptions;

	constructor(options: ServerlessOptions = {}) {
		this.$options = options;
	}

	public use<Request extends ServiceRequestBody, Response extends ServiceResponseBody>({
		path,
		method = "any",
		handler,
	}: ServiceEndpoint<Request, Response>) {
		const wrapped = new Set(typeof method === "string" ? [method] : method);

		this.$app.any(path, async (response, request) => {
			const context = await this.$router.retrieve<Request>(request, response);
			if (context.signal.aborted) {
				return;
			}
			// TODO this fails if there are separate handlers registered for this route
			if (!wrapped.has(context.method) && !wrapped.has("any")) {
				this.$router.send(response, {
					code: 405,
					headers: {
						allow: [...wrapped].join(", "),
					},
					body: {
						error: `Request method '${context.method}' is not supported`,
					},
				});
				return;
			}

			try {
				const result = await handler(context);
				if (context.signal.aborted) {
					return;
				}
				this.$router.send(response, result);
			} catch {
				// TODO we might want to introduce proper error handling here?
				if (context.signal.aborted) {
					return;
				}
				this.$router.send(response, {
					code: 500,
				});
			}
		});
	}

	public serve({ port = this.$options.port ?? 0 }: ServerlessOptions) {
		this.$app.listen(port, (token) => {
			if (token) {
				console.info(`[SRV] Server running on ${us_socket_local_port(token)}`);
			} else {
				console.log(`[SRV] Server failed to listen on ${port}`);
			}
		});
	}
}
