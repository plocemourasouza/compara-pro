import { type NextRequest, NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma";
import {
	AppError,
	createErrorResponse,
	ErrorCode,
	ErrorFactory,
} from "@/lib/errors";

// Request ID generator
function generateRequestId(): string {
	return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Error logging interface
interface ErrorLog {
	requestId: string;
	method: string;
	url: string;
	error: AppError | Error;
	timestamp: Date;
	userAgent?: string;
	ip?: string;
}

// Enhanced error logger
function logError(log: ErrorLog) {
	const logEntry = {
		level:
			log.error instanceof AppError && log.error.isOperational
				? "warn"
				: "error",
		requestId: log.requestId,
		method: log.method,
		url: log.url,
		errorCode: log.error instanceof AppError ? log.error.code : "UNKNOWN",
		message: log.error.message,
		stack: log.error.stack,
		timestamp: log.timestamp,
		userAgent: log.userAgent,
		ip: log.ip,
		isOperational:
			log.error instanceof AppError ? log.error.isOperational : false,
	};

	if (process.env.NODE_ENV === "production") {
		// In production, you would send this to your logging service
		// e.g., Winston, Pino, DataDog, etc.
		console.error(JSON.stringify(logEntry));
	} else {
		console.error("🚨 Error:", logEntry);
	}
}

// Prisma error mapper
function mapPrismaError(
	error: Prisma.PrismaClientKnownRequestError,
	requestId?: string,
): AppError {
	switch (error.code) {
		case "P2002": {
			// Unique constraint violation
			const target = error.meta?.target as string[] | undefined;
			const field = target?.[0] || "field";
			return ErrorFactory.database.constraintViolation(
				"unique_constraint",
				field,
				error.meta?.target,
				requestId,
			);
		}

		case "P2025":
			// Record not found
			return ErrorFactory.database.recordNotFound(
				"Record",
				"unknown",
				requestId,
			);

		case "P2003":
			// Foreign key constraint violation
			return ErrorFactory.database.constraintViolation(
				"foreign_key",
				(error.meta?.field_name as string) || "field",
				error.meta?.field_value,
				requestId,
			);

		case "P2034":
		case "P1008":
			// Query timeout
			return new AppError(
				ErrorCode.DB_QUERY_TIMEOUT,
				"Operação no banco de dados excedeu o tempo limite",
				504,
				undefined,
				true,
				requestId,
			);

		default:
			return ErrorFactory.system.internalError(error, requestId);
	}
}

// Main error handler wrapper
export function withErrorHandler<T extends unknown[]>(
	handler: (request: NextRequest, ...args: T) => Promise<NextResponse>,
) {
	return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
		const requestId = generateRequestId();

		// Add request ID to headers for tracing
		const headers = new Headers();
		headers.set("X-Request-ID", requestId);

		try {
			const response = await handler(request, ...args);

			// Add request ID to successful responses
			response.headers.set("X-Request-ID", requestId);

			return response;
		} catch (error) {
			// Map different error types
			let appError: AppError;

			if (error instanceof AppError) {
				appError = error;
			} else if (error instanceof Prisma.PrismaClientKnownRequestError) {
				appError = mapPrismaError(error, requestId);
			} else if (error instanceof Prisma.PrismaClientValidationError) {
				appError = ErrorFactory.validation.invalidFormat(
					"query",
					"unknown",
					"valid Prisma query",
					requestId,
				);
			} else if (
				error instanceof SyntaxError &&
				error.message.includes("JSON")
			) {
				appError = ErrorFactory.validation.invalidFormat(
					"body",
					"invalid JSON",
					"valid JSON",
					requestId,
				);
			} else {
				appError = ErrorFactory.system.internalError(error as Error, requestId);
			}

			// Log the error
			logError({
				requestId,
				method: request.method,
				url: request.url,
				error: appError,
				timestamp: new Date(),
				userAgent: request.headers.get("user-agent") || undefined,
				ip:
					request.headers.get("x-forwarded-for") ||
					request.headers.get("x-real-ip") ||
					undefined,
			});

			// Create error response
			const errorResponse = createErrorResponse(appError, requestId);

			return NextResponse.json(errorResponse, {
				status: appError.statusCode,
				headers,
			});
		}
	};
}

// Utility for API route error handling
export function handleApiError(
	error: unknown,
	requestId?: string,
): NextResponse {
	let appError: AppError;

	if (error instanceof AppError) {
		appError = error;
	} else if (error instanceof Prisma.PrismaClientKnownRequestError) {
		appError = mapPrismaError(error, requestId);
	} else {
		appError = ErrorFactory.system.internalError(error as Error, requestId);
	}

	const errorResponse = createErrorResponse(appError, requestId);

	return NextResponse.json(errorResponse, {
		status: appError.statusCode,
		headers: {
			"X-Request-ID": requestId || generateRequestId(),
		},
	});
}

// Auth error helpers
export function createAuthError(
	type: "missing" | "invalid" | "insufficient",
	details?: { requiredRole?: string },
	requestId?: string,
): AppError {
	switch (type) {
		case "missing":
			return ErrorFactory.auth.tokenMissing(requestId);
		case "invalid":
			return ErrorFactory.auth.tokenInvalid(requestId);
		case "insufficient":
			return ErrorFactory.auth.insufficientPermissions(
				details?.requiredRole || "unknown",
				requestId,
			);
		default:
			return ErrorFactory.auth.tokenInvalid(requestId);
	}
}

// Validation error helpers
export function createValidationError(
	field: string,
	value: unknown,
	expected?: string,
	requestId?: string,
): AppError {
	if (value === undefined || value === null || value === "") {
		return ErrorFactory.validation.requiredField(field, requestId);
	}

	return ErrorFactory.validation.invalidFormat(
		field,
		value,
		expected || "valid value",
		requestId,
	);
}

export { generateRequestId };
