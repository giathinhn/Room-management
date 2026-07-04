-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "cancel_reason" TEXT,
ADD COLUMN     "check_in_reminder_sent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "check_in_time" TIMESTAMP(3),
ADD COLUMN     "check_in_warning_sent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "checked_in" BOOLEAN NOT NULL DEFAULT false;
