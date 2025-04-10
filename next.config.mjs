import createNextIntlPlugin from "next-intl/plugin";

const path = require('path');

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        serverComponentsExternalPackages: ['@prisma/client', 'pg', 'bcrypt-edge'],
    },
    webpack: (config) => {
        config.resolve.alias.canvas = false;
        config.resolve.alias['@'] = path.resolve(__dirname, 'src');
        return config;
    }
};

export default withNextIntl(nextConfig);
