/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  env: {
    NEXT_PUBLIC_APP_NAME: 'SEO Specialist Chat',
  },
}

module.exports = nextConfig
