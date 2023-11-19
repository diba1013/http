import type { BasicCredentials } from "@/global.types";
import { api } from "@/api/shared.api";

export * from "@/global.types";

const { ENVIRONMENT, VERSION, Clients } = api({
	encoder: {
		resolve: ({ username, password }: BasicCredentials): string => {
			return self.btoa(`${username}:${password}`);
		},
	},
});

export { Clients, ENVIRONMENT, VERSION };
