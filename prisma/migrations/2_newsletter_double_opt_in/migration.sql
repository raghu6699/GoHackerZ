-- Double opt-in: single-use confirmation tokens for newsletter subscribers.
ALTER TABLE "NewsletterSub" ADD COLUMN "confirmToken" TEXT;
CREATE UNIQUE INDEX "NewsletterSub_confirmToken_key" ON "NewsletterSub"("confirmToken");
