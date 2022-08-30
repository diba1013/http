export type Request<T = RequestBody> = {
	url: string;
	method: RequestMethod;
	headers: RequestHeaders;
	body?: T;
};

export type RequestHeaders = {
	[K: string]: string;
};

export type RequestMethod = "get" | "delete" | "head" | "options" | "post" | "put" | "patch";

export type RequestBody = RequestParameter | RequestParameters | RequestParameters[];

export type RequestParameter = number | number[] | string | string[];

export type RequestParameters = {
	[K: string]: RequestParameter | RequestParameters | RequestParameters[] | undefined;
};

export type BasicCredentials = {
	type: "basic";
	username: string;
	password: string;
};

export type BearerCredentials = {
	type: "basic" | "bearer" | "token";
	token: string;
};

export type DynamicCredentials = {
	type: "dynamic";
	token(fetch: Client): Promise<Credentials | undefined>;
};

export type Credentials = BasicCredentials | BearerCredentials | DynamicCredentials;

export type CredentialSecurity = "force" | "lenient" | "none";

export type RequestConfig<Parameters extends RequestParameters = RequestParameters> = {
	url?: string;
	headers?: RequestHeaders;
	params?: Parameters;
	credentials?: Credentials;
	secure?: CredentialSecurity;
};

export type ResponseConfig = {
	ok: boolean;
	status: Status;
	headers: ResponseHeaders;
	response: Response;
};

export type Status = {
	code: number;
	text: string;
};

export type ResponseHeaders = {
	[K: string]: string;
};

export type Response = {
	json<R>(): Promise<R>;

	blob(): Promise<Blob>;

	text(): Promise<string>;
};

export interface RequestExecutor {
	send<T = RequestBody>(request: Request<T>): Promise<ResponseConfig>;
}

export interface Client {
	get(url: string, config?: RequestConfig): Promise<ResponseConfig>;

	delete(url: string, config?: RequestConfig): Promise<ResponseConfig>;

	head(url: string, config?: RequestConfig): Promise<ResponseConfig>;

	options(url: string, config?: RequestConfig): Promise<ResponseConfig>;

	post<T extends RequestBody>(url: string, data?: T, config?: RequestConfig): Promise<ResponseConfig>;

	put<T extends RequestBody>(url: string, data?: T, config?: RequestConfig): Promise<ResponseConfig>;

	patch<T extends RequestBody>(url: string, data?: T, config?: RequestConfig): Promise<ResponseConfig>;
}
