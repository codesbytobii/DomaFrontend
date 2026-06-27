/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // R2 / external avatars later — kept permissive for mock-data phase
  images: { remotePatterns: [{ protocol: "https", hostname: "**" }] },
};

export default nextConfig;
