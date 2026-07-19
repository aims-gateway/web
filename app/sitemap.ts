import { MetadataRoute } from "next";
import { locales } from "@/i18n/navigation";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

const paths = [
  { path: "", priority: 1.0 },
  { path: "/login", priority: 0.6 },
  { path: "/marketplace", priority: 0.8 },
  { path: "/marketplace/1", priority: 0.7 },
  { path: "/marketplace/2", priority: 0.7 },
  { path: "/marketplace/3", priority: 0.7 },
  { path: "/marketplace/4", priority: 0.7 },
  { path: "/marketplace/5", priority: 0.7 },
  { path: "/marketplace/6", priority: 0.7 },
  { path: "/dashboard", priority: 0.5 },
  { path: "/settlements", priority: 0.5 },
  { path: "/agreements", priority: 0.5 },
  { path: "/route", priority: 0.5 },
  { path: "/api-station", priority: 0.5 },
  { path: "/reseller", priority: 0.4 },
  { path: "/profile", priority: 0.5 },
  { path: "/developer/register", priority: 0.5 },
  { path: "/developer/ip-vault", priority: 0.4 },
  { path: "/admin", priority: 0.3 },
  { path: "/admin/api-config", priority: 0.3 },
  { path: "/admin/transactions", priority: 0.3 },
  { path: "/admin/pricing", priority: 0.3 },
  { path: "/admin/forum", priority: 0.3 },
  { path: "/admin/delegation", priority: 0.3 },

  { path: "/admin/alliance", priority: 0.3 },
  { path: "/admin/ip-vault", priority: 0.3 },
  { path: "/admin/workers", priority: 0.3 },
  { path: "/admin/arbitration", priority: 0.3 },
  { path: "/admin/blacklist", priority: 0.3 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    for (const { path, priority } of paths) {
      entries.push({
        url: `${BASE_URL}/${locale}${path}`,
        lastModified: new Date(),
        changeFrequency: path.startsWith("/admin")
          ? "monthly"
          : "weekly",
        priority,
        alternates: {
          languages: Object.fromEntries(
            locales.map((l) => [l, `${BASE_URL}/${l}${path}`])
          ),
        },
      });
    }
  }

  return entries;
}
