/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    // Ensure that only one version of React is bundled
    webpack: (config) => {
        config.resolve.alias = {
            ...config.resolve.alias,
            react: require.resolve('react'),
            'react-dom': require.resolve('react-dom'),
        };
        return config;
    },
};

module.exports = nextConfig;
