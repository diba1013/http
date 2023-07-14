import { api } from "@/api/shared.api";
import { ResolvingCredentialsEncoder } from "@/basic.encoder";
import { BasicCredentials } from "@/global.types";

export * from "@/global.types";

const { ENVIRONMENT, VERSION, Clients } = api({
	encoder: new ResolvingCredentialsEncoder({
		resolve: ({ username, password }: BasicCredentials): string => {
			const buffer = Buffer.from(`${username}:${password}`);
			return buffer.toString("base64");
		},
	}),
});

export { Clients, ENVIRONMENT, VERSION };
