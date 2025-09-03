import process from "node:process";
/** @type {import('next').NextConfig} */
const basePath = process.env.BASE_PATH || "";
const nextConfig = {
  basePath: basePath,
  assetPrefix: basePath ? `${basePath}/` : "",
  images: { unoptimized: true },
  trailingSlash: true,
};
export default nextConfig;
