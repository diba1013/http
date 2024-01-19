import type { HttpRequest } from "uWebSockets.js";

export type RoutePathContext = {
	path: string;
	context: Record<string, string | string[]>;
};

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

	public pluck(request: HttpRequest): RoutePathContext {
		const path = request.getUrl();
		const query = new URLSearchParams(request.getQuery());

		const context: Record<string, string | string[]> = {};
		function merge(key: string, value: string) {
			const seen = context[key];
			if (seen === undefined) {
				return value;
			}
			if (Array.isArray(seen)) {
				return [...seen, value];
			}
			return [seen, value];
		}
		// Append path parameters first
		for (const [key, value] of this.match(request)) {
			context[key] = merge(key, value);
		}
		// Append query parameters second
		for (const [key, value] of query) {
			context[key] = merge(key, value);
		}

		return {
			path,
			context,
		};
	}
}
