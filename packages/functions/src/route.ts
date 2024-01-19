import type {
	ServiceEndpointContext,
	ServiceEndpointResponse,
	ServiceRequestBody,
	ServiceRequestHeaders,
	ServiceRequestMethod,
	ServiceResponseBody,
} from "@/global.types";
import type { HttpRequest, HttpResponse } from "uWebSockets.js";
import { RoutePath } from "@/path";
import { STATUS_CODES } from "node:http";

export class Route {
	public readonly $path: RoutePath;

	constructor(pattern: string) {
		this.$path = new RoutePath(pattern);
	}

	private pluck<Request extends ServiceRequestBody>(
		request: HttpRequest,
		signal: AbortSignal,
	): ServiceEndpointContext<Partial<Request>> {
		const headers: ServiceRequestHeaders = {};
		// There is no alternative iteration method for headers available
		// eslint-disable-next-line unicorn/no-array-for-each
		request.forEach((key, value) => {
			headers[key] = value;
		});

		const method = request.getMethod() as ServiceRequestMethod;
		const { url, context } = this.$path.pluck(request, headers);

		return {
			method,
			url,
			headers,
			// This is most likely not a full object
			context: context as Partial<Request>,
			signal,
		};
	}

	private readContent(response: HttpResponse, signal: AbortSignal): Promise<string> {
		// TODO investigate memory leak if request is aborted while body is read
		return new Promise((resolve, reject) => {
			const listener = () => {
				reject(signal.reason);
			};

			// If the signal is already aborted, immediately cancel reading.
			if (signal.aborted) {
				listener();
				return;
			}

			signal.addEventListener("abort", listener, {
				once: true,
			});

			let buffer: Buffer = Buffer.from("");
			response.onData((chunk, isLast) => {
				// Do not further process this chunk (if this is even called)
				if (signal.aborted) {
					return;
				}

				// buffer = Buffer.concat([buffer, chunk])
				buffer = Buffer.concat([buffer, Buffer.from(chunk)]);
				if (isLast) {
					signal.removeEventListener("abort", listener);
					resolve(buffer.toString());
				}
			});
		});
	}

	private processBody<Request extends ServiceRequestBody>(
		body: string,
		{ ["content-type"]: type }: ServiceRequestHeaders,
	): Partial<Request> {
		switch (type) {
			case "application/json": {
				// This is most likely fine
				// eslint-disable-next-line @typescript-eslint/no-unsafe-return
				return JSON.parse(body);
			}
			default: {
				return {};
			}
		}
	}

	private async parseBody<Request extends ServiceRequestBody>(
		response: HttpResponse,
		{ headers, signal }: ServiceEndpointContext<Partial<Request>>,
	): Promise<Partial<Request>> {
		try {
			// This cannot throw, so we do not need a catch here
			const body = await this.readContent(response, signal);
			// This might throw if the format is unexpected
			return this.processBody<Request>(body, headers);
		} catch {
			// TODO we might want to introduce proper error handling here?
			return {};
		}
	}

	public async retrieve<Request extends ServiceRequestBody>(
		request: HttpRequest,
		response: HttpResponse,
	): Promise<ServiceEndpointContext<Request>> {
		const controller = new AbortController();
		// Notify request to abort if applicable, before anything is processed
		response.onAborted(() => {
			controller.abort();
		});

		// We must process header before any async work
		const context = this.pluck<Request>(request, controller.signal);
		// Parse body after request has been processed
		const body = await this.parseBody(response, context);

		return {
			url: context.url,
			method: context.method,
			headers: context.headers,
			// We might be missing a few properties, but that needs to be validated by the handler
			context: Object.assign({} as Request, context.context, body),
			signal: context.signal,
		};
	}

	public send<Response extends ServiceResponseBody>(
		response: HttpResponse,
		{ code = 200, headers = {}, body }: ServiceEndpointResponse<Response> = {},
	) {
		response.cork(() => {
			response.writeStatus(`${code} ${STATUS_CODES[code]}`);

			for (const [header, value] of Object.entries(headers)) {
				// TODO is this sensible?
				response.writeHeader(header, typeof value === "string" ? value : value.join(", "));
			}

			switch (true) {
				case typeof body === "string": {
					if (headers["content-type"] === undefined) {
						response.writeHeader("content-type", "text/plain");
					}
					response.end(body);
					break;
				}
				case typeof body === "object": {
					if (headers["content-type"] === undefined) {
						response.writeHeader("content-type", "application/json");
					}
					response.end(JSON.stringify(body));
					break;
				}
				default: {
					response.end();
				}
			}
		});
	}
}
