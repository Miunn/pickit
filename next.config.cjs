import createNextIntlPlugin from "next-intl/plugin";
import path from 'path';

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack(config) {
        config.resolve.alias['@'] = path.resolve(__dirname, 'src');
        return config;
    },
    experimental: {
        serverComponentsExternalPackages: ['@prisma/client', 'pg', 'bcrypt-edge'],
    }
};

export default withNextIntl(nextConfig);
