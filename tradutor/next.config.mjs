/** @type {import('next').NextConfig} */
const nextConfig = {
    env: {
        NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL,
        NEXT_PUBLIC_APP_ENV: process.env.REACT_APP_ENV,
    }
};

export default nextConfig;
