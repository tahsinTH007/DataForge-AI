import { Router } from "express";
import { queryDatabricks } from "../databricks/sql.js";
import { CATALOG } from "../config.js";
import { parseComplaintCategory } from "../utils/complaintCategory.js";
import { computeHealthStatus, healthLabel } from "../health/rules.js";

export const productsRouter = Router();

type MetricsRow = {
  review_count: number | null;
  avg_rating: number | null;
  negative_pct: number | null;
};

type ProductListRow = MetricsRow & {
  product_id: string;
  name: string;
  category: string;
  top_complaint: string | null;
};

function buildProductMetrics(row: MetricsRow | undefined) {
  const productMetrics = {
    reviewCount: Number(row?.review_count ?? 0),
    avgRating: row?.avg_rating !== null ? Number(row?.avg_rating) : null,
    negativePct: row?.negative_pct !== null ? Number(row?.negative_pct) : null,
  };

  const healthStatus = computeHealthStatus(productMetrics);

  return {
    metrics: productMetrics,
    health: { status: healthStatus, label: healthLabel(healthStatus) },
  };
}

const METRICS_SUBQUERY = `
  SELECT
    enriched.product_id,
    COUNT(*) AS review_count,
    AVG(review.rating) AS avg_rating,
    100.0 * SUM(CASE WHEN enriched.sentiment = 'negative' THEN 1 ELSE 0 END) / COUNT(*) AS negative_pct
  FROM ${CATALOG}.core.enriched_reviews enriched
  JOIN ${CATALOG}.core.reviews review ON enriched.review_id = review.review_id
  GROUP BY enriched.product_id
`;

productsRouter.get("/products", async (_req, res) => {
  try {
    const productRows = await queryDatabricks<ProductListRow>(
      `
        SELECT
        product.product_id,
        product.name,
        product.category,
        metrics.review_count,
        metrics.avg_rating,
        metrics.negative_pct,
        (
          SELECT enriched.complaint_category
          FROM ${CATALOG}.core.enriched_reviews enriched
          WHERE enriched.product_id = product.product_id
            AND enriched.complaint_category IS NOT NULL
          GROUP BY enriched.complaint_category
          ORDER BY COUNT(*) DESC
          LIMIT 1
        ) AS top_complaint
      FROM ${CATALOG}.core.products product
      LEFT JOIN (${METRICS_SUBQUERY}) metrics ON product.product_id = metrics.product_id
      ORDER BY product.name
            
            `,
    );

    res.json({
      products: productRows.map((product) => ({
        productId: product.product_id,
        name: product.name,
        category: product.category,
        ...buildProductMetrics(product),
        topComplaint: parseComplaintCategory(product.top_complaint),
        flagged: false,
      })),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load products";
    res.status(500).json({ error: message });
  }
});
