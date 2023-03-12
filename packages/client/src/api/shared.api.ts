import { Client, RequestConfig } from "@/global.types";
import { BasicClient } from "@/basic.client";
import { CredentialsEncoder } from "@/client.types";
import { ConvertingRequestExecutor } from "@/basic.executor";

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
					fetch,
				});
				return new BasicClient({ executor, encoder, config });
			},
		},
	};
}
