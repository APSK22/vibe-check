// Function to test Supabase configuration
export async function testSupabaseConfig() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    console.log('Supabase Configuration Check:');
    console.log('NEXT_PUBLIC_SUPABASE_URL exists:', !!supabaseUrl);
    console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY exists:', !!supabaseKey);

    // Return configuration status
    return {
      isConfigured: !!supabaseUrl && !!supabaseKey,
      supabaseUrl,
      hasKey: !!supabaseKey
    };
  } catch (error) {
    console.error('Error checking Supabase config:', error);
    return { isConfigured: false, error };
  }
}

// Function to test Clerk configuration
export function testClerkConfig() {
  try {
    const clerkPubKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
    const clerkSecretKey = process.env.CLERK_SECRET_KEY;
    const signInUrl = process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL;
    const signUpUrl = process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL;
    const afterSignInUrl = process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL;
    const afterSignUpUrl = process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL;

    console.log('Clerk Configuration Check:');
    console.log('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY exists:', !!clerkPubKey);
    console.log('CLERK_SECRET_KEY exists:', !!clerkSecretKey);
    console.log('NEXT_PUBLIC_CLERK_SIGN_IN_URL:', signInUrl);
    console.log('NEXT_PUBLIC_CLERK_SIGN_UP_URL:', signUpUrl);
    console.log('NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL:', afterSignInUrl);
    console.log('NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL:', afterSignUpUrl);

    // Return configuration status
    return {
      isConfigured: !!clerkPubKey && !!clerkSecretKey,
      hasPublishableKey: !!clerkPubKey,
      hasSecretKey: !!clerkSecretKey,
      signInUrl,
      signUpUrl,
      afterSignInUrl,
      afterSignUpUrl
    };
  } catch (error) {
    console.error('Error checking Clerk config:', error);
    return { isConfigured: false, error };
  }
}

// Function to test the integration between Clerk and Supabase
export async function testClerkSupabaseIntegration() {
  // This is a placeholder for testing the actual integration
  // In a real implementation, this would test webhook configurations, etc.
  const clerkConfig = testClerkConfig();
  const supabaseConfig = await testSupabaseConfig();

  console.log('Integration Check:');
  console.log('Clerk configured:', clerkConfig.isConfigured);
  console.log('Supabase configured:', supabaseConfig.isConfigured);
  console.log('Both services configured:', clerkConfig.isConfigured && supabaseConfig.isConfigured);

  return {
    clerkConfigured: clerkConfig.isConfigured,
    supabaseConfigured: supabaseConfig.isConfigured,
    fullyConfigured: clerkConfig.isConfigured && supabaseConfig.isConfigured
  };
} 