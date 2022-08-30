import { Client } from "@diba1013/fetch";
import { beforeEach, describe, expect, it, Mocked, vi } from "vitest";
import { GraphResponse } from "@/global.types";
import { FetchGraphClient } from "@/graphql.client";

type FetchGraphClientTestContext = {
	fetch: Mocked<Client>;
	cut: FetchGraphClient;
};

describe<FetchGraphClientTestContext>("FetchGraphClient", () => {
	beforeEach<FetchGraphClientTestContext>((context) => {
		context.fetch = {
			get: vi.fn(),
			delete: vi.fn(),
			head: vi.fn(),
			options: vi.fn(),
			post: vi.fn(),
			put: vi.fn(),
			patch: vi.fn(),
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

		fetch.post.mockResolvedValue({
			ok: true,
			headers: {},
			status: {
				code: 200,
				text: "ok",
			},
			response: {
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
