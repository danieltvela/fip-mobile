-- Press room smart search (issues #8, #9): Material model backing GET /materials.

-- CreateEnum
CREATE TYPE "MaterialType" AS ENUM ('note', 'dossier', 'image', 'video', 'audio');

-- CreateEnum
CREATE TYPE "MaterialTopic" AS ENUM ('events', 'forums', 'agenda', 'institutional', 'other');

-- CreateTable
CREATE TABLE "materials" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "MaterialType" NOT NULL,
    "topic" "MaterialTopic" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "materials_pkey" PRIMARY KEY ("id")
);
