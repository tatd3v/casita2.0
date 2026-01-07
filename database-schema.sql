-- Create feeding_states table
CREATE TABLE feeding_states (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date TEXT NOT NULL UNIQUE,
  slots JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create feeding_history table  
CREATE TABLE feeding_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slot TEXT NOT NULL,
  caretaker TEXT NOT NULL,
  date TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_feeding_states_date ON feeding_states(date);
CREATE INDEX idx_feeding_history_date ON feeding_history(date);
CREATE INDEX idx_feeding_history_slot ON feeding_history(slot);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE feeding_states;
ALTER PUBLICATION supabase_realtime ADD TABLE feeding_history;
