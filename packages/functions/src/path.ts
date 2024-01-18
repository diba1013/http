import type { HttpRequest } from "uWebSockets.js";

export class RoutePath {
	private readonly $parameters: string[] = [];

	constructor(pattern: string) {
		const patterns = pattern.match(/\/:\w+/g) ?? [];
		for (const chunk of patterns) {
			this.$parameters.push(chunk.slice(2));
		}
	}

	public get parameters(): string[] {
		return this.$parameters;
	}

	public *match(request: HttpRequest): Generator<[string, string]> {
		for (const [index, name] of this.$parameters.entries()) {
			yield [name, request.getParameter(index)];
		}
	}
}
