/** @type {import('next').NextConfig} */
/* eslint-disable @typescript-eslint/no-var-requires */

const { PHASE_DEVELOPMENT_SERVER } = require('next/constants');
const webpack = require('webpack');

// 检测是否为 Cloudflare Pages 构建
const isCloudflare = process.env.CF_PAGES === '1' || process.env.BUILD_TARGET === 'cloudflare';

const optimizedPackageImports = [
  '@dnd-kit/core',
  '@dnd-kit/modifiers',
  '@dnd-kit/sortable',
  '@dnd-kit/utilities',
  '@heroicons/react',
  'lucide-react',
  'react-icons',
];

const serverExternalPackages = [
  '@upstash/redis',
  // @upstash/redis depends on uncrypto, whose package exports include a
  // workerd condition. OpenNext needs it traced as a full external package,
  // otherwise .open-next may contain package.json without dist/crypto.web.mjs.
  'uncrypto',
  '@vercel/postgres',
  'better-sqlite3',
  'cheerio',
  'nodemailer',
  'pg',
  'redis',
  'socket.io',
  'xml2js',
  'xpath',
];

// 仅在开发环境或 Cloudflare 环境下排除 6b85c446 和 706b2fe 引入的 external 包；
// 其它未来加入的 server external 包不受影响。
const buildExcludedServerExternalPackages = [
  '@upstash/redis',
  'uncrypto',
  '@vercel/postgres',
  'better-sqlite3',
  'cheerio',
  'nodemailer',
  'pg',
  'redis',
  'socket.io',
  'xml2js',
  'xpath',
];

const createNextConfig = (phase) => {
  const isDevelopment = phase === PHASE_DEVELOPMENT_SERVER || process.env.NODE_ENV === 'development';
  const effectiveServerExternalPackages =
    isDevelopment || isCloudflare
      ? serverExternalPackages.filter((pkg) => !buildExcludedServerExternalPackages.includes(pkg))
      : serverExternalPackages;

  const nextConfig = {
  // Cloudflare Pages 不支持 standalone，使用默认输出
  output: isCloudflare ? undefined : 'standalone',
  eslint: {
    dirs: ['src'],
    // 在生产构建时忽略 ESLint 错误
    ignoreDuringBuilds: true,
  },

  reactStrictMode: false,
  swcMinify: true,

  experimental: {
    instrumentationHook: process.env.NODE_ENV === 'production' && !isCloudflare,
    optimizePackageImports: optimizedPackageImports,
    ...(effectiveServerExternalPackages.length
      ? { serverComponentsExternalPackages: effectiveServerExternalPackages }
      : {}),
    webpackBuildWorker: !isCloudflare,
  },

  // Uncoment to add domain whitelist
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },

  webpack(config, { isServer }) {
    // Grab the existing rule that handles SVG imports
    const fileLoaderRule = config.module.rules.find((rule) =>
      rule.test?.test?.('.svg')
    );

    config.module.rules.push(
      // Reapply the existing rule, but only for svg imports ending in ?url
      {
        ...fileLoaderRule,
        test: /\.svg$/i,
        resourceQuery: /url/, // *.svg?url
      },
      // Convert all other *.svg imports to React components
      {
        test: /\.svg$/i,
        issuer: { not: /\.(css|scss|sass)$/ },
        resourceQuery: { not: /url/ }, // exclude if *.svg?url
        loader: '@svgr/webpack',
        options: {
          dimensions: false,
          titleProp: true,
        },
      }
    );

    // Modify the file loader rule to ignore *.svg, since we have it handled now.
    fileLoaderRule.exclude = /\.svg$/i;

    config.resolve.fallback = {
      ...config.resolve.fallback,
      net: false,
      tls: false,
      crypto: false,
    };

    // Cloudflare 使用 D1，不需要把 better-sqlite3 原生模块带入 Worker 产物。
    if (isCloudflare) {
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /^better-sqlite3$/,
        })
      );
      config.resolve.alias = {
        ...config.resolve.alias,
        'better-sqlite3': false,
      };
      config.externals = (config.externals || []).filter((external) => {
        return !(
          external &&
          typeof external === 'object' &&
          Object.prototype.hasOwnProperty.call(external, 'better-sqlite3')
        );
      });
    }

    // Exclude better-sqlite3, D1, and Postgres modules from client-side bundle
    if (!isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        'better-sqlite3': 'commonjs better-sqlite3',
        '@vercel/postgres': 'commonjs @vercel/postgres',
        'pg': 'commonjs pg',
      });

      config.resolve.alias = {
        ...config.resolve.alias,
        'better-sqlite3': false,
        '@/lib/d1.db': false,
        '@/lib/d1-adapter': false,
        '@/lib/postgres.db': false,
        '@/lib/postgres-adapter': false,
      };
    }

    return config;
  },
};

  // next-pwa runs an additional webpack pass that is not needed for the
  // Cloudflare/OpenNext worker bundle and can make Cloudflare builds fail with
  // a generic "Build failed because of webpack errors" message.
  if (isDevelopment || isCloudflare) {
    return nextConfig;
  }

  const withPWA = require('next-pwa')({
    dest: 'public',
    register: true,
    skipWaiting: true,
  });

  return withPWA(nextConfig);
};

module.exports = createNextConfig;
