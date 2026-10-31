-- Limite de tentativas do código de primeiro acesso e de reenvio.
ALTER TABLE "users"
ADD COLUMN "activationFailedAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "activationLockedUntil" TIMESTAMP(3),
ADD COLUMN "activationResendCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "activationResendWindowStart" TIMESTAMP(3);
