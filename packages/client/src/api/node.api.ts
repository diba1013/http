import { ResolvingCredentialsEncoder } from "@/basic.encoder";
import { BasicCredentials } from "@/global.types";
import { api } from "@/api/shared.api";

export * from "@/global.types";

const { ENVIRONMENT, VERSION, Clients } = api({
	encoder: new ResolvingCredentialsEncoder({
		resolve: async ({ username, password }: BasicCredentials): Promise<string> => {
			const buffer = Buffer.from(`${username}:${password}`);
			return buffer.toString("base64");
		},
	}),
});

export { ENVIRONMENT, VERSION, Clients };
