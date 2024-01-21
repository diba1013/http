import type { RequestBody, RequestHeaders, RequestMethod, ResponseHeaders } from "@diba1013/fetch";
import type { MaybePromise } from "@diba1013/types";

export type ServiceRequestBody = {
	[K: string]: number | number[] | string | string[] | ServiceRequestBody | ServiceRequestBody[] | undefined;
};

export type ServiceRequestParameters<Body extends ServiceRequestBody = ServiceRequestBody> = {
	[K in keyof Body]: Body[K] extends string | string[] ? Body[K] : never;
};

export type ServiceRequestMethod = RequestMethod;
export type ServiceRequestHeaders = RequestHeaders;
export type ServiceResponseBody = RequestBody | string;
export type ServiceResponseHeaders = ResponseHeaders;

export type ServiceRequest<Context> = {
	/**
	 * The path associated with the respective route.
	 * This is relative to the router assigned and thus might be only part of the url.
	 */
	path: string;
	/**
	 * The method used to call the endpoint.
	 */
	method: ServiceRequestMethod;
	/**
	 * The headers bound to the request.
	 *
	 * Headers must be accessed before any `await` call
	 * since the bound request is discarded with the next event loop.
	 */
	headers: ServiceRequestHeaders;
	/**
	 * Additional context bound to the request.
	 */
	context: Context;
	/**
	 * The signal associated with the active request.
	 *
	 * It is canceled if the client aborts the request during processing.
	 */
	signal: AbortSignal;
};

export type ServiceResponse<Response extends ServiceResponseBody> = {
	/**
	 * The valid http status code for the request.
	 *
	 * @default 200 success
	 */
	code?: number;
	/**
	 * Additional headers provided to the client.
	 */
	headers?: ServiceResponseHeaders;
	/**
	 * The body to send with to the client.
	 */
	body?: Response;
};

/**
 * Processes a service request and provides a respective response.
 *
 * The context might be provided, modified or enriched by nested handlers or middlewares.
 * Therefore, the type must chosen accordingly and should be validated before processing.
 *
 * While it is not necessary to provide an actual response in case of a generic success,
 * it is still recommended to ensure consistent handler functions.
 *
 * @template Context The context that is bound to the request.
 * @template Response The response object to return to the client.
 *
 * @returns The respective response or `void` if using the default
 */
export type ServiceHandler<Context, Response extends ServiceResponseBody> = (
	request: ServiceRequest<Context>,
) => MaybePromise<ServiceResponse<Response> | void>;

/**
 * Provides access to the parameters send with the request.
 *
 * @template Request The request object that satisfies all provided parameters, query and body response.
 *
 * @see {@link ServiceHandler}
 * @see {@link ServiceRequest}
 */
export type ServiceEndpointContext<Request extends ServiceRequestBody> = ServiceRequest<{
	/**
	 * Extracts query parameters only.
	 */
	query<Query extends ServiceRequestParameters<Request> = ServiceRequestParameters<Request>>(): Query;

	/**
	 * Extract path parameters only.
	 */
	params<Parameters extends ServiceRequestParameters<Request> = ServiceRequestParameters<Request>>(): Parameters;

	/**
	 * Extracts body parameters only (if applicable due to content-type header)
	 */
	body<Body extends Request = Request>(): Promise<Body>;

	/**
	 * Extracts a combination of query, parameters and body content.
	 *
	 * The following rules apply for processing different parameters:
	 *
	 * 1. Path parameters are merged with query parameters. These are string-only.
	 * 2. Body parameters overwrite previous values due to more complex json capabilities.
	 */
	json(): Promise<Request>;
}>;

/**
 * Provides lazy service handler context based on the raw request.
 *
 * @see {@link ServiceHandler}
 */
export type ServiceEndpointHandler<
	Request extends ServiceRequestBody,
	Response extends ServiceResponseBody,
> = ServiceHandler<ServiceEndpointContext<Request>["context"], Response>;

export type ServiceEndpointHandlerMethod = ServiceRequestMethod | "any";

export type ServiceEndpoint<Request extends ServiceRequestBody, Response extends ServiceResponseBody> = {
	path: string;
	method?: ServiceEndpointHandlerMethod | Exclude<"any", ServiceRequestMethod>[];
	handler: ServiceEndpointHandler<Request, Response>;
};
