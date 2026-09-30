export type HealthStatus =
  | "healthy"
  | "needs_attention"
  | "critical"
  | "insufficient_data";

export type ProductSummary = {
  productId: string;
  name: string;
  category: string;
  metrics: {
    reviewCount: number;
    avgRating: number | null;
    negativePct: number | null;
  };
  health: { status: HealthStatus; label: string };
  topComplaint: string | null;
  flagged: boolean;
};

export type ProductDetail = ProductSummary & {
  summary: string;
  nextStep: string;
  highlightReview: { text: string; rating: number; sentiment: string } | null;
  topCategories: { category: string; count: number }[];
  sentimentBreakdown: { sentiment: string; count: number }[];
};

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  if (!response.ok) {
    throw new Error("Request fetch failed");
  }

  return response.json() as Promise<T>;
}

export const api = {
  products: () => fetchJson<{ products: ProductSummary[] }>("/api/products"),
  product: (productId: string) =>
    fetchJson<ProductDetail>(`/api/products/${productId}`),
  setFlag: (productId: string, flagged: boolean) =>
    fetchJson<{ productId: string; flagged: boolean }>(
      `/api/products/${productId}/flag`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flagged }),
      },
    ),
};
