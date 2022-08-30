import {
	Client,
	Credentials,
	RequestBody,
	RequestConfig,
	RequestMethod,
	CredentialSecurity,
	BearerCredentials,
	ResponseConfig,
	RequestExecutor,
	RequestHeaders,
} from "@/global.types";
import { CredentialsEncoder } from "@/client.types";
import { url as join, merge } from "@/util";

type ResolvedRequestConfig = {
	url: string;
	headers: RequestHeaders;
	data?: RequestBody;
	credentials?: BearerCredentials;
};

export class BasicClient implements Client {
	private readonly executor: RequestExecutor;
	private readonly encoder: CredentialsEncoder;

	private readonly config: RequestConfig;

	constructor(executor: RequestExecutor, encoder: CredentialsEncoder, config: RequestConfig = {}) {
		this.executor = executor;
		this.encoder = encoder;
		this.config = config;
	}

	async send(
		method: RequestMethod,
		{ url, headers, credentials, data: body }: ResolvedRequestConfig,
	): Promise<ResponseConfig> {
		return this.executor.send({
			method,
			url,
			headers: this.headers(headers, credentials, body),
			body,
		});
	}

	headers(headers: RequestHeaders, credentials?: BearerCredentials, data?: RequestBody): RequestHeaders {
		const copy = { ...headers };

		if (headers["content-type"] === undefined && data !== undefined) {
			copy["content-type"] = "application/json";
		}

		if (headers["authorization"] === undefined && credentials !== undefined) {
			copy["authorization"] = `${credentials.type} ${credentials.token}`;
		}
		console.log("DONE HEADERS");

		return copy;
	}

	async resolve(path: string, config: RequestConfig = {}, data?: RequestBody): Promise<ResolvedRequestConfig> {
		console.log("Resolving");
		const base = config.url ?? this.config.url;
		const parameters = merge(this.config.params, config.params) ?? {};
		const url = join(base, path, parameters);
		const headers = merge(this.config.headers, config.headers) ?? {};

		const secure = config.secure ?? this.config.secure;
		console.log("PREPARIGN credentaisl");
		const credentials = await this.authorize(this, secure, config.credentials ?? this.config.credentials);
		console.log("GOT credentials");

		return {
			url,
			headers,
			data,
			credentials,
		};
	}

	async authorize(
		client: Client,
		secure: CredentialSecurity = "lenient",
		credentials?: Credentials,
	): Promise<BearerCredentials | undefined> {
		if (secure === "force" && credentials === undefined) {
			// Enfore credentials
			throw new Error(`Credentials has been set to '${secure}' but none have been provided.`);
		}
		if (secure === "none" || credentials === undefined) {
			// Ignore credendials
			return undefined;
		}
		// Re-trigger security check
		const resolved = await this.encoder.resolve(credentials, client);
		if (secure === "force" && resolved === undefined) {
			// Enfore credentials
			throw new Error(`Credentials has been set to '${secure}' but none have been provided.`);
		}
		return resolved;
	}

	async get(path: string, config?: RequestConfig): Promise<ResponseConfig> {
		const options = await this.resolve(path, config);
		return this.send("get", options);
	}

	async delete(path: string, config?: RequestConfig): Promise<ResponseConfig> {
		const options = await this.resolve(path, config);
		return this.send("delete", options);
	}

	async head(path: string, config?: RequestConfig): Promise<ResponseConfig> {
		const options = await this.resolve(path, config);
		return this.send("head", options);
	}

	async options(path: string, config?: RequestConfig): Promise<ResponseConfig> {
		const options = await this.resolve(path, config);
		return this.send("options", options);
	}

	async post<T extends RequestBody>(path: string, data?: T, config?: RequestConfig): Promise<ResponseConfig> {
		const options = await this.resolve(path, config, data);
		return this.send("post", options);
	}

	async put<T extends RequestBody>(path: string, data?: T, config?: RequestConfig): Promise<ResponseConfig> {
		const options = await this.resolve(path, config, data);
		return this.send("put", options);
	}

	async patch<T extends RequestBody>(path: string, data?: T, config?: RequestConfig): Promise<ResponseConfig> {
		const options = await this.resolve(path, config, data);
		return this.send("patch", options);
	}
}
