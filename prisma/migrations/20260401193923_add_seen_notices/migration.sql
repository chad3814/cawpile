-- CreateTable
CREATE TABLE "SeenNotice" (
    "id" TEXT NOT NULL,
    "noticeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "seenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SeenNotice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SeenNotice_userId_idx" ON "SeenNotice"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SeenNotice_userId_noticeId_key" ON "SeenNotice"("userId", "noticeId");

-- AddForeignKey
ALTER TABLE "SeenNotice" ADD CONSTRAINT "SeenNotice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
