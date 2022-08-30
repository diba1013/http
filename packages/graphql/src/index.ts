import { Clients } from "@diba1013/fetch";
import { GraphClient, GraphClientOptions } from "@/global.types";
import { FetchGraphClient } from "@/graphql.client";

export { gql } from "@/gql.util";

export const GraphQL = {
	client({ url, credentials }: GraphClientOptions): GraphClient {
		return new FetchGraphClient({
			fetch: Clients.create({
				url,
				credentials,
				secure: credentials !== undefined ? "force" : "lenient",
			}),
		});
	},
};
