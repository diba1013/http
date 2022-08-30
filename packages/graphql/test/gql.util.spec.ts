import { describe, expect, it } from "vitest";
import { gql } from "@/gql.util";

describe("gql", () => {
	it("should reformat query", () => {
		const query = gql`
			{
				hero {
					id
					name
				}
			}
		`;

		expect(query).to.eql("{\n  hero {\n    id\n    name\n  }\n}");
	});

	it("should throw if query unparsable", () => {
		expect(() => {
			return gql`{}`;
		}).to.throw(/Syntax Error/);
	});
});
