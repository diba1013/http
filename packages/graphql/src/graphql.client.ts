import { Client } from "@diba1013/fetch";
import { GraphClient, GraphRequest, GraphResponse } from "@/global.types";

export type FetchGraphClientProvider = {
	fetch: Client;
};

export class FetchGraphClient implements GraphClient {
	private readonly $fetch: Client;

	constructor({ fetch }: FetchGraphClientProvider) {
		this.$fetch = fetch;
	}

	async execute<T>(request: GraphRequest): Promise<T> {
		const { ok, response } = await this.$fetch.post<GraphRequest>("/", request);
		if (ok) {
			const { data, errors }: GraphResponse<T> = await response.json();
			if (errors !== undefined) {
				throw new Error("Got errors while executing request");
			}
			if (data === undefined) {
				throw new Error("Missing data");
			}
			return data;
		} else {
			throw new Error("Request did not succeed");
		}
	}
}
