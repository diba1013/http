import type { ServiceRequestHeaders } from "@/global.types";
import type { HttpRequest, HttpResponse } from "uWebSockets.js";
import { Router } from "@/route";
import { type Mock, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { type MockProxy, mock, mockReset } from "vitest-mock-extended";

describe("Router", () => {
	let cut: Router;
	let request: MockProxy<HttpRequest>;
	let response: MockProxy<HttpResponse>;

	let headers: Mock<[], ServiceRequestHeaders>;
	let body: Mock<[], string[]>;

	let signal: AbortController;

	beforeEach(() => {
		cut = new Router();

		signal = new AbortController();

		headers = vi.fn(() => {
			return {
				"content-type": "application/json",
			};
		});
		body = vi.fn(() => {
			return ["{", '"id": 123', ",", '"name": "Test"', "}"];
		});

		request = mock<HttpRequest>({
			getMethod: vi.fn(() => {
				return "get";
			}),

			getQuery: vi.fn(() => {
				return "";
			}),

			getUrl: vi.fn(() => {
				return "/";
			}),

			forEach(handler) {
				handler("host", "example.com");
				for (const [key, value = ""] of Object.entries(headers())) {
					handler(key, typeof value === "string" ? value : value.join(", "));
				}
			},
		});

		response = mock<HttpResponse>({
			onData(handler) {
				for (const content of body()) {
					handler(Buffer.from(content), false);
				}
				handler(Buffer.from(""), true);
				return response;
			},

			onAborted(handler) {
				if (signal.signal.aborted) {
					handler();
				} else {
					signal.signal.addEventListener("abort", () => handler(), {
						once: true,
					});
				}
				return response;
			},

			cork: vi.fn((handler) => {
				handler();
				return response;
			}),
		});
	});

	afterEach(() => {
		mockReset(request);
		mockReset(response);
	});

	it("retrieve should build url correctly", async () => {
		request.getMethod.mockReturnValue("post");
		request.getUrl.mockReturnValue("/foo");
		request.getQuery.mockReturnValue("a=1&a=2&b=hello&a=3");

		const result = await cut.retrieve(request, response);

		expect(result.method).to.be.eq("post");
		expect(result.url.host).is.eq("example.com");
		expect(result.url.pathname).is.eq("/foo");
		expect(result.context).to.have.deep.property("a", ["1", "2", "3"]);
		expect(result.context).to.have.property("b", "hello");
		expect(result.context).to.have.property("id", 123);
		expect(result.context).to.have.property("name", "Test");
		expect(result.signal.aborted).to.be.false;
	});

	it("retrieve with invalid body content should not be parsed", async () => {
		body.mockReturnValue(["{", "abc", "}"]);

		const result = await cut.retrieve(request, response);

		expect(result.context).not.to.have.property("abc");
	});

	it("retrieve with invalid content-type content should not be parsed", async () => {
		headers.mockReturnValue({
			"content-type": "text/plain",
		});

		const result = await cut.retrieve(request, response);

		expect(result.context).not.to.have.property("id");
		expect(result.context).not.to.have.property("name");
	});

	it("retrieve with aborted request should not append body", async () => {
		signal.abort();

		const result = await cut.retrieve(request, response);

		expect(result.context).not.to.have.property("id");
		expect(result.context).not.to.have.property("name");
	});

	it("retrieve should handle abort signal", async () => {
		const result = await cut.retrieve(request, response);

		signal.abort();

		expect(result.signal.aborted).to.be.true;
	});

	it("send should write metadata", () => {
		cut.send(response, {
			code: 504,
			headers: {
				"content-type": "text/xhtml",
				cookie: ["monsters", "inc"],
			},
		});

		expect(response.cork).toHaveBeenCalled();
		expect(response.writeStatus).toHaveBeenLastCalledWith("504 Gateway Timeout");
		expect(response.writeHeader).toHaveBeenCalledWith("content-type", "text/xhtml");
		expect(response.writeHeader).toHaveBeenCalledWith("cookie", "monsters, inc");
	});

	it("send should handle plain string response", () => {
		cut.send(response, {
			code: 200,
			headers: {
				"content-type": "text/html",
			},
			body: "",
		});

		expect(response.writeHeader).toHaveBeenCalledWith("content-type", "text/html");
		expect(response.end).toHaveBeenCalledWith("");
	});

	it("send should handle plain string response with fallback header", () => {
		cut.send(response, {
			code: 200,
			body: "",
		});

		expect(response.writeHeader).toHaveBeenCalledWith("content-type", "text/plain");
		expect(response.end).toHaveBeenCalledWith("");
	});

	it("send should handle json response", () => {
		cut.send(response, {
			code: 200,
			headers: {
				"content-type": "application/xjson",
			},
			body: { id: 123 },
		});

		expect(response.writeHeader).toHaveBeenCalledWith("content-type", "application/xjson");
		expect(response.end).toHaveBeenCalledWith('{"id":123}');
	});

	it("send should handle json response with fallback header", () => {
		cut.send(response, {
			code: 200,
			body: { id: 123 },
		});

		expect(response.writeHeader).toHaveBeenCalledWith("content-type", "application/json");
		expect(response.end).toHaveBeenCalledWith('{"id":123}');
	});

	it("send should handle unknown response without body", () => {
		cut.send(response, {
			code: 200,
			body: Symbol() as unknown as string,
		});

		expect(response.end).toHaveBeenCalledWith();
	});
});
