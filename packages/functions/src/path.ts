import type { ServiceRequestBody, ServiceRequestParameters } from "@/global.types";
import type { HttpRequest } from "uWebSockets.js";

export type RoutePathContext<Request extends ServiceRequestBody> = {
	query<Query extends ServiceRequestParameters<Request> = ServiceRequestParameters<Request>>(): Query;

	params<Parameters extends ServiceRequestParameters<Request> = ServiceRequestParameters<Request>>(): Parameters;

	all(): Request;
};

class RoutePathParameters {
	private readonly $parameters: Record<string, string | string[]> = {};

	private merge(key: string, value: string) {
		const seen = this.$parameters[key];
		if (seen === undefined) {
			return value;
		}
		if (Array.isArray(seen)) {
			return [...seen, value];
		}
		return [seen, value];
	}

	public set(key: string, value: string) {
		this.$parameters[key] = this.merge(key, value);
	}

	public parameters<Context>(): Context {
		// This might be dangerous, but needs to be validated by the handler
		return this.$parameters as Context;
	}
}

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

	public *query(request: HttpRequest): Generator<[string, string]> {
		const query = new URLSearchParams(request.getQuery());
		for (const [key, value] of query.entries()) {
			yield [key, value];
		}
	}

	public pluck<Request extends ServiceRequestBody>(request: HttpRequest): RoutePathContext<Request> {
		return {
			query: () => {
				const context = new RoutePathParameters();
				// Append query parameters only
				for (const [key, value] of this.query(request)) {
					context.set(key, value);
				}
				return context.parameters();
			},

			params: () => {
				const context = new RoutePathParameters();
				// Append path parameters only
				for (const [key, value] of this.match(request)) {
					context.set(key, value);
				}
				return context.parameters();
			},

			all: () => {
				const context = new RoutePathParameters();
				// Append path parameters first
				for (const [key, value] of this.match(request)) {
					context.set(key, value);
				}
				// Append query parameters second
				for (const [key, value] of this.query(request)) {
					context.set(key, value);
				}
				return context.parameters();
			},
		};
	}
}
