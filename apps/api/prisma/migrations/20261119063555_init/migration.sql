-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ARTIST', 'CUSTOMER');

-- CreateEnum
CREATE TYPE "ServiceType" AS ENUM ('FRAMED_ART', 'WALL_MURAL');

-- CreateEnum
CREATE TYPE "Complexity" AS ENUM ('SIMPLE', 'MEDIUM', 'COMPLEX');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING_QUOTE', 'AWAITING_DEPOSIT', 'DEPOSIT_PAID', 'SKETCHING', 'PAINTING', 'DELIVERING', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('SEPAY_VIETQR', 'CASH');

-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('TEXT', 'SKETCH_PROPOSAL', 'SYSTEM_EVENT');

-- CreateEnum
CREATE TYPE "SepayTxStatus" AS ENUM ('MATCHED', 'UNMATCHED_REVIEW');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "avatarUrl" TEXT,
    "role" "Role" NOT NULL DEFAULT 'CUSTOMER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArtistStudioConfig" (
    "id" TEXT NOT NULL DEFAULT 'default-config',
    "artistName" TEXT NOT NULL DEFAULT 'Họa sĩ Tuấn',
    "bio" TEXT NOT NULL,
    "experienceYears" INTEGER NOT NULL DEFAULT 8,
    "studioAddress" TEXT NOT NULL DEFAULT '123 Phố Tranh, Hoàn Kiếm, Hà Nội',
    "studioLat" DOUBLE PRECISION NOT NULL DEFAULT 21.028511,
    "studioLng" DOUBLE PRECISION NOT NULL DEFAULT 105.854444,
    "zaloUrl" TEXT NOT NULL DEFAULT 'https://zalo.me/0987654321',
    "messengerUrl" TEXT NOT NULL DEFAULT 'https://m.me/artistcommission',
    "hotline" TEXT NOT NULL DEFAULT '0987654321',
    "depositThreshold" DOUBLE PRECISION NOT NULL DEFAULT 1500000,
    "depositPercent" DOUBLE PRECISION NOT NULL DEFAULT 40,
    "minFramedAreaM2" DOUBLE PRECISION NOT NULL DEFAULT 0.2,
    "minMuralAreaM2" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "freeSketchRevisions" INTEGER NOT NULL DEFAULT 2,
    "freeKmRadius" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "feePerKm" DOUBLE PRECISION NOT NULL DEFAULT 15000,
    "simpleMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "mediumMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.35,
    "complexMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.8,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArtistStudioConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Material" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "serviceType" "ServiceType" NOT NULL,
    "basePricePerM2" DOUBLE PRECISION NOT NULL,
    "description" TEXT NOT NULL,
    "durabilityNote" TEXT,
    "sampleImageUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Material_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArtworkTemplate" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "images" TEXT[],
    "serviceType" "ServiceType" NOT NULL,
    "materialId" TEXT NOT NULL,
    "defaultComplexity" "Complexity" NOT NULL DEFAULT 'MEDIUM',
    "dimensionsNote" TEXT,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArtworkTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "orderCode" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "serviceType" "ServiceType" NOT NULL,
    "templateId" TEXT,
    "customReferenceUrls" TEXT[],
    "widthCm" DOUBLE PRECISION NOT NULL,
    "heightCm" DOUBLE PRECISION NOT NULL,
    "materialId" TEXT NOT NULL,
    "complexity" "Complexity" NOT NULL DEFAULT 'MEDIUM',
    "frameOption" TEXT,
    "address" TEXT NOT NULL,
    "distanceKm" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "shippingOrTravelFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "artworkPrice" DOUBLE PRECISION NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "requireDeposit" BOOLEAN NOT NULL DEFAULT false,
    "depositAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "paidAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'SEPAY_VIETQR',
    "status" "OrderStatus" NOT NULL DEFAULT 'AWAITING_DEPOSIT',
    "revisionCount" INTEGER NOT NULL DEFAULT 0,
    "sketchApprovedAt" TIMESTAMP(3),
    "scheduledStartDate" TIMESTAMP(3),
    "scheduledEndDate" TIMESTAMP(3),
    "cancellationReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderMessage" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "attachmentUrls" TEXT[],
    "messageType" "MessageType" NOT NULL DEFAULT 'TEXT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SepayTransaction" (
    "id" TEXT NOT NULL,
    "sepayTxId" TEXT NOT NULL,
    "orderId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "transferContent" TEXT NOT NULL,
    "gateway" TEXT NOT NULL,
    "rawPayload" JSONB NOT NULL,
    "status" "SepayTxStatus" NOT NULL DEFAULT 'UNMATCHED_REVIEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SepayTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Material_slug_key" ON "Material"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ArtworkTemplate_slug_key" ON "ArtworkTemplate"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderCode_key" ON "Order"("orderCode");

-- CreateIndex
CREATE UNIQUE INDEX "SepayTransaction_sepayTxId_key" ON "SepayTransaction"("sepayTxId");

-- AddForeignKey
ALTER TABLE "ArtworkTemplate" ADD CONSTRAINT "ArtworkTemplate_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ArtworkTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderMessage" ADD CONSTRAINT "OrderMessage_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderMessage" ADD CONSTRAINT "OrderMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SepayTransaction" ADD CONSTRAINT "SepayTransaction_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
