import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export const config = {
  matcher: [
    /*
     * Match all paths except for:
     * 1. /api routes
     * 2. /_next (Next.js internals)
     * 3. /_static (inside /public)
     * 4. all root files inside /public (e.g. /favicon.ico)
     */
    '/((?!api/|_next/|_static/|_vercel|[\\w-]+\\.\\w+).*)',
  ],
}

export default function middleware(req: NextRequest) {
  const url = req.nextUrl
  
  // Get hostname of request (e.g. demo.vercel.pub, demo.localhost:3000)
  const hostname = req.headers.get('host') || 'thecosmofolio.com'

  // Only rewrite if it's NOT the main domain
  const isCustomDomain = 
    !hostname.includes('localhost') && 
    !hostname.includes('thecosmofolio.com') &&
    !hostname.includes('cosmofolio.vercel.app') &&
    !hostname.endsWith('.vercel.app') // Ignore standard Vercel deploy URLs

  if (isCustomDomain) {
    // Rewrite everything to /domain/[domain]/[path]
    return NextResponse.rewrite(new URL(`/domain/${hostname}${url.pathname}`, req.url))
  }

  return NextResponse.next()
}
