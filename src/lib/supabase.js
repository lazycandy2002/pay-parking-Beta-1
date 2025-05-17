import { createClient } from '@supabase/supabase-js';

// Environment variables would be a better approach for these values
const SUPABASE_URL = 'https://dirmfvnynolngyhuyzxh.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpcm1mdm55bm9sbmd5aHV5enhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYyNDMzMzAsImV4cCI6MjA2MTgxOTMzMH0.vaK1jVWV7eMeDNbUJYzEcxsjur_iGZYTQ1juTg4GK0I';

/**
 * Create and export a Supabase client instance
 * In a production environment, these values should be in environment variables
 */
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/**
 * Handles Supabase errors in a consistent way
 * 
 * @param {Error} error - The error from Supabase
 * @param {string} context - Description of where the error occurred
 * @returns {string} User-friendly error message
 */
export function handleSupabaseError(error, context = 'operation') {
  console.error(`Supabase ${context} error:`, error);
  
  // Return appropriate user-friendly message based on error
  if (error.code === 'PGRST116') {
    return 'No data found.';
  } else if (error.code === '23505') {
    return 'A record with this information already exists.';
  } else if (error.code === '23503') {
    return 'This operation failed due to related data constraints.';
  }
  
  // Generic error message
  return `The ${context} could not be completed. Please try again later.`;
}