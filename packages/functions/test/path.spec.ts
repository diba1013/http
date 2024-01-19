import type { HttpRequest } from "uWebSockets.js";
import { RoutePath } from "@/path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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

describe("Route#pluck", () => {
	let cut: RoutePath;

	let request: MockProxy<HttpRequest>;

	beforeEach(() => {
		cut = new RoutePath("/file/:namespace/copy/:id");

		const parameters = ["settings", "123"];
		request = mock<HttpRequest>({
			getUrl() {
				return `/file/${request.getParameter(0)}/copy/${request.getParameter(1)}`;
			},

			getQuery: vi.fn(() => {
				return "";
			}),

			getParameter(index) {
				return parameters[index];
			},
		});
	});

	afterEach(() => {
		mockReset(request);
	});

	it("should correctly build complex content", () => {
		request.getQuery.mockReturnValue("file=config.json&file=spec.json&file=license.json&operation=copy&id=345");

		const { path, context } = cut.pluck(request);

		expect(path).to.eq("/file/settings/copy/123");
		expect(context).to.eql({
			namespace: "settings",
			id: ["123", "345"],
			file: ["config.json", "spec.json", "license.json"],
			operation: "copy",
		});
	});
});
