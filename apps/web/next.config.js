//@ts-check
const path = require('path');

 
const { composePlugins, withNx } = require('@nx/next');

/**
 * @type {import('@nx/next/plugins/with-nx').WithNxOptions}
 **/
const nextConfig = {
  // Use this to set Nx-specific options
  // See: https://nx.dev/recipes/next/next-config-setup
  nx: {},
  output: 'standalone',
  // Next 16 builds with Turbopack by default. Declaring a (currently empty)
  // turbopack config pairs with the webpack() hook below so the two builders
  // stay in sync; the `@` alias already resolves under Turbopack via tsconfig paths.
  turbopack: {},
  webpack(config) {
    config.resolve.alias['@'] = path.resolve(__dirname, 'src');
    return config;
  },
};

const plugins = [
  // Add more Next.js plugins to this list if needed.
  withNx,
];

module.exports = composePlugins(...plugins)(nextConfig);
