-- Writer analytics: raw engagement events + daily rollup table.
CREATE TABLE "ArticleEvent" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "referrer" TEXT,
    "sessionHash" TEXT,

    CONSTRAINT "ArticleEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ArticleDailyStat" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "reactions" INTEGER NOT NULL DEFAULT 0,
    "bookmarks" INTEGER NOT NULL DEFAULT 0,
    "comments" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ArticleDailyStat_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ArticleEvent_articleId_createdAt_idx" ON "ArticleEvent"("articleId", "createdAt");
CREATE INDEX "ArticleEvent_createdAt_idx" ON "ArticleEvent"("createdAt");
CREATE UNIQUE INDEX "ArticleDailyStat_articleId_date_key" ON "ArticleDailyStat"("articleId", "date");

ALTER TABLE "ArticleEvent" ADD CONSTRAINT "ArticleEvent_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ArticleDailyStat" ADD CONSTRAINT "ArticleDailyStat_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;
