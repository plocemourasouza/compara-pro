/**
 * Sistema de Error Handling Granular - PriceCompare
 * Códigos de erro padronizados para melhor debugging e monitoramento
 */

export enum ErrorCode {
	// Authentication & Authorization (1000-1999)
	AUTH_TOKEN_MISSING = "AUTH_1001",
	AUTH_TOKEN_INVALID = "AUTH_1002",
	AUTH_TOKEN_EXPIRED = "AUTH_1003",
	AUTH_CREDENTIALS_INVALID = "AUTH_1004",
	AUTH_USER_NOT_FOUND = "AUTH_1005",
	AUTH_INSUFFICIENT_PERMISSIONS = "AUTH_1006",
	AUTH_ACCOUNT_DISABLED = "AUTH_1007",
	AUTH_PASSWORD_WEAK = "AUTH_1008",

	// Validation Errors (2000-2999)
	VALIDATION_REQUIRED_FIELD = "VAL_2001",
	VALIDATION_INVALID_FORMAT = "VAL_2002",
	VALIDATION_OUT_OF_RANGE = "VAL_2003",
	VALIDATION_DUPLICATE_VALUE = "VAL_2004",
	VALIDATION_FILE_TOO_LARGE = "VAL_2005",
	VALIDATION_UNSUPPORTED_FORMAT = "VAL_2006",

	// Database Errors (3000-3999)
	DB_CONNECTION_FAILED = "DB_3001",
	DB_QUERY_TIMEOUT = "DB_3002",
	DB_CONSTRAINT_VIOLATION = "DB_3003",
	DB_RECORD_NOT_FOUND = "DB_3004",
	DB_TRANSACTION_FAILED = "DB_3005",
	DB_MIGRATION_ERROR = "DB_3006",

	// Business Logic Errors (4000-4999)
	BUSINESS_COMPANY_NOT_FOUND = "BIZ_4001",
	BUSINESS_USER_NOT_IN_COMPANY = "BIZ_4002",
	BUSINESS_UPLOAD_ALREADY_ACTIVE = "BIZ_4003",
	BUSINESS_COMPARISON_NOT_FOUND = "BIZ_4004",
	BUSINESS_PREORDER_ALREADY_EXISTS = "BIZ_4005",
	BUSINESS_INSUFFICIENT_STOCK = "BIZ_4006",
	BUSINESS_PRICE_MISMATCH = "BIZ_4007",
	BUSINESS_MATCHING_FAILED = "BIZ_4008",

	// File Processing Errors (5000-5999)
	FILE_UPLOAD_FAILED = "FILE_5001",
	FILE_PROCESSING_ERROR = "FILE_5002",
	FILE_INVALID_STRUCTURE = "FILE_5003",
	FILE_EMPTY_CONTENT = "FILE_5004",
	FILE_ENCODING_ERROR = "FILE_5005",
	FILE_SIZE_EXCEEDED = "FILE_5006",

	// External Service Errors (6000-6999)
	SERVICE_UNAVAILABLE = "SVC_6001",
	SERVICE_TIMEOUT = "SVC_6002",
	SERVICE_RATE_LIMITED = "SVC_6003",
	SERVICE_API_ERROR = "SVC_6004",

	// System Errors (9000-9999)
	SYSTEM_INTERNAL_ERROR = "SYS_9001",
	SYSTEM_MAINTENANCE = "SYS_9002",
	SYSTEM_OVERLOADED = "SYS_9003",
	SYSTEM_CONFIG_ERROR = "SYS_9004",
}

export interface ErrorDetail {
	field?: string;
	value?: unknown;
	constraint?: string;
	expected?: unknown;
	metadata?: Record<string, unknown>;
}

export class AppError extends Error {
	public readonly code: ErrorCode;
	public readonly statusCode: number;
	public readonly isOperational: boolean;
	public readonly details?: ErrorDetail[];
	public readonly timestamp: Date;
	public readonly requestId?: string;

	constructor(
		code: ErrorCode,
		message: string,
		statusCode: number = 500,
		details?: ErrorDetail[],
		isOperational: boolean = true,
		requestId?: string,
	) {
		super(message);

		this.code = code;
		this.statusCode = statusCode;
		this.isOperational = isOperational;
		this.details = details;
		this.timestamp = new Date();
		this.requestId = requestId;

		// Ensure proper prototype chain
		Object.setPrototypeOf(this, AppError.prototype);

		// Capture stack trace
		Error.captureStackTrace(this, this.constructor);
	}

	toJSON() {
		return {
			code: this.code,
			message: this.message,
			statusCode: this.statusCode,
			details: this.details,
			timestamp: this.timestamp,
			requestId: this.requestId,
			...(process.env.NODE_ENV === "development" && { stack: this.stack }),
		};
	}
}

