import { supabase } from '../lib/supabase';

/**
 * Check for overdue returns and create tasks automatically
 * This function can be called from the frontend to trigger the check
 */
export async function checkOverdueReturns(): Promise<{
  success: boolean;
  message: string;
  tasksCreated?: number;
  tasksUpdated?: number;
}> {
  try {
    console.log('🔍 Triggering overdue returns check...');
    
    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-overdue-returns`;
    
    const headers = {
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    };

    const response = await fetch(apiUrl, { 
      method: 'POST',
      headers 
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('✅ Overdue returns check result:', result);
    
    return {
      success: true,
      message: result.message,
      tasksCreated: result.tasksCreated,
      tasksUpdated: result.tasksUpdated
    };
    
  } catch (error) {
    console.error('❌ Error checking overdue returns:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Manually trigger overdue returns check from the UI
 * This can be called from admin pages or dashboard
 */
export async function triggerOverdueReturnsCheck(): Promise<void> {
  const result = await checkOverdueReturns();
  
  if (result.success) {
    const message = `Check completed! Created ${result.tasksCreated || 0} new tasks, updated ${result.tasksUpdated || 0} existing tasks.`;
    alert(message);
  } else {
    alert(`Error: ${result.message}`);
  }
}