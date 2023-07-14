import { GraphClient, GraphClientOptions } from "@/global.types";
import { FetchGraphClient } from "@/graphql.client";
import { Clients } from "@diba1013/fetch";

export { gql } from "@/gql.util";
export * from "@/global.types";

export const GraphQL = {
	client({ url, credentials }: GraphClientOptions): GraphClient {
		return new FetchGraphClient({
			fetch: Clients.create({
				url,
				credentials,
				secure: credentials === undefined ? "lenient" : "force",
			}),
		});
	},
};
