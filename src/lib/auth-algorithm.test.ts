import jwt from "jsonwebtoken";
import { beforeAll, describe, expect, it } from "vitest";

describe("verifyToken", () => {
	let generateToken: (payload: object) => string;
	let verifyToken: (token: string) => jwt.JwtPayload | string;

	beforeAll(async () => {
		process.env.JWT_SECRET = "vitest-jwt-secret-not-for-production";
		const auth = await import("./auth");
		generateToken = auth.generateToken;
		verifyToken = auth.verifyToken;
	});

	it("aceita o token HS256 emitido pela aplicação", () => {
		const token = generateToken({ userId: "u1" });
		expect(verifyToken(token)).toMatchObject({ userId: "u1" });
	});

	it("rejeita um token assinado com outro algoritmo", () => {
		const token = jwt.sign({ userId: "u1" }, process.env.JWT_SECRET ?? "", {
			algorithm: "HS512",
		});
		expect(() => verifyToken(token)).toThrow();
	});
});
