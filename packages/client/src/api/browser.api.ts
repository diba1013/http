import { BasicCredentials } from "@/global.types";
import { api } from "@/api/shared.api";
import { ResolvingCredentialsEncoder } from "@/basic.encoder";

export * from "@/global.types";

const { ENVIRONMENT, VERSION, Clients } = api({
	encoder: new ResolvingCredentialsEncoder({
		resolve: async ({ username, password }: BasicCredentials): Promise<string> => {
			return self.btoa(`${username}:${password}`);
		},
	}),
});

export { ENVIRONMENT, VERSION, Clients };
