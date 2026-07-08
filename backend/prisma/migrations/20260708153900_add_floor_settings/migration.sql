-- CreateTable
CREATE TABLE "floor_settings" (
    "id" TEXT NOT NULL,
    "building" VARCHAR(50) NOT NULL,
    "floor" VARCHAR(50) NOT NULL,
    "cols" INTEGER NOT NULL DEFAULT 4,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "floor_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "floor_settings_building_floor_key" ON "floor_settings"("building", "floor");
