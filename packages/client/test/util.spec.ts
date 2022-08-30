import { describe, expect, it } from "vitest";
import { RequestBody } from "@/global.types";
import { merge, url } from "@/util";

describe("url", () => {
	it("should return base if parameters are undefined", () => {
		const input = "https://api.example.com";

		const result = url(input);

		expect(result).to.be.eq(input);
	});

	it("should ignore base if undefined", () => {
		const input = "/api/:version/users/:id";

		const result = url(undefined, input, {
			version: 4,
			id: 123,
			tab: "repositories",
		});

		expect(result).to.be.eq("/api/4/users/123?tab=repositories");
	});

	it("should append path and parameters to request", () => {
		const result = url("https://api.example.com/", "/users/:id/comments", {
			id: 123,
			search: "example",
		});

		expect(result).to.be.eq("https://api.example.com/users/123/comments?search=example");
	});
});

describe("merge", () => {
	it("should handle undefined parameters", () => {
		const result = merge();

		expect(result).to.be.undefined;
	});

	it("should return first if second undefined", () => {
		const input = {
			a: "first",
		};

		const result = merge(input);

		expect(result).to.be.eq(input);
	});

	it("should return second if first undefined", () => {
		const input = {
			a: "first",
		};

		const result = merge(undefined, input);

		expect(result).to.be.eq(input);
	});

	it("should prefer second if both defined", () => {
		const first = {
			a: "first",
		};
		const second = {
			b: "second",
		};

		const result = merge<RequestBody>(first, second);

		expect(result).to.be.eq(second);
	});
});
