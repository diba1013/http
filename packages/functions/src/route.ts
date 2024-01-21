import type {
	ServiceEndpointContext,
	ServiceRequestBody,
	ServiceRequestHeaders,
	ServiceRequestMethod,
	ServiceResponse,
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

			const buffers: Buffer[] = [];
			response.onData((chunk, isLast) => {
				// Do not further process this chunk (if this is even called)
				if (signal.aborted) {
					return;
				}
				buffers.push(Buffer.from(chunk));

				// buffer = Buffer.concat([buffer, chunk])
				if (isLast) {
					signal.removeEventListener("abort", listener);
					const buffer = Buffer.concat(buffers);
					resolve(buffer.toString());
				}
			});
		});
	}

	private processBody<Request extends ServiceRequestBody>(
		body: string,
		{ ["content-type"]: type }: ServiceRequestHeaders,
	): Request {
		switch (type) {
			case "application/json": {
				// This is most likely fine
				// eslint-disable-next-line @typescript-eslint/no-unsafe-return
				return JSON.parse(body);
			}
			default: {
				// This will likely run into validation problems
				return {} as Request;
			}
		}
	}

	private async parseBody<Request extends ServiceRequestBody>(
		response: HttpResponse,
		headers: ServiceRequestHeaders,
		signal: AbortSignal,
	): Promise<Request> {
		try {
			// This cannot throw, so we do not need a catch here
			const body = await this.readContent(response, signal);
			// This might throw if the format is unexpected
			return this.processBody<Request>(body, headers);
		} catch {
			// TODO we might want to introduce proper error handling here?
			// This will likely run into validation problems
			return {} as Request;
		}
	}

	public retrieve<Request extends ServiceRequestBody>(
		request: HttpRequest,
		response: HttpResponse,
	): ServiceEndpointContext<Request> {
		const controller = new AbortController();
		// Notify request to abort if applicable, before anything is processed
		response.onAborted(() => {
			controller.abort();
		});

		const headers: ServiceRequestHeaders = {};
		// There is no alternative iteration method for headers available
		// eslint-disable-next-line unicorn/no-array-for-each
		request.forEach((key, value) => {
			headers[key] = value;
		});

		const parameters = this.$path.pluck(request);

		return {
			method: request.getMethod() as ServiceRequestMethod,
			path: request.getUrl(),
			headers,
			// This is most likely not a full object
			context: {
				query: () => {
					return parameters.query();
				},

				params: () => {
					return parameters.params();
				},

				body: async () => {
					return await this.parseBody(response, headers, controller.signal);
				},

				async json() {
					return Object.assign({}, parameters.all(), await this.body());
				},
			},
			signal: controller.signal,
		};
	}

	public send<Response extends ServiceResponseBody>(
		response: HttpResponse,
		{ code = 200, headers = {}, body }: ServiceResponse<Response> = {},
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
