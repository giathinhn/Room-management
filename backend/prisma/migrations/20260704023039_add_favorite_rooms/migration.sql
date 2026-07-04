-- CreateTable
CREATE TABLE "_UserFavoriteRooms" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_UserFavoriteRooms_AB_unique" ON "_UserFavoriteRooms"("A", "B");

-- CreateIndex
CREATE INDEX "_UserFavoriteRooms_B_index" ON "_UserFavoriteRooms"("B");

-- AddForeignKey
ALTER TABLE "_UserFavoriteRooms" ADD CONSTRAINT "_UserFavoriteRooms_A_fkey" FOREIGN KEY ("A") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserFavoriteRooms" ADD CONSTRAINT "_UserFavoriteRooms_B_fkey" FOREIGN KEY ("B") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