// Error Factory Functions
// biome-ignore lint/complexity/noStaticOnlyClass: intentional static factory namespace
export class ErrorFactory {
	static auth = {
		tokenMissing: (requestId?: string) =>
			new AppError(
				ErrorCode.AUTH_TOKEN_MISSING,
				"Token de autorização necessário",
				401,
				undefined,
				true,
				requestId,
			),

		tokenInvalid: (requestId?: string) =>
			new AppError(
				ErrorCode.AUTH_TOKEN_INVALID,
				"Token de autorização inválido",
				401,
				undefined,
				true,
				requestId,
			),

		credentialsInvalid: (requestId?: string) =>
			new AppError(
				ErrorCode.AUTH_CREDENTIALS_INVALID,
				"Credenciais inválidas",
				401,
				undefined,
				true,
				requestId,
			),

		insufficientPermissions: (requiredRole: string, requestId?: string) =>
			new AppError(
				ErrorCode.AUTH_INSUFFICIENT_PERMISSIONS,
				"Permissões insuficientes para esta operação",
				403,
				[{ field: "role", expected: requiredRole }],
				true,
				requestId,
			),
	};

	static validation = {
		requiredField: (field: string, requestId?: string) =>
			new AppError(
				ErrorCode.VALIDATION_REQUIRED_FIELD,
				`Campo obrigatório: ${field}`,
				400,
				[{ field, constraint: "required" }],
				true,
				requestId,
			),

		invalidFormat: (
			field: string,
			value: unknown,
			expected: string,
			requestId?: string,
		) =>
			new AppError(
				ErrorCode.VALIDATION_INVALID_FORMAT,
				`Formato inválido para ${field}`,
				400,
				[{ field, value, expected }],
				true,
				requestId,
			),

		fileTooLarge: (size: number, maxSize: number, requestId?: string) =>
			new AppError(
				ErrorCode.VALIDATION_FILE_TOO_LARGE,
				`Arquivo muito grande. Tamanho: ${size}MB, Máximo: ${maxSize}MB`,
				400,
				[{ field: "file", value: size, expected: maxSize }],
				true,
				requestId,
			),
	};

	static business = {
		companyNotFound: (companyId: string, requestId?: string) =>
			new AppError(
				ErrorCode.BUSINESS_COMPANY_NOT_FOUND,
				"Empresa não encontrada",
				404,
				[{ field: "companyId", value: companyId }],
				true,
				requestId,
			),

		comparisonNotFound: (comparisonId: string, requestId?: string) =>
			new AppError(
				ErrorCode.BUSINESS_COMPARISON_NOT_FOUND,
				"Comparação não encontrada",
				404,
				[{ field: "comparisonId", value: comparisonId }],
				true,
				requestId,
			),

		uploadAlreadyActive: (companyId: string, requestId?: string) =>
			new AppError(
				ErrorCode.BUSINESS_UPLOAD_ALREADY_ACTIVE,
				"Já existe um upload ativo para esta empresa",
				409,
				[{ field: "companyId", value: companyId }],
				true,
				requestId,
			),

		matchingFailed: (
			reason: string,
			metadata?: Record<string, unknown>,
			requestId?: string,
		) =>
			new AppError(
				ErrorCode.BUSINESS_MATCHING_FAILED,
				`Falha no matching: ${reason}`,
				422,
				[{ metadata }],
				true,
				requestId,
			),
	};

	static database = {
		recordNotFound: (entity: string, id: string, requestId?: string) =>
			new AppError(
				ErrorCode.DB_RECORD_NOT_FOUND,
				`${entity} não encontrado`,
				404,
				[{ field: "id", value: id }],
				true,
				requestId,
			),

		constraintViolation: (
			constraint: string,
			field: string,
			value: unknown,
			requestId?: string,
		) =>
			new AppError(
				ErrorCode.DB_CONSTRAINT_VIOLATION,
				"Violação de restrição do banco de dados",
				409,
				[{ field, value, constraint }],
				true,
				requestId,
			),
	};

	static file = {
		processingError: (filename: string, error: string, requestId?: string) =>
			new AppError(
				ErrorCode.FILE_PROCESSING_ERROR,
				`Erro ao processar arquivo: ${error}`,
				422,
				[{ field: "filename", value: filename, metadata: { error } }],
				true,
				requestId,
			),

		invalidStructure: (
			filename: string,
			expected: string[],
			found: string[],
			requestId?: string,
		) =>
			new AppError(
				ErrorCode.FILE_INVALID_STRUCTURE,
				"Estrutura do arquivo inválida",
				400,
				[{ field: "filename", value: filename, expected, metadata: { found } }],
				true,
				requestId,
			),
	};

	static system = {
		internalError: (_error: Error, requestId?: string) =>
			new AppError(
				ErrorCode.SYSTEM_INTERNAL_ERROR,
				"Erro interno do servidor",
				500,
				undefined,
				false,
				requestId,
			),
	};
}

// Error Response Helper
export function createErrorResponse(
	error: AppError | Error,
	requestId?: string,
) {
	if (error instanceof AppError) {
		return {
			success: false,
			error: {
				code: error.code,
				message: error.message,
				details: error.details,
				timestamp: error.timestamp,
				requestId: error.requestId || requestId,
			},
		};
	}

	// Handle unexpected errors
	const appError = ErrorFactory.system.internalError(error, requestId);
	return {
		success: false,
		error: {
			code: appError.code,
			message: appError.message,
			timestamp: appError.timestamp,
			requestId: appError.requestId || requestId,
		},
	};
}

// Type guard
export function isAppError(error: unknown): error is AppError {
	return error instanceof AppError;
}
