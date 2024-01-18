import type { HttpRequest } from "uWebSockets.js";
import { RoutePath } from "@/path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { type MockProxy, mock, mockReset } from "vitest-mock-extended";

describe("RoutePath#parameters", () => {
	it("should handle simple path", () => {
		const cut = new RoutePath("/");

		expect(cut.parameters).is.empty;
	});

	it("should handle multiple segments without parameter", () => {
		const cut = new RoutePath("/this/is/a/really/bad/example/of/a/long/path");

		expect(cut.parameters).is.empty;
	});

	it("should handle short path", () => {
		const cut = new RoutePath("/:a");

		expect(cut.parameters).to.eql(["a"]);
	});

	it("should handle multiple segmetns with parameters", () => {
		const cut = new RoutePath("/file/:namespace/copy/:id");

		expect(cut.parameters).to.eql(["namespace", "id"]);
	});
});

describe("RoutePath#match", () => {
	let request: MockProxy<HttpRequest>;

	beforeEach(() => {
		const parameters = ["settings", "123"];

		request = mock<HttpRequest>({
			getParameter(index) {
				return parameters[index];
			},
		});
	});

	afterEach(() => {
		mockReset(request);
	});

	it("should handle existing parameters", () => {
		const cut = new RoutePath("/file/:namespace/copy/:id");

		const result = [...cut.match(request)];

		expect(result).to.eql([
			["namespace", "settings"],
			["id", "123"],
		]);
	});
});
