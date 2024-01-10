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
	RequestMethod,
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

	private async prepare<ID extends EndpointIdentifier<Endpoints>>(
		id: ID,
		method: RequestMethod,
		request?: EndpointRequest<Endpoints, ID>,
	) {
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
			// This is fine since endpoints using generic any
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			const validated = await config.schema.parseAsync(request);
			const typed = validated as EndpointRequest<Endpoints, ID>;

			for (const [key, value] of Object.entries(typed)) {
				if (method === "get" || method === "head" || method === "options" || keys.includes(key)) {
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
		{ ["content-type"]: rawContentType }: ResponseHeaders,
		response: Response,
	) {
		const { response: config = { type: "" } } = this.$endpoints[id];

		// TODO should this be lenient (configurable) and fallback to json
		const [contentType] = rawContentType.split(";");
		if (config.type !== contentType) {
			throw new Error(
				`Failed to process request '${String(id)}' due to incompatible content '${
					config.type
				}' vs '${contentType}'`,
			);
		}

		// TODO refactor to strategy pattern
		if (config.type === "application/json") {
			const content = await response.json();
			// Since any is used in the schema definitions, we need to disable it here
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			const validated = await config.schema.parseAsync(content);
			const typed = validated as EndpointResponse<Endpoints, ID>;
			return typed;
		}

		if (config.type === "text/plain") {
			const content = await response.text();
			// Since any is used in the schema definitions, we need to disable it here
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			const validated = (await config.schema?.parseAsync(content)) ?? content;
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

		const { headers, parameters, body } = await this.prepare(id, method, options.request);
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
			signal: options.signal,
		});

		if (ok) {
			return await this.process(id, responseHeaders, response);
		}

		// TODO introduce special error here to have access to properties
		throw new Error(`Failed to execute request '${String(id)}' (${status.code})`, {
			cause: new Error(status.text),
		});
	}
}
