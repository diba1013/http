import { BasicClient } from "@/basic.client";
import { ConvertingRequestExecutor } from "@/basic.executor";
import { CredentialsEncoder } from "@/client.types";
import { Client, RequestConfig } from "@/global.types";

export type Context = {
	encoder: CredentialsEncoder;
};

export type API = {
	ENVIRONMENT: string;
	VERSION: string;

	Clients: {
		create(options?: RequestConfig): Client;
	};
};

export function api({ encoder }: Context): API {
	return {
		ENVIRONMENT: "__ENVIRONMENT__",
		VERSION: "__VERSION__",

		Clients: {
			create(config?: RequestConfig): Client {
				const executor = new ConvertingRequestExecutor({
					fetch: async (input, request) => {
						return await fetch(input, request);
					},
				});
				return new BasicClient({ executor, encoder, config });
			},
		},
	};
}
