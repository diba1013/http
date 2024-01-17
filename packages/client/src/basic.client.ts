import type {
	BasicCredentials,
	BearerCredentials,
	Client,
	CredentialSecurity,
	Credentials,
	DynamicCredentialsContext,
	MaybePromise,
	RequestBody,
	RequestConfig,
	RequestExecutor,
	RequestHeaders,
	RequestParameters,
	ResponseConfig,
} from "@/global.types";
import { url as concatenate } from "@/util";

export interface BasicCredentialsEncoder {
	resolve(credentials: BasicCredentials): MaybePromise<string>;
}

export type BasicClientProperties = {
	executor: RequestExecutor;
	encoder: BasicCredentialsEncoder;
	config?: RequestConfig;
};

export class BasicClient implements Client {
	private readonly executor: RequestExecutor;
	private readonly encoder: BasicCredentialsEncoder;

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
		const base = this.join(url, path, parameters);

		const response = await this.executor.execute<Body>({
			method,
			url: base,
			headers: this.headers(headers, await this.authorize(secure, credentials), body),
			body,
		});
		if (response.status.code === 401) {
			const updated = await this.reauthorize(secure, credentials);
			// There will be no new attempt since no updated credentials could be provided
			if (updated !== undefined) {
				return await this.executor.execute<Body>({
					method,
					url: base,
					headers: this.headers(headers, updated, body),
					body,
				});
			}
		}
		return response;
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

		if (copy.authorization === undefined && credentials !== undefined) {
			const { type, token } = credentials;
			const method = `${type[0].toUpperCase()}${type.slice(1)}`;
			copy.authorization = `${method} ${token}`;
		}

		return copy;
	}

	async authorize(
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
		const resolved = await this.resolve(credentials, {
			client: this,
			invalidate: false,
		});
		if (secure === "force" && resolved === undefined) {
			// Enforce credentials
			throw new Error(`Credentials has been set to '${secure}' but none have been provided.`);
		}
		return resolved;
	}

	async reauthorize(secure: CredentialSecurity = "lenient", credentials?: Credentials) {
		if (secure === "none" || credentials === undefined) {
			// API expects credentials but none are provided (ignoring headers)
			return;
		}
		// Invalidate security check but do not check result since already 401
		return await this.resolve(credentials, {
			client: this,
			invalidate: true,
		});
	}

	async resolve(
		credentials: Credentials,
		context: DynamicCredentialsContext,
	): Promise<BearerCredentials | undefined> {
		if (credentials.type === "bearer" || credentials.type === "token") {
			return {
				type: credentials.type,
				token: credentials.token,
			};
		}
		if (credentials.type === "basic") {
			return "token" in credentials
				? {
						type: "basic",
						token: credentials.token,
					}
				: {
						type: "basic",
						token: await this.encoder.resolve(credentials),
					};
		}
		if (credentials.type === "dynamic") {
			const resolved = await credentials.token(context);
			if (resolved === undefined) {
				return undefined;
			}
			return this.resolve(resolved, context);
		}
		return undefined;
	}
}
