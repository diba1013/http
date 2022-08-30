import { parse, print } from "graphql";

export function gql(query: TemplateStringsArray): string {
	// Ensure that document is valid
	const document = parse(query.join(""));
	// Re-format to query string
	return print(document);
}
