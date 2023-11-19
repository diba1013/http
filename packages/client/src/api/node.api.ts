import type { BasicCredentials } from "@/global.types";
import { api } from "@/api/shared.api";

export * from "@/global.types";

const { ENVIRONMENT, VERSION, Clients } = api({
	encoder: {
		resolve: ({ username, password }: BasicCredentials): string => {
			const buffer = Buffer.from(`${username}:${password}`);
			return buffer.toString("base64");
		},
	},
});

export { Clients, ENVIRONMENT, VERSION };
