import { url } from "@/util";
import { describe, expect, it } from "vitest";

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
