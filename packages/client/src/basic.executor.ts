import {
	Request as FetchRequest,
	RequestBody,
	RequestExecutor,
	RequestHeaders,
	ResponseConfig,
	ResponseHeaders,
} from "@/global.types";

export type FetchAdapter = {
	fetch(input: string, init?: RequestInit): Promise<Response>;
};

export class ConvertingRequestExecutor implements RequestExecutor {
	private readonly $adapter: FetchAdapter;

	constructor(adapter: FetchAdapter) {
		this.$adapter = adapter;
	}

	async execute<Body extends RequestBody>(request: FetchRequest<Body>): Promise<ResponseConfig> {
		const init = this.convert(request);
		const response = await this.$adapter.fetch(request.url, init);

		return {
			ok: response.ok,
			headers: this.unwrap(response.headers),
			status: {
				code: response.status,
				text: response.statusText,
			},
			response,
		};
	}

	convert<T extends RequestBody>(request: FetchRequest<T>): RequestInit {
		const { method, headers, body, signal } = request;

		return {
			method,
			credentials: "include",
			headers: this.wrap(headers),
			body: this.encode(body),
			signal,
		};
	}

	encode<T extends RequestBody>(body: T | undefined): BodyInit | undefined {
		if (body === undefined) {
			return undefined;
		}
		if (typeof body === "string") {
			return body;
		}
		return JSON.stringify(body);
	}

	wrap(headers: RequestHeaders): HeadersInit {
		const h: ResponseHeaders = {};

		for (const [key, value] of Object.entries(headers)) {
			if (value !== undefined) {
				h[key] = value;
			}
		}

		return h;
	}

	unwrap(headers: Headers): ResponseHeaders {
		const h: ResponseHeaders = {};

		// eslint-disable-next-line unicorn/no-array-for-each
		headers.forEach((value: string, key: string) => {
			h[key] = value;
		});

		return h;
	}
}
