/*
  # Auto-create tasks for new returns

  1. New Functions
    - `auto_create_return_task()` - Automatically creates a task when a return is inserted
    - Calculates priority based on return date proximity to current date
    - Links task to the same project and client as the return

  2. New Triggers
    - `auto_create_return_task_trigger` - Fires after return insert to create corresponding task

  3. Priority Logic
    - Less than 5 days away: High priority
    - 5-15 days away: Medium priority  
    - More than 15 days away: Low priority
*/

-- Function to automatically create a task when a return is created
CREATE OR REPLACE FUNCTION auto_create_return_task()
RETURNS TRIGGER AS $$
DECLARE
  days_until_return INTEGER;
  task_priority TEXT;
  task_title TEXT;
BEGIN
  -- Calculate days between today and return date
  days_until_return := NEW.return_date - CURRENT_DATE;
  
  -- Determine priority based on days until return
  IF days_until_return < 5 THEN
    task_priority := 'high';
    task_title := 'URGENT: Process Return - ' || NEW.reason;
  ELSIF days_until_return <= 15 THEN
    task_priority := 'medium';
    task_title := 'Process Return - ' || NEW.reason;
  ELSE
    task_priority := 'low';
    task_title := 'Upcoming Return - ' || NEW.reason;
  END IF;
  
  -- Create the task
  INSERT INTO tasks (
    project_id,
    client_id,
    title,
    description,
    status,
    priority,
    due_date,
    category,
    visible_to_client
  ) VALUES (
    NEW.project_id,
    NEW.client_id,
    task_title,
    'Auto-generated task for return request. Return ID: ' || NEW.id || '. Reason: ' || NEW.reason || '. Return date: ' || NEW.return_date || '. Please ensure this return is processed before the return date.',
    'pending',
    task_priority,
    NEW.return_date, -- Due date is the return date
    'administrative',
    false -- Not visible to client
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-create tasks for new returns
CREATE TRIGGER auto_create_return_task_trigger
  AFTER INSERT ON returns
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_return_task();