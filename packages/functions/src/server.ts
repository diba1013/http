import type { ServiceEndpoint, ServiceEndpointHandler, ServiceRequestBody, ServiceResponseBody } from "@/global.types";
import { Route } from "@/route";
import { type TemplatedApp, App as createApp, us_socket_local_port } from "uWebSockets.js";

export type ServerlessOptions = {
	port?: number;
};

/**
 * This creates a
 */
export class Server {
	private readonly $app: TemplatedApp = createApp();

	private readonly $options: ServerlessOptions;

	constructor(options: ServerlessOptions = {}) {
		this.$options = options;
	}

	/**
	 * Registers an OPTIONS route within the current context.
	 *
	 * @param path The path with parameters to register
	 * @param handler The handler to execute
	 */
	public options<Request extends ServiceRequestBody, Response extends ServiceResponseBody = ServiceResponseBody>(
		path: string,
		handler: ServiceEndpointHandler<Request, Response>,
	) {
		this.with({
			method: "options",
			path,
			handler,
		});
	}

	/**
	 * Registers an HEAD route within the current context.
	 *
	 * @param path The path with parameters to register
	 * @param handler The handler to execute
	 */
	public head<Request extends ServiceRequestBody, Response extends ServiceResponseBody = ServiceResponseBody>(
		path: string,
		handler: ServiceEndpointHandler<Request, Response>,
	) {
		this.with({
			method: "head",
			path,
			handler,
		});
	}

	/**
	 * Registers an GET route within the current context.
	 *
	 * @param path The path with parameters to register
	 * @param handler The handler to execute
	 */
	public get<Request extends ServiceRequestBody, Response extends ServiceResponseBody = ServiceResponseBody>(
		path: string,
		handler: ServiceEndpointHandler<Request, Response>,
	) {
		this.with({
			method: "get",
			path,
			handler,
		});
	}

	/**
	 * Registers an POST route within the current context.
	 *
	 * @param path The path with parameters to register
	 * @param handler The handler to execute
	 */
	public post<Request extends ServiceRequestBody, Response extends ServiceResponseBody = ServiceResponseBody>(
		path: string,
		handler: ServiceEndpointHandler<Request, Response>,
	) {
		this.with({
			method: "post",
			path,
			handler,
		});
	}

	/**
	 * Registers an PUT route within the current context.
	 *
	 * @param path The path with parameters to register
	 * @param handler The handler to execute
	 */
	public put<Request extends ServiceRequestBody, Response extends ServiceResponseBody = ServiceResponseBody>(
		path: string,
		handler: ServiceEndpointHandler<Request, Response>,
	) {
		this.with({
			method: "put",
			path,
			handler,
		});
	}

	/**
	 * Registers an PATH route within the current context.
	 *
	 * @param path The path with parameters to register
	 * @param handler The handler to execute
	 */
	public patch<Request extends ServiceRequestBody, Response extends ServiceResponseBody = ServiceResponseBody>(
		path: string,
		handler: ServiceEndpointHandler<Request, Response>,
	) {
		this.with({
			method: "patch",
			path,
			handler,
		});
	}

	/**
	 * Registers an DELETE route within the current context.
	 *
	 * @param path The path with parameters to register
	 * @param handler The handler to execute
	 */
	public delete<Request extends ServiceRequestBody, Response extends ServiceResponseBody = ServiceResponseBody>(
		path: string,
		handler: ServiceEndpointHandler<Request, Response>,
	) {
		this.with({
			method: "delete",
			path,
			handler,
		});
	}

	/**
	 * Registers an route within the current context.
	 *
	 * @param path The path with parameters to register
	 * @param handler The handler to execute
	 */
	public any<Request extends ServiceRequestBody, Response extends ServiceResponseBody = ServiceResponseBody>(
		path: string,
		handler: ServiceEndpointHandler<Request, Response>,
	) {
		this.with({
			method: "any",
			path,
			handler,
		});
	}

	/**
	 * Allows to register a route served by a single handler.
	 *
	 * The request is handled in the following cases:
	 * 1. The handler is only called if the provided methods match, otherwise a 405 is returned with the respective available methods.
	 * 1. If the request is aborted by the client during processing, the respective signal is aborted and no response is returned.
	 * 1. If the handler succeeds, a respective response with applicable status, headers and body is returned, independent of the actual status code.
	 * 1. If the handler throws an error, the response will contain a generic 500 as the handler should enrich error messages.
	 *
	 * @param options The endpoint options to include
	 */
	public with<Request extends ServiceRequestBody, Response extends ServiceResponseBody = ServiceResponseBody>({
		path,
		method = "any",
		handler,
	}: ServiceEndpoint<Request, Response>) {
		const route = new Route(path);

		const wrapped = new Set(typeof method === "string" ? [method] : method);

		this.$app.any(path, async (response, request) => {
			const context = route.retrieve<Request>(request, response);
			// Just checking that we still can use the response object
			if (context.signal.aborted) {
				return;
			}
			// TODO this fails if there are separate handlers registered for this route
			if (!wrapped.has(context.method) && !wrapped.has("any")) {
				route.send(response, {
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
				route.send(response, result ?? {});
			} catch {
				// TODO we might want to introduce proper error handling here?
				if (context.signal.aborted) {
					return;
				}
				route.send(response, {
					code: 500,
				});
			}
		});
	}

	/**
	 * Listens on the respective port until terminated.
	 *
	 * @param options The options to include
	 */
	public listen({ port = this.$options.port ?? 0 }: ServerlessOptions) {
		this.$app.listen(port, (token) => {
			if (token) {
				console.info(`[SRV] Server running on ${us_socket_local_port(token)}`);
			} else {
				console.log(`[SRV] Server failed to listen on ${port}`);
			}
		});
	}
}
