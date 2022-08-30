import { BasicCredentials, BearerCredentials, Client, Credentials } from "@/global.types";

export interface CredentialsEncoder {
	resolve(credentials: Credentials, client: Client): Promise<BearerCredentials | undefined>;
}

export interface BasicCredentialsEncoder {
	resolve(credentials: BasicCredentials, client: Client): Promise<string>;
}
