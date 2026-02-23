/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    OPENAI_BASE_URL: process.env.OPENAI_BASE_URL,
  },
  // Allow images from Kakao and Naver profile image URLs
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.kakaocdn.net' },
      { protocol: 'https', hostname: 'phinf.pstatic.net' },
    ],
  },
};

module.exports = nextConfig;
