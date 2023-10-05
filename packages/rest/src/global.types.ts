import type { Credentials, RequestHeaders, RequestMethod } from "@diba1013/fetch";
import type { ZodType } from "zod";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type EndpointDefinition<Request extends object = any, Response = any> = {
	path: string;
	method: RequestMethod;
	params?: (keyof Request)[];
	body?: keyof Request;
	request?:
		| {
				type: "application/json";
				schema: ZodType<Request>;
		  }
		| {
				type: "";
		  };
	response?:
		| {
				type: "application/json";
				schema: ZodType<Response>;
		  }
		| {
				type: "text/plain";
		  }
		| {
				type: "";
		  };
};

export type EndpointDefinitions = {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	[Endpoint: string]: EndpointDefinition<any, any>;
};

export function defineEndpoints<Endpoints extends EndpointDefinitions>(endpoints: Endpoints): Endpoints {
	return endpoints;
}

export function defineEndpoint<Endpoint extends EndpointDefinition>(endpoint: Endpoint): Endpoint {
	return endpoint;
}

export type EndpointIdentifier<Endpoints extends EndpointDefinitions> = keyof Endpoints;
export type Endpoint<Endpoints extends EndpointDefinitions, ID extends EndpointIdentifier<Endpoints>> = Endpoints[ID];

export type EndpointRequest<Endpoints extends EndpointDefinitions, ID extends EndpointIdentifier<Endpoints>> = Endpoint<
	Endpoints,
	ID
> extends EndpointDefinition<infer Request, any> // eslint-disable-line @typescript-eslint/no-explicit-any
	? Request
	: never;

export type EndpointResponse<
	Endpoints extends EndpointDefinitions,
	ID extends EndpointIdentifier<Endpoints>,
> = Endpoint<Endpoints, ID> extends EndpointDefinition<any, infer Response> // eslint-disable-line @typescript-eslint/no-explicit-any
	? Response
	: never;

export type EndpointOptions<Endpoints extends EndpointDefinitions, ID extends EndpointIdentifier<Endpoints>> = {
	request?: EndpointRequest<Endpoints, ID>;
	headers?: RequestHeaders;
	credentials?: Credentials;
};

export interface RestClient<Endpoints extends EndpointDefinitions> {
	execute<ID extends EndpointIdentifier<Endpoints>>(
		id: ID,
		options?: EndpointOptions<Endpoints, ID>,
	): Promise<EndpointResponse<Endpoints, ID>>;
}

export { type Client, type Credentials, type RequestHeaders, type RequestMethod } from "@diba1013/fetch";
