-- Add user roles: press team manages request statuses; journalists own requests.
CREATE TYPE "UserRole" AS ENUM ('PRESS', 'JOURNALIST');

ALTER TABLE "User" ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'JOURNALIST';
