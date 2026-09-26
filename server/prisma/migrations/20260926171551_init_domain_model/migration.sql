-- CreateEnum
CREATE TYPE "MaterialKind" AS ENUM ('NOTE', 'DOSSIER', 'IMAGE', 'VIDEO', 'AUDIO');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('CONFIRMED', 'PENDING', 'REJECTED');

-- CreateEnum
CREATE TYPE "NotificationTypology" AS ENUM ('PRESS_NOTE', 'AGENDA_CHANGE', 'INTERVIEW', 'PRIVATE_COMMUNICATION', 'INCIDENT');

-- CreateTable
CREATE TABLE "outlets" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "website" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "outlets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journalists" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT,
    "outletId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "journalists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "topics" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "topics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "press_materials" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "kind" "MaterialKind" NOT NULL,
    "body" TEXT,
    "mediaKey" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "press_materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "press_material_topics" (
    "materialId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,

    CONSTRAINT "press_material_topics_pkey" PRIMARY KEY ("materialId","topicId")
);

-- CreateTable
CREATE TABLE "agenda_items" (
    "id" TEXT NOT NULL,
    "parentId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agenda_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agenda_requests" (
    "id" TEXT NOT NULL,
    "journalistId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agenda_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credentials" (
    "id" TEXT NOT NULL,
    "journalistId" TEXT NOT NULL,
    "locatorCode" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "credentials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "journalistId" TEXT NOT NULL,
    "typology" "NotificationTypology" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "data" JSONB,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contact_messages" (
    "id" TEXT NOT NULL,
    "journalistId" TEXT NOT NULL,
    "authorStaffName" TEXT,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),

    CONSTRAINT "contact_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "outlets_name_key" ON "outlets"("name");

-- CreateIndex
CREATE UNIQUE INDEX "journalists_email_key" ON "journalists"("email");

-- CreateIndex
CREATE INDEX "journalists_outletId_idx" ON "journalists"("outletId");

-- CreateIndex
CREATE UNIQUE INDEX "topics_slug_key" ON "topics"("slug");

-- CreateIndex
CREATE INDEX "press_materials_kind_published_idx" ON "press_materials"("kind", "published");

-- CreateIndex
CREATE INDEX "agenda_items_parentId_idx" ON "agenda_items"("parentId");

-- CreateIndex
CREATE INDEX "agenda_items_startsAt_idx" ON "agenda_items"("startsAt");

-- CreateIndex
CREATE INDEX "agenda_requests_status_idx" ON "agenda_requests"("status");

-- CreateIndex
CREATE UNIQUE INDEX "agenda_requests_journalistId_itemId_key" ON "agenda_requests"("journalistId", "itemId");

-- CreateIndex
CREATE UNIQUE INDEX "credentials_locatorCode_key" ON "credentials"("locatorCode");

-- CreateIndex
CREATE INDEX "credentials_journalistId_idx" ON "credentials"("journalistId");

-- CreateIndex
CREATE INDEX "notifications_journalistId_createdAt_idx" ON "notifications"("journalistId", "createdAt");

-- CreateIndex
CREATE INDEX "contact_messages_journalistId_createdAt_idx" ON "contact_messages"("journalistId", "createdAt");

-- AddForeignKey
ALTER TABLE "journalists" ADD CONSTRAINT "journalists_outletId_fkey" FOREIGN KEY ("outletId") REFERENCES "outlets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "press_material_topics" ADD CONSTRAINT "press_material_topics_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "press_materials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "press_material_topics" ADD CONSTRAINT "press_material_topics_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agenda_items" ADD CONSTRAINT "agenda_items_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "agenda_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agenda_requests" ADD CONSTRAINT "agenda_requests_journalistId_fkey" FOREIGN KEY ("journalistId") REFERENCES "journalists"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agenda_requests" ADD CONSTRAINT "agenda_requests_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "agenda_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credentials" ADD CONSTRAINT "credentials_journalistId_fkey" FOREIGN KEY ("journalistId") REFERENCES "journalists"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_journalistId_fkey" FOREIGN KEY ("journalistId") REFERENCES "journalists"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contact_messages" ADD CONSTRAINT "contact_messages_journalistId_fkey" FOREIGN KEY ("journalistId") REFERENCES "journalists"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
