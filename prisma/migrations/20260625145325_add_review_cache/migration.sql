-- CreateTable
CREATE TABLE "ReviewCache" (
    "id" SERIAL NOT NULL,
    "shop" TEXT NOT NULL,
    "reviews" JSONB NOT NULL DEFAULT '[]',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReviewCache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ReviewCache_shop_key" ON "ReviewCache"("shop");
