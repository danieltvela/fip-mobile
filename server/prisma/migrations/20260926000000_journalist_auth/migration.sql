-- CreateTable
CREATE TABLE "Journalist" (
    "id" TEXT NOT NULL,
    "credentialNumber" TEXT NOT NULL,
    "credentialHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "outlet" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "refreshTokenHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Journalist_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Journalist_credentialNumber_key" ON "Journalist"("credentialNumber");
