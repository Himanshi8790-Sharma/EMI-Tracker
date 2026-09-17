-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('paid', 'missed');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100),
    "email" VARCHAR(150) NOT NULL,
    "phone" VARCHAR(15),
    "password_hash" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loans" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "loan_name" VARCHAR(100),
    "total_amount" DECIMAL(10,2),
    "emi_amount" DECIMAL(10,2),
    "total_emis" INTEGER,
    "interest_rate" DECIMAL(5,2),
    "start_date" DATE,
    "next_due_date" DATE,
    "payer_type" VARCHAR(50),
    "payer_name" VARCHAR(100),
    "payer_phone" VARCHAR(15),
    "payer_email" VARCHAR(150),
    "notes" TEXT,
    "is_active" BOOLEAN,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "remaining_emis" INTEGER,
    "color" VARCHAR(20),

    CONSTRAINT "loans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" SERIAL NOT NULL,
    "loan_id" INTEGER,
    "amount_paid" DECIMAL(10,2),
    "emi_number" INTEGER,
    "paid_by" VARCHAR(100),
    "payment_date" DATE,
    "notes" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'paid',

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reminders" (
    "id" SERIAL NOT NULL,
    "loan_id" INTEGER,
    "user_id" INTEGER,
    "reminder_type" VARCHAR(50),
    "sent_to" VARCHAR(150),
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" VARCHAR(50),

    CONSTRAINT "reminders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- AddForeignKey
ALTER TABLE "loans" ADD CONSTRAINT "loans_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_loan_id_fkey" FOREIGN KEY ("loan_id") REFERENCES "loans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_loan_id_fkey" FOREIGN KEY ("loan_id") REFERENCES "loans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
