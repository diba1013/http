import { api } from "@/api/shared.api";
import { ResolvingCredentialsEncoder } from "@/basic.encoder";
import { BasicCredentials } from "@/global.types";

export * from "@/global.types";

const { ENVIRONMENT, VERSION, Clients } = api({
	encoder: new ResolvingCredentialsEncoder({
		resolve: ({ username, password }: BasicCredentials): string => {
			return self.btoa(`${username}:${password}`);
		},
	}),
});

export { Clients, ENVIRONMENT, VERSION };
