/** @type {import('next').NextConfig} */
const remoteImageHosts = (process.env.NEXT_PUBLIC_IMAGE_HOSTS ||
  "cdn.shopify.com,images.unsplash.com")
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean);

const nextConfig = {
  poweredByHeader: false,
  compress: true,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      ...remoteImageHosts.map((host) => ({
        protocol: "https",
        hostname: host
      }))
    ]
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff"
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin"
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN"
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()"
          }
        ]
      }
    ];
  }
};

export default nextConfig;
