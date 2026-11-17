import type { NextConfig } from "next";

const supabaseStorageUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const storageRemotePattern = supabaseStorageUrl
  ? (() => {
      try {
        const parsed = new URL(supabaseStorageUrl);
        const shared = {
          protocol: parsed.protocol.replace(":", "") as "http" | "https",
          hostname: parsed.hostname,
          port: parsed.port,
        };
        return [
          {
            ...shared,
            pathname: "/storage/v1/object/public/**",
          },
          {
            ...shared,
            pathname: "/storage/v1/object/sign/**",
          },
        ];
      } catch {
        return null;
      }
    })()
  : null;

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    // 图片上限 5MB，另为 multipart 编码与其余表单字段留出余量
    serverActions: {
      bodySizeLimit: "6mb",
    },
  },
  outputFileTracingExcludes: {
    "/*": ["./work/**/*", "./output/**/*", "./.playwright-cli/**/*"],
  },
  images: {
    remotePatterns: storageRemotePattern ?? [],
  },
};

export default nextConfig;
