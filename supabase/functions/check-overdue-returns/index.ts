import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface Return {
  id: string;
  project_id: string;
  client_id: string;
  reason: string;
  status: string;
  return_date: string;
  created_at: string;
}

interface Task {
  id: string;
  project_id: string;
  client_id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  due_date: string;
  category: string;
  visible_to_client: boolean;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // Initialize Supabase client with service role key for admin operations
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const now = new Date();
    const fiveDaysAgo = new Date(now.getTime() - (5 * 24 * 60 * 60 * 1000));
    const tenDaysAgo = new Date(now.getTime() - (10 * 24 * 60 * 60 * 1000));

    console.log('🔍 Checking for overdue returns...', {
      now: now.toISOString(),
      fiveDaysAgo: fiveDaysAgo.toISOString(),
      tenDaysAgo: tenDaysAgo.toISOString()
    });

    // Get all pending returns that are overdue
    const { data: overdueReturns, error: returnsError } = await supabase
      .from('returns')
      .select('*')
      .in('status', ['pending', 'processed'])
      .lt('return_date', now.toISOString().split('T')[0]);

    if (returnsError) {
      console.error('❌ Error fetching returns:', returnsError);
      throw returnsError;
    }

    console.log('🔍 Found overdue returns:', overdueReturns?.length || 0);

    if (!overdueReturns || overdueReturns.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: 'No overdue returns found',
          processed: 0
        }),
        {
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }

    // Get existing tasks to avoid duplicates
    const { data: existingTasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .like('title', '%Return Follow-up%');

    if (tasksError) {
      console.error('❌ Error fetching existing tasks:', tasksError);
      throw tasksError;
    }

    const existingTaskReturnIds = new Set(
      existingTasks?.map(task => {
        const match = task.description.match(/Return ID: ([a-f0-9-]+)/);
        return match ? match[1] : null;
      }).filter(Boolean) || []
    );

    let tasksCreated = 0;
    let tasksUpdated = 0;

    for (const returnItem of overdueReturns) {
      const returnDate = new Date(returnItem.return_date);
      const daysSinceReturn = Math.floor((now.getTime() - returnDate.getTime()) / (1000 * 60 * 60 * 24));
      
      console.log('🔍 Processing return:', {
        id: returnItem.id,
        returnDate: returnItem.return_date,
        daysSinceReturn,
        status: returnItem.status
      });

      // Skip if return is already exchanged, refunded, or completed
      if (['exchanged', 'refunded', 'completed'].includes(returnItem.status)) {
        continue;
      }

      // Check if we already have a task for this return
      if (existingTaskReturnIds.has(returnItem.id)) {
        // Update existing task priority if needed
        const existingTask = existingTasks?.find(task => 
          task.description.includes(`Return ID: ${returnItem.id}`)
        );
        
        if (existingTask && daysSinceReturn >= 5 && existingTask.priority !== 'high') {
          console.log('🔄 Updating task priority to high for return:', returnItem.id);
          
          const { error: updateError } = await supabase
            .from('tasks')
            .update({ 
              priority: 'high',
              title: `URGENT: Return Follow-up - ${returnItem.reason}`
            })
            .eq('id', existingTask.id);

          if (updateError) {
            console.error('❌ Error updating task priority:', updateError);
          } else {
            tasksUpdated++;
          }
        }
        continue;
      }

      // Determine priority based on days since return (for overdue returns)
      let priority = 'medium'; // Default for overdue returns
      let titlePrefix = '';
      
      if (daysSinceReturn >= 5) {
        priority = 'high';
        titlePrefix = 'URGENT: ';
      }

      // Create new task for this overdue return
      const taskData = {
        project_id: returnItem.project_id,
        client_id: returnItem.client_id,
        title: `${titlePrefix}Return Follow-up - ${returnItem.reason}`,
        description: `OVERDUE: Return request has been pending for ${daysSinceReturn} days past the return date. Return ID: ${returnItem.id}. Reason: ${returnItem.reason}. Original return date: ${returnItem.return_date}. Please process this return immediately or contact the client.`,
        status: 'pending',
        priority: priority,
        due_date: new Date(now.getTime() + (2 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0], // Due in 2 days
        category: 'administrative',
        visible_to_client: false
      };

      console.log('📝 Creating task for return:', {
        returnId: returnItem.id,
        priority,
        daysSinceReturn,
        taskTitle: taskData.title
      });

      const { error: taskError } = await supabase
        .from('tasks')
        .insert(taskData);

      if (taskError) {
        console.error('❌ Error creating task for return:', returnItem.id, taskError);
      } else {
        tasksCreated++;
        console.log('✅ Created task for return:', returnItem.id);
      }
    }

    const result = {
      message: 'Overdue returns check completed',
      processed: overdueReturns.length,
      tasksCreated,
      tasksUpdated,
      timestamp: now.toISOString()
    };

    console.log('✅ Overdue returns check completed:', result);

    return new Response(
      JSON.stringify(result),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );

  } catch (error) {
    console.error('❌ Error in check-overdue-returns function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
});