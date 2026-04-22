/** @type {import('next').NextConfig} */
const nextConfig = {
  // serverComponentsExternalPackages moved out of experimental in Next 14.1+
  serverExternalPackages: ["exceljs", "@react-pdf/renderer"],

  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options",        value: "DENY"    },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
