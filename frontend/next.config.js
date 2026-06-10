/** Strip BOM / zero-width / non-printable chars and surrounding whitespace
 * from an env value, falling back when the result is empty. A leading U+FEFF
 * (common when env vars are set via PowerShell) turns an absolute API URL into
 * a relative path and silently breaks every fetch. URLs and keys are printable
 * ASCII, so dropping anything outside 0x20-0x7E is safe. */
const clean = (value, fallback = '') => {
  const v = String(value ?? '').replace(/[^\x20-\x7E]/g, '').trim()
  return v || fallback
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '**',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  env: {
    NEXT_PUBLIC_API_URL: clean(process.env.NEXT_PUBLIC_API_URL, 'http://localhost:8000'),
    NEXT_PUBLIC_SUPABASE_URL: clean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: clean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  },
}

module.exports = nextConfig