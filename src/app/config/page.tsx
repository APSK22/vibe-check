"use client";

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

interface ConfigStatus {
  supabaseUrl: boolean;
  supabaseKey: boolean;
  geminiKey: boolean;
  connectionStatus: 'untested' | 'success' | 'error';
  error?: string;
  isLoading: boolean;
}

export default function ConfigPage() {
  const [status, setStatus] = useState<ConfigStatus>({
    supabaseUrl: false,
    supabaseKey: false,
    geminiKey: false,
    connectionStatus: 'untested',
    isLoading: true
  });

  const testConnection = async () => {
    setStatus(prev => ({ ...prev, isLoading: true }));
    try {
      const response = await fetch('/api/test-supabase');
      const data = await response.json();
      
      console.log('Test API response:', data);
      
      if (data.status === 'success') {
        setStatus({
          supabaseUrl: data.environmentCheck.supabaseUrl,
          supabaseKey: data.environmentCheck.supabaseKey,
          geminiKey: data.environmentCheck.geminiKey,
          connectionStatus: 'success',
          isLoading: false
        });
      } else {
        setStatus({
          supabaseUrl: data.environmentCheck?.supabaseUrl || false,
          supabaseKey: data.environmentCheck?.supabaseKey || false,
          geminiKey: data.environmentCheck?.geminiKey || false,
          connectionStatus: 'error',
          error: data.error || 'Unknown error',
          isLoading: false
        });
      }
    } catch (error) {
      console.error('Error testing connection:', error);
      setStatus(prev => ({ 
        ...prev, 
        connectionStatus: 'error', 
        error: error instanceof Error ? error.message : 'Failed to connect to test API',
        isLoading: false 
      }));
    }
  };

  useEffect(() => {
    testConnection();
  }, []);

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold text-white mb-8">Vibe Check Configuration</h1>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Environment Variables Status</CardTitle>
          <CardDescription>
            Check if your environment variables are properly configured
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status.isLoading ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <span>Supabase URL</span>
                    {status.supabaseUrl ? (
                      <span className="text-green-500">✓</span>
                    ) : (
                      <span className="text-red-500">✗</span>
                    )}
                  </Label>
                  <div className="text-sm text-blue-200">
                    {status.supabaseUrl ? 'Configured properly.' : 'Missing or invalid.'}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <span>Supabase Anon Key</span>
                    {status.supabaseKey ? (
                      <span className="text-green-500">✓</span>
                    ) : (
                      <span className="text-red-500">✗</span>
                    )}
                  </Label>
                  <div className="text-sm text-blue-200">
                    {status.supabaseKey ? 'Configured properly.' : 'Missing or invalid.'}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <span>Google Gemini API Key</span>
                    {status.geminiKey ? (
                      <span className="text-green-500">✓</span>
                    ) : (
                      <span className="text-red-500">✗</span>
                    )}
                  </Label>
                  <div className="text-sm text-blue-200">
                    {status.geminiKey ? 'Configured properly.' : 'Missing or invalid.'}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <span>Connection Status</span>
                    {status.connectionStatus === 'success' ? (
                      <span className="text-green-500">✓</span>
                    ) : status.connectionStatus === 'error' ? (
                      <span className="text-red-500">✗</span>
                    ) : (
                      <span className="text-yellow-500">?</span>
                    )}
                  </Label>
                  <div className="text-sm text-blue-200">
                    {status.connectionStatus === 'success' 
                      ? 'Connection successful.' 
                      : status.connectionStatus === 'error' 
                        ? `Connection failed: ${status.error}` 
                        : 'Not tested yet.'}
                  </div>
                </div>
              </div>
              
              {(status.connectionStatus === 'error' || !status.supabaseUrl || !status.supabaseKey || !status.geminiKey) && (
                <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-md text-white mt-4">
                  <p className="font-medium mb-2">Configuration Issue Detected</p>
                  <p className="text-sm mb-2">
                    One or more environment variables are missing or the Supabase connection failed.
                  </p>
                  <ul className="list-disc pl-5 text-sm space-y-1">
                    {!status.supabaseUrl && (
                      <li>NEXT_PUBLIC_SUPABASE_URL is missing</li>
                    )}
                    {!status.supabaseKey && (
                      <li>NEXT_PUBLIC_SUPABASE_ANON_KEY is missing</li>
                    )}
                    {!status.geminiKey && (
                      <li>GOOGLE_GEMINI_API_KEY is missing</li>
                    )}
                    {status.connectionStatus === 'error' && status.error && (
                      <li>Connection error: {status.error}</li>
                    )}
                  </ul>
                </div>
              )}
            </>
          )}
        </CardContent>
        <CardFooter>
          <Button 
            onClick={testConnection} 
            disabled={status.isLoading}
            className="w-full"
          >
            {status.isLoading ? 'Testing...' : 'Retest Connection'}
          </Button>
        </CardFooter>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Setup Instructions</CardTitle>
          <CardDescription>
            Follow these steps to set up your environment variables
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-lg font-medium text-white">1. Create a .env.local file</h3>
            <p className="text-sm text-blue-200">
              In the root of your project, create a file named <code className="bg-gray-800 px-2 py-1 rounded">.env.local</code>
            </p>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-medium text-white">2. Add Supabase Configuration</h3>
            <p className="text-sm text-blue-200 mb-2">
              Get your Supabase URL and anon key from your Supabase project dashboard
            </p>
            <div className="bg-gray-800 p-3 rounded-md font-mono text-sm whitespace-pre text-white overflow-x-auto">
              NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
              NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-medium text-white">3. Add Google Gemini API Key (optional)</h3>
            <p className="text-sm text-blue-200 mb-2">
              Get your API key from the Google AI Studio dashboard
            </p>
            <div className="bg-gray-800 p-3 rounded-md font-mono text-sm whitespace-pre text-white overflow-x-auto">
              GOOGLE_GEMINI_API_KEY=your-gemini-api-key
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-medium text-white">4. Restart the development server</h3>
            <p className="text-sm text-blue-200">
              Stop and restart your Next.js development server to apply the changes
            </p>
            <div className="bg-gray-800 p-3 rounded-md font-mono text-sm whitespace-pre text-white overflow-x-auto">
              npm run dev
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 