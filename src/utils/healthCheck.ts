// Health check utility to keep Supabase online
import { supabase } from './supabase';

export class SupabaseHealthCheck {
  private static instance: SupabaseHealthCheck;
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;

  static getInstance(): SupabaseHealthCheck {
    if (!SupabaseHealthCheck.instance) {
      SupabaseHealthCheck.instance = new SupabaseHealthCheck();
    }
    return SupabaseHealthCheck.instance;
  }

  // Start health checks every 5 minutes
  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('🟢 Starting Supabase health checks...');
    
    // Initial check
    this.performHealthCheck();
    
    // Then check every 5 minutes
    this.intervalId = setInterval(() => {
      this.performHealthCheck();
    }, 5 * 60 * 1000); // 5 minutes
  }

  // Stop health checks
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('🔴 Stopped Supabase health checks');
  }

  // Perform a simple health check
  private async performHealthCheck() {
    try {
      if (!supabase) {
        console.log('⚠️ Supabase not configured, skipping health check');
        return;
      }

      // Simple query to keep the connection alive
      const { data, error } = await supabase
        .from('memes')
        .select('id')
        .limit(1);

      if (error) {
        console.log('❌ Supabase health check failed:', error.message);
      } else {
        console.log('✅ Supabase health check passed');
      }
    } catch (error) {
      console.log('❌ Supabase health check error:', error);
    }
  }

  // Manual health check (can be called from UI)
  async manualCheck(): Promise<boolean> {
    try {
      if (!supabase) return false;

      const { error } = await supabase
        .from('memes')
        .select('id')
        .limit(1);

      return !error;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const supabaseHealthCheck = SupabaseHealthCheck.getInstance();
