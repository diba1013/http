import type { RequestBody, RequestHeaders, RequestMethod, ResponseHeaders } from "@diba1013/fetch";
import type { MaybePromise } from "@diba1013/types";

export type ServiceRequestBody = {
	[K: string]: string | string[] | ServiceRequestBody | ServiceRequestBody[] | undefined;
};
export type ServiceRequestMethod = RequestMethod;
export type ServiceRequestHeaders = RequestHeaders;
export type ServiceResponseBody = RequestBody | string;
export type ServiceResponseHeaders = ResponseHeaders;

export type ServiceEndpointContext<Context> = {
	url: URL;
	method: ServiceRequestMethod;
	headers: ServiceRequestHeaders;
	context: Context;
	/**
	 * The signal associated with the active request.
	 */
	signal: AbortSignal;
};

export type ServiceEndpointResponse<Response extends ServiceResponseBody> = {
	code?: number;
	headers?: ServiceResponseHeaders;
	body?: Response;
};

export type ServiceEndpointHandler<Context, Response extends ServiceResponseBody> = (
	context: ServiceEndpointContext<Context>,
) => MaybePromise<ServiceEndpointResponse<Response>>;

export type ServiceEndpointHandlerMethod = RequestMethod | "any";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ServiceEndpoint<Context, Response extends ServiceResponseBody> = {
	path: string;
	method?: ServiceEndpointHandlerMethod | Exclude<"any", ServiceRequestMethod>[];
	handler: ServiceEndpointHandler<Context, Response>;
};
