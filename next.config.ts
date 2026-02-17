// next.config.js
const withNextIntl = require("next-intl/plugin")(
  "./app/i18n/request.ts" // 👈 adjust if your path is different
);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

module.exports = withNextIntl(nextConfig);
