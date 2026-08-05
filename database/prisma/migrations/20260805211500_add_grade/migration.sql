-- CreateTable
CREATE TABLE "grade_components" (
    "id" UUID NOT NULL,
    "subject_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "max_score" DECIMAL(5,2) NOT NULL DEFAULT 10,
    "weight_percent" DECIMAL(5,2) NOT NULL,
    "exam_date" DATE,
    "note" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "grade_components_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grades" (
    "id" UUID NOT NULL,
    "grade_component_id" UUID NOT NULL,
    "score" DECIMAL(5,2),
    "graded_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "grades_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "grade_components_subject_id_sort_order_idx" ON "grade_components"("subject_id", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "grades_grade_component_id_key" ON "grades"("grade_component_id");

-- AddCheckConstraint
ALTER TABLE "grade_components"
    ADD CONSTRAINT "grade_components_max_score_check"
    CHECK ("max_score" > 0);

-- AddCheckConstraint
ALTER TABLE "grade_components"
    ADD CONSTRAINT "grade_components_weight_percent_check"
    CHECK ("weight_percent" >= 0 AND "weight_percent" <= 100);

-- AddCheckConstraint
ALTER TABLE "grades"
    ADD CONSTRAINT "grades_score_check"
    CHECK ("score" IS NULL OR "score" >= 0);

-- AddForeignKey
ALTER TABLE "grade_components" ADD CONSTRAINT "grade_components_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grades" ADD CONSTRAINT "grades_grade_component_id_fkey" FOREIGN KEY ("grade_component_id") REFERENCES "grade_components"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateView
-- Current subject average uses only grade components that already have a score:
-- SUM(score * weight_percent) / SUM(weight_percent).
CREATE VIEW "subject_grade_summaries" AS
SELECT
    gc."subject_id",
    COUNT(gc."id") AS "component_count",
    COUNT(g."id") FILTER (WHERE g."score" IS NOT NULL) AS "scored_component_count",
    COALESCE(SUM(gc."weight_percent") FILTER (WHERE g."score" IS NOT NULL), 0) AS "scored_weight_percent",
    CASE
        WHEN SUM(gc."weight_percent") FILTER (WHERE g."score" IS NOT NULL) IS NULL
          OR SUM(gc."weight_percent") FILTER (WHERE g."score" IS NOT NULL) = 0
        THEN NULL
        ELSE
            SUM(g."score" * gc."weight_percent") FILTER (WHERE g."score" IS NOT NULL)
            / NULLIF(SUM(gc."weight_percent") FILTER (WHERE g."score" IS NOT NULL), 0)
    END AS "current_average"
FROM "grade_components" gc
LEFT JOIN "grades" g ON g."grade_component_id" = gc."id"
GROUP BY gc."subject_id";

COMMENT ON VIEW "subject_grade_summaries" IS
'Current subject average view. Required final exam score is calculated in backend service, not persisted in database.';
