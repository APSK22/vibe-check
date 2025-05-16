import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Create a matcher for public routes - fixing the static file pattern
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/(.*)',
  '/quiz/take/(.*)',
  '/_next/(.*)',
  '/favicon.ico',
  '/(.*).jpg',
  '/(.*).png',
  '/(.*).gif',
  '/(.*).ico',
  '/(.*).svg',
  '/(.*).css',
  '/(.*).js'
]);

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }
  
  // Get auth session data
  const { userId } = await auth();
  
  // If the user is not signed in and the route is protected, redirect to sign-in
  if (!userId) {
    const signInUrl = new URL('/sign-in', req.url);
    return NextResponse.redirect(signInUrl);
  }
  
  return NextResponse.next();
});

export const config = {
  matcher: '/(.*)',
}; 