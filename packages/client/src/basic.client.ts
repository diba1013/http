import {
	Client,
	Credentials,
	RequestBody,
	RequestConfig,
	CredentialSecurity,
	BearerCredentials,
	ResponseConfig,
	RequestExecutor,
	RequestHeaders,
	RequestParameters,
} from "@/global.types";
import { CredentialsEncoder } from "@/client.types";
import { url as concatenate } from "@/util";

export type BasicClientProperties = {
	executor: RequestExecutor;
	encoder: CredentialsEncoder;
	config?: RequestConfig;
};

export class BasicClient implements Client {
	private readonly executor: RequestExecutor;
	private readonly encoder: CredentialsEncoder;

	private readonly config: RequestConfig;

	constructor({ executor, encoder, config = {} }: BasicClientProperties) {
		this.executor = executor;
		this.encoder = encoder;
		this.config = config;
	}

	async execute<Parameters extends RequestParameters = RequestParameters, Body extends RequestBody = RequestBody>({
		method = "get",
		url = this.config.url,
		path = "/",
		headers = {},
		credentials = this.config.credentials,
		secure = this.config.secure,
		parameters,
		body,
	}: RequestConfig<Parameters, Body>): Promise<ResponseConfig> {
		return await this.executor.execute<Body>({
			method,
			url: this.join(url, path, parameters),
			headers: this.headers(headers, await this.authorize(this, secure, credentials), body),
			body,
		});
	}

	join(url: string | undefined, path: string, parameters: RequestParameters = {}) {
		const copy = Object.assign({}, this.config.parameters ?? {}, parameters);
		return concatenate(url, path, copy);
	}

	headers(headers: RequestHeaders, credentials?: BearerCredentials, data?: RequestBody): RequestHeaders {
		const copy = Object.assign({}, this.config.headers ?? {}, headers);

		if (copy["content-type"] === undefined && data !== undefined) {
			copy["content-type"] = "application/json";
		}

		if (copy["authorization"] === undefined && credentials !== undefined) {
			copy["authorization"] = `${credentials.type} ${credentials.token}`;
		}

		return copy;
	}

	async authorize(
		client: Client,
		secure: CredentialSecurity = "lenient",
		credentials?: Credentials,
	): Promise<BearerCredentials | undefined> {
		if (secure === "force" && credentials === undefined) {
			// Enforce credentials
			throw new Error(`Credentials has been set to '${secure}' but none have been provided.`);
		}
		if (secure === "none" || credentials === undefined) {
			// Ignore credentials
			return undefined;
		}
		// Re-trigger security check
		const resolved = await this.encoder.resolve(credentials, client);
		if (secure === "force" && resolved === undefined) {
			// Enforce credentials
			throw new Error(`Credentials has been set to '${secure}' but none have been provided.`);
		}
		return resolved;
	}
}
