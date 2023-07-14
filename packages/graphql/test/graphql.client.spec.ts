import { GraphResponse } from "@/global.types";
import { FetchGraphClient } from "@/graphql.client";
import { Client } from "@diba1013/fetch";
import { Mocked, beforeEach, describe, expect, it, vi } from "vitest";

type FetchGraphClientTestContext = {
	fetch: Mocked<Client>;
	cut: FetchGraphClient;
};

describe<FetchGraphClientTestContext>("FetchGraphClient", () => {
	beforeEach<FetchGraphClientTestContext>((context) => {
		context.fetch = {
			execute: vi.fn(),
		};

		context.cut = new FetchGraphClient({
			fetch: context.fetch,
		});
	});

	it<FetchGraphClientTestContext>("should handle graphql errors", async ({ fetch, cut }) => {
		const response: GraphResponse = {
			errors: [
				{
					message: "Failed",
					path: [],
					extensions: {},
				},
			],
		};

		fetch.execute.mockResolvedValue({
			ok: true,
			headers: {},
			status: {
				code: 200,
				text: "ok",
			},
			response: {
				// Satisfies type
				// eslint-disable-next-line @typescript-eslint/require-await
				async json<R>(): Promise<R> {
					return response as R;
				},
				blob: vi.fn(),
				text: vi.fn(),
			},
		});

		const result = cut.execute({
			query: "",
		});

		await expect(result).rejects.toThrow();
	});
});
