/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep Anthropic SDK and Supabase server client out of the browser bundle
  serverExternalPackages: ['@anthropic-ai/sdk'],
}

export default nextConfig
