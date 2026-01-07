# Supabase Database Setup

## 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project" 
3. Sign up/login with GitHub
4. Create new project (choose free tier)
5. Wait for project to be ready (2-3 minutes)

## 2. Get Your Credentials
1. In your Supabase dashboard, go to Settings → API
2. Copy the **Project URL** and **anon public** key
3. Create a `.env` file in your project root:
```
VITE_SUPABASE_URL=your_project_url_here
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

## 3. Create Database Tables
Go to the SQL Editor in your Supabase dashboard and run these queries:

```sql
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
```

## 4. Install Dependencies
```bash
npm install @supabase/supabase-js
```

## 5. Update Environment
Make sure your `.env` file is in the project root with the correct values from step 2.

## 6. Start Development
```bash
npm run dev
```

Your app now has:
- ✅ Real-time sync across all devices
- ✅ Persistent data storage
- ✅ Offline fallback (will sync when online)
- ✅ Free hosting with Supabase

## Features Added
- **Multi-device sync**: Changes appear instantly on all devices
- **Real-time updates**: No need to refresh
- **Data persistence**: Data saved in PostgreSQL database
- **History tracking**: Complete feeding history
- **Free tier**: 500MB database, 50k users/month
