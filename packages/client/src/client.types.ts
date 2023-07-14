import { BasicCredentials, BearerCredentials, Client, Credentials, MaybePromise } from "@/global.types";

export interface CredentialsEncoder {
	resolve(credentials: Credentials, client: Client): Promise<BearerCredentials | undefined>;
}

export interface BasicCredentialsEncoder {
	resolve(credentials: BasicCredentials, client: Client): MaybePromise<string>;
}
