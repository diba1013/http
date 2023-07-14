import { ConvertingRequestExecutor } from "@/basic.executor";
import { RequestBody, RequestExecutor, RequestHeaders } from "@/global.types";
import { Mock, beforeEach, describe, it, vi } from "vitest";

describe.todo("ConvertingRequestExecutor", () => {
	let fetch: Mock<[string, RequestInit], Promise<Response>>;

	let cut: RequestExecutor;

	beforeEach(() => {
		// Satisfies type
		// eslint-disable-next-line @typescript-eslint/require-await
		fetch = vi.fn(async (url, init): Promise<Response> => {
			return new Response(undefined, {
				headers: init.headers,
				status: 200,
				statusText: "",
			});
		});

		cut = new ConvertingRequestExecutor({
			fetch,
		});
	});

	it("execute should encode json body", async ({ expect }) => {
		const url = "https://example.com";
		const headers: RequestHeaders = {
			"content-type": "application/json",
		};
		const body: RequestBody = {
			message: "Hello",
		};

		await cut.execute({
			url,
			method: "get",
			headers,
			body,
		});

		expect(fetch).toHaveBeenCalledWith(url, {
			method: "get",
			headers,
			body: JSON.stringify(body),
		});
	});
});
