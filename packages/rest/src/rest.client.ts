import type {
	EndpointDefinitions,
	EndpointIdentifier,
	EndpointOptions,
	EndpointRequest,
	EndpointResponse,
	RestClient,
} from "@/global.types";
import type {
	Client,
	RequestBody,
	RequestHeaders,
	RequestParameter,
	RequestParameters,
	Response,
	ResponseHeaders,
} from "@diba1013/fetch";

export class BasicRestClient<Endpoints extends EndpointDefinitions> implements RestClient<Endpoints> {
	private readonly $fetch: Client;
	private readonly $endpoints: Endpoints;

	constructor({ endpoints, fetch }: { endpoints: Endpoints; fetch: Client }) {
		this.$endpoints = endpoints;
		this.$fetch = fetch;
	}

	private async prepare<ID extends EndpointIdentifier<Endpoints>>(id: ID, request?: EndpointRequest<Endpoints, ID>) {
		const {
			params: keys = [],
			request: config = {
				type: "",
			},
		} = this.$endpoints[id];

		const headers: RequestHeaders = {};
		const parameters: RequestParameters = {};
		const body: RequestBody = {};

		// TODO refactor to strategy pattern
		if (config.type === "application/json" && request !== undefined) {
			headers["content-type"] = config.type;

			// This is fine since endpoints using generic any
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			const validated = await config.schema.parseAsync(request);
			const typed = validated as EndpointRequest<Endpoints, ID>;

			for (const [key, value] of Object.entries(typed)) {
				if (keys.includes(key)) {
					parameters[key] = value as RequestParameter;
				} else {
					body[key] = value as RequestBody;
				}
			}
		}

		return {
			headers,
			parameters,
			body,
		};
	}

	private async process<ID extends EndpointIdentifier<Endpoints>>(
		id: ID,
		{ ["content-type"]: contentType }: ResponseHeaders,
		response: Response,
	) {
		const { response: config = { type: "" } } = this.$endpoints[id];

		// TODO should this be lenient (configurable) and fallback to json, what about charset?
		if (config.type !== contentType) {
			throw new Error(
				`Failed to process request '${String(id)}' due to incompatible content '${
					config.type
				}' vs '${contentType}'`,
			);
		}

		// TODO refactor to strategy pattern
		if (config.type === "application/json") {
			// This is fine since endpoints using generic any
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			const validated = await config.schema.parseAsync(await response.json());
			const typed = validated as EndpointResponse<Endpoints, ID>;
			return typed;
		}

		if (config.type === "text/plain") {
			const validated = await response.text();
			// TODO can this be enforced on endpoint level?
			const typed = validated as unknown as EndpointResponse<Endpoints, ID>;
			return typed;
		}

		throw new Error(`Failed to process request '${String(id)}' due to unknown type '${config.type}'`);
	}

	async execute<ID extends EndpointIdentifier<Endpoints>>(
		id: ID,
		options: EndpointOptions<Endpoints, ID> = {},
	): Promise<EndpointResponse<Endpoints, ID>> {
		const { method, path } = this.$endpoints[id];

		const { headers, parameters, body } = await this.prepare(id, options.request);
		const {
			ok,
			headers: responseHeaders,
			response,
			status,
		} = await this.$fetch.execute({
			method,
			headers: {
				...headers,
				...options.headers,
			},
			path,
			parameters,
			body: method === "get" || method === "head" || method === "options" ? undefined : body,
			credentials: options.credentials,
		});

		if (ok) {
			return await this.process(id, responseHeaders, response);
		}

		throw new Error(`Failed to execute request '${String(id)}' (${status.code})`, {
			cause: new Error(status.text),
		});
	}
}
