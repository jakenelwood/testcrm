'use client';

import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import supabase from '@/utils/supabase/client';

interface DevelopmentModeBannerProps {
  message?: string;
  showRefreshButton?: boolean;
  onRefresh?: () => void;
}

export function DevelopmentModeBanner({
  message = "Using mock data because database tables don't exist yet. Data changes won't be saved to the database.",
  showRefreshButton = true,
  onRefresh
}: DevelopmentModeBannerProps) {
  const [isDatabaseConnected, setIsDatabaseConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [databaseStatus, setDatabaseStatus] = useState<string>("Checking database connection...");

  useEffect(() => {
    const checkDatabaseConnection = async () => {
      try {
        // Try to query the leads table to check if it exists and is accessible
        const { data, error } = await supabase
          .from('leads')
          .select('id')
          .limit(1);

        if (error) {
          if (error.code === '42P01') {
            setDatabaseStatus("Database connected but 'leads' table doesn't exist. Using mock data.");
          } else if (error.code === 'PGRST116') {
            setDatabaseStatus("Database connected but permission denied. Using mock data.");
          } else {
            setDatabaseStatus(`Database error: ${error.message}. Using mock data.`);
          }
          setIsDatabaseConnected(false);
        } else {
          setDatabaseStatus("Connected to Supabase database. Some tables may be missing or have permission issues.");
          setIsDatabaseConnected(true);
        }
      } catch (err) {
        console.error('Error checking database connection:', err);
        setDatabaseStatus("Error connecting to database. Using mock data.");
        setIsDatabaseConnected(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkDatabaseConnection();
  }, []);

  // Always show the banner in development mode
  const isDev = process.env.NODE_ENV === 'development';

  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    } else {
      window.location.reload();
    }
  };

  // If not in development mode, don't show the banner
  if (!isDev) {
    return null;
  }

  return (
    <div className="bg-amber-100 border border-amber-300 rounded-lg p-3 mb-4 flex items-center justify-between">
      <div className="flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div>
          <span className="font-medium text-amber-800">Development Mode</span>
          <p className="text-sm text-amber-700">
            {isLoading ? "Checking database connection..." : isDatabaseConnected ? message : databaseStatus}
          </p>
        </div>
      </div>
      {showRefreshButton && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          className="bg-white hover:bg-amber-50 border-amber-300 text-amber-800 hover:text-amber-900"
        >
          Refresh
        </Button>
      )}
    </div>
  );
}
