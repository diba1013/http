import { beforeEach, describe, it, Mock, vi } from "vitest";
import { RequestHeaders, RequestBody, RequestExecutor } from "@/global.types";
import { ConvertingRequestExecutor } from "@/basic.executor";

describe.todo("ConvertingRequestExecutor", () => {
	let fetch: Mock<[string, RequestInit], Promise<Response>>;

	let cut: RequestExecutor;

	beforeEach(() => {
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

	it("send should encode json body", async ({ expect }) => {
		const url = "https://example.com";
		const headers: Headers = {
			"content-type": "application/json",
		};
		const body: RequestBody = {
			message: "Hello",
		};

		await cut.send({
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
