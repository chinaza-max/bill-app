/** @type {import('next').NextConfig} */
import withPWA from 'next-pwa';

const nextConfig = {
  // Your existing config options can stay here
};

const withPWAConfig = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable:true //process.env.NODE_ENV === 'development'
});

export default withPWAConfig(nextConfig);