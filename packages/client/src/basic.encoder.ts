import type { BearerCredentials, Client, Credentials } from "./global.types";
import type { BasicCredentialsEncoder, CredentialsEncoder } from "@/client.types";

export class ResolvingCredentialsEncoder implements CredentialsEncoder {
	private readonly encoder: BasicCredentialsEncoder;

	constructor(encoder: BasicCredentialsEncoder) {
		this.encoder = encoder;
	}

	async resolve(credentials: Credentials, fetch: Client): Promise<BearerCredentials | undefined> {
		if (credentials.type === "bearer" || credentials.type === "token") {
			return {
				type: credentials.type,
				token: credentials.token,
			};
		}
		if (credentials.type === "basic") {
			return "token" in credentials
				? {
						type: "basic",
						token: credentials.token,
				  }
				: {
						type: "basic",
						token: await this.encoder.resolve(credentials, fetch),
				  };
		}
		if (credentials.type === "dynamic") {
			const resolved = await credentials.token(fetch);
			if (resolved === undefined) {
				return undefined;
			}
			return this.resolve(resolved, fetch);
		}
		return undefined;
	}
}
