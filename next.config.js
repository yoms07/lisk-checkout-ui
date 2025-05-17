/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        hostname: '**',
      },
    ],
    dangerouslyAllowSVG: true,
  }
};

module.exports = nextConfig;
