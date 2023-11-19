import { BasicClient } from "@/basic.client";
import { BasicCredentials, BearerCredentials, DynamicCredentials, DynamicCredentialsContext } from "@/global.types";
import { Mock, beforeEach, describe, expect, it, vi } from "vitest";

describe("BasicClient.resolve", () => {
	let resolve: Mock;
	let client: DynamicCredentialsContext;

	let cut: BasicClient;

	beforeEach(() => {
		client = {} as DynamicCredentialsContext;

		resolve = vi.fn();

		cut = new BasicClient({
			encoder: {
				resolve,
			},
			executor: {
				execute: vi.fn(),
			},
		});
	});

	it("resolve should plainly return bearer credentials", async () => {
		const credentials: BearerCredentials = {
			type: "bearer",
			token: "abc",
		};
		const result = await cut.resolve(credentials, client);

		expect(result).to.eql(credentials);
	});

	it("resolve should plainly return basic token credentials", async () => {
		const credentials: BearerCredentials = {
			type: "basic",
			token: "abc",
		};
		const result = await cut.resolve(credentials, client);

		expect(result).to.eql(credentials);
	});

	it("resolve should invoke basic resolver for username and password", async () => {
		resolve.mockResolvedValue("abc");

		const credentials: BasicCredentials = {
			type: "basic",
			username: "123",
			password: "abc",
		};

		const result = await cut.resolve(credentials, client);

		expect(resolve).toHaveBeenCalledWith(credentials, client);
		expect(result).to.eql({
			type: "basic",
			token: "abc",
		});
	});

	it("resolve should invoke dynamic function", async () => {
		const credentials: DynamicCredentials = {
			type: "dynamic",
			token: resolve,
		};

		const result = await cut.resolve(credentials, client);

		expect(resolve).toHaveBeenCalledWith(client);
		expect(result).to.be.undefined;
	});

	it("resolve should recursively resolve dynamic function", async () => {
		const nested: BearerCredentials = {
			type: "basic",
			token: "abc",
		};

		const credentials: DynamicCredentials = {
			type: "dynamic",
			token: resolve,
		};

		resolve.mockResolvedValueOnce(credentials);
		resolve.mockResolvedValueOnce(nested);

		const result = await cut.resolve(credentials, client);

		expect(resolve).toHaveBeenCalledTimes(2);
		expect(result).to.eql(nested);
	});

	it("resolve should return undefined with unknown type", async () => {
		resolve.mockResolvedValue({
			type: "unknown",
			token: "abc",
		});

		const credentials: DynamicCredentials = {
			type: "dynamic",
			token: resolve,
		};

		const result = await cut.resolve(credentials, client);

		expect(resolve).toHaveBeenCalled();
		expect(result).to.be.undefined;
	});
});
