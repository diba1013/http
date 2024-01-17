export type MaybePromise<T> = T | PromiseLike<T> | Promise<T>;
export type MaybeArray<T> = T | T[];

export type RequestMethod = "get" | "delete" | "head" | "options" | "post" | "put" | "patch";

export type RequestParameter = number | string;
export type RequestParameters = Record<string, MaybeArray<RequestParameter> | undefined>;
export type RequestBody = MaybeArray<{
	[K in string]: MaybeArray<RequestParameter> | RequestBody | undefined;
}>;

export type CommonHeaders = {
	"content-type"?: string;
};

export type RequestHeaders = CommonHeaders & Record<string, string | string[] | undefined>;

export type ResponseHeaders = CommonHeaders & Record<string, string | string[]>;

export type BasicCredentials = {
	type: "basic";
	username: string;
	password: string;
};

export type BearerCredentials = {
	type: "basic" | "bearer" | "token";
	token: string;
};

export type DynamicCredentialsContext = {
	client: Client;
	invalidate: boolean;
};

export type DynamicCredentials = {
	type: "dynamic";
	token: (context: DynamicCredentialsContext) => Promise<Credentials | undefined>;
};

export type Credentials = BasicCredentials | BearerCredentials | DynamicCredentials;

export type CredentialSecurity = "force" | "lenient" | "none";

export type RequestConfig<
	Parameters extends RequestParameters = RequestParameters,
	Body extends RequestBody = RequestBody,
> = {
	method?: RequestMethod;
	url?: string;
	path?: string;
	headers?: RequestHeaders;
	credentials?: Credentials;
	secure?: CredentialSecurity;
	parameters?: Parameters;
	body?: Body;
	signal?: AbortSignal;
};

export type Request<Body extends RequestBody = RequestBody> = {
	url: string;
	method: RequestMethod;
	headers: RequestHeaders;
	body?: Body;
	signal?: AbortSignal;
};

export type ResponseConfig = {
	ok: boolean;
	status: ResponseStatus;
	headers: ResponseHeaders;
	response: Response;
};

export type ResponseStatus = {
	code: number;
	text: string;
};

export type Response = {
	json<R>(): Promise<R>;

	blob(): Promise<Blob>;

	text(): Promise<string>;
};

export type RequestExecutor = {
	execute<Body extends RequestBody>(request: Request<Body>): Promise<ResponseConfig>;
};

export type Client = {
	execute<Parameters extends RequestParameters = RequestParameters, Body extends RequestBody = RequestBody>(
		config: RequestConfig<Parameters, Body>,
	): Promise<ResponseConfig>;
};
