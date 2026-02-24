/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    output: 'export',
    trailingSlash: true,
    images: {
        unoptimized: true,
    },
    webpack: (config, { dev }) => {
        if (dev) {
            config.cache = false;
        }
        return config;
    }
};

export default nextConfig;
