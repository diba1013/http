import { Request as FetchRequest, RequestExecutor, ResponseConfig, ResponseHeaders } from "@/global.types";

export type FetchAdapter = {
	fetch(input: string, init?: RequestInit): Promise<Response>;
};

export class ConvertingRequestExecutor implements RequestExecutor {
	private readonly $adapter: FetchAdapter;

	constructor(adapter: FetchAdapter) {
		this.$adapter = adapter;
	}

	async send<T>(request: FetchRequest<T>): Promise<ResponseConfig> {
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

	convert<T>(request: FetchRequest<T>): RequestInit {
		const { method, headers, body } = request;

		return {
			method,
			headers,
			body: this.encode(body),
		};
	}

	encode<T>(body: T | undefined): BodyInit | undefined {
		if (body === undefined) {
			return undefined;
		}
		if (typeof body === "string") {
			return body;
		}
		return JSON.stringify(body);
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
