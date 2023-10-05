import type { Client, EndpointDefinitions, RestClient } from "@/global.types";
import { BasicRestClient } from "@/rest.client";
import { Clients, RequestConfig } from "@diba1013/fetch";

export * from "@/global.types";
export * from "@diba1013/fetch";

export function http(options?: RequestConfig | undefined): Client {
	return Clients.create(options);
}

export function rest<Endpoints extends EndpointDefinitions>({
	endpoints,
	fetch,
}: {
	endpoints: Endpoints;
	fetch: Client;
}): RestClient<Endpoints> {
	return new BasicRestClient({
		endpoints,
		fetch,
	});
}
