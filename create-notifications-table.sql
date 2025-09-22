-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('auto_deposit', 'manual_deposit', 'withdrawal', 'goal_reached')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  amount DECIMAL(10, 2),
  bucket_id UUID REFERENCES buckets(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  read_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for performance
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = false;

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications" ON notifications
  FOR INSERT WITH CHECK (true);

-- Function to create auto deposit notification
CREATE OR REPLACE FUNCTION create_auto_deposit_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create notification for auto deposits
  IF NEW.is_auto_deposit = true THEN
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      amount,
      bucket_id,
      metadata
    )
    SELECT 
      b.user_id,
      'auto_deposit',
      'Auto deposit completed',
      'Successfully deposited $' || NEW.amount || ' to ' || b.name,
      NEW.amount,
      NEW.bucket_id,
      jsonb_build_object(
        'deposit_id', NEW.id,
        'bucket_name', b.name,
        'bucket_color', b.color
      )
    FROM buckets b
    WHERE b.id = NEW.bucket_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for auto deposit notifications
DROP TRIGGER IF EXISTS trigger_auto_deposit_notification ON deposits;
CREATE TRIGGER trigger_auto_deposit_notification
  AFTER INSERT ON deposits
  FOR EACH ROW
  EXECUTE FUNCTION create_auto_deposit_notification();

-- Function to mark notifications as read
CREATE OR REPLACE FUNCTION mark_notifications_read(notification_ids UUID[])
RETURNS VOID AS $$
BEGIN
  UPDATE notifications
  SET 
    is_read = true,
    read_at = TIMEZONE('utc', NOW())
  WHERE 
    id = ANY(notification_ids) AND
    user_id = auth.uid() AND
    is_read = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get unread notification count
CREATE OR REPLACE FUNCTION get_unread_notification_count()
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM notifications
    WHERE user_id = auth.uid() AND is_read = false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;