import { siteConfig } from "@/lib/site-config";

export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/admin/"]
    },
    sitemap: `${siteConfig.domain}/sitemap.xml`
  };
}

