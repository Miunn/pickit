import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'storage.googleapis.com',
                port: '',
                pathname: '/echomori-drive-bucket/**',
            },
            {
                protocol: 'https',
                hostname: 'storage.googleapis.com',
                port: '',
                pathname: '/echomori-drive-bucket-staging/**',
            },
            {
                protocol: 'https',
                hostname: 'storage.googleapis.com',
                port: '',
                pathname: '/echomori-drive-bucket-prod/**',
            },
        ],
    },
    experimental: {
        serverComponentsExternalPackages: ['@prisma/client', 'pg', 'bcrypt-edge'],
    }
};

export default withNextIntl(nextConfig);
