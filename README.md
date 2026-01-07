# Casita2.0 - Cat Feeding Tracker

A beautiful, responsive web application for tracking cat feeding schedules in a multi-person household. Built with Svelte, TypeScript, and Supabase.

## 🐾 Features

- **Real-time Updates** - Instant sync across all household members
- **Mobile Responsive** - Works perfectly on phones and tablets
- **Bilingual Support** - Spanish and English interface
- **Secure Authentication** - Row-level security with user tracking
- **Audit Logging** - Complete history of all feeding actions
- **Rate Limiting** - Prevents abuse and spam
- **Collapsible Cards** - Mobile-optimized UI with expandable feeding cards
- **Auto-collapse** - Completed feedings automatically collapse on mobile
- **Beautiful UI** - Modern design with smooth animations
- **Confirmation Modals** - Custom dialogs for destructive actions

## 🏠 How It Works

1. **Mark Feedings** - Tap "Mañana" (Morning) or "Tarde" (Evening) to record feeding
2. **Select Caretaker** - Choose who fed the cats from preset names or custom input
3. **Real-time Sync** - All household members see updates instantly
4. **History Tracking** - Complete feeding history with timestamps
5. **Day Reset** - Clear daily records with confirmation dialog

## 🛠 Tech Stack

### Frontend
- **Svelte** - Reactive UI framework
- **TypeScript** - Type safety
- **Vite** - Fast development server
- **CSS** - Custom styling with responsive design

### Backend
- **Supabase** - Backend as a Service
  - PostgreSQL database
  - Real-time subscriptions
  - Authentication
  - Row-Level Security (RLS)

## 📊 Database Schema

### Tables

#### `feeding_states`
```sql
- id: string (UUID)
- date: string (YYYY-MM-DD)
- slots: jsonb (feeding slot data)
- user_id: string (optional, for user tracking)
- created_at: timestamp
- updated_at: timestamp
```

#### `feeding_history`
```sql
- id: string (UUID)
- slot: 'morning' | 'evening'
- caretaker: string
- date: string (YYYY-MM-DD)
- timestamp: string (ISO 8601)
- user_id: string (optional, for user tracking)
```

#### `feeding_audit`
```sql
- id: string (UUID)
- table_name: string
- operation: 'INSERT' | 'UPDATE' | 'DELETE'
- user_id: string
- old_data: jsonb
- new_data: jsonb
- timestamp: timestamp
```

### Security Features

- **RLS Policies** - User-based access control
- **Household Sharing** - Collaborative feeding tracking
- **Audit Trail** - Complete action logging
- **Rate Limiting** - 5 changes/min for states, 10 changes/min for history

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- Supabase account
- Git

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/tatd3v/casita2.0.git
cd casita2.0
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up Supabase**
- Create a new Supabase project
- Run `database-schema.sql` in SQL Editor
- Run `rls-policies.sql` in SQL Editor
- Enable Realtime for `feeding_states` and `feeding_history`

4. **Configure environment**
```bash
# Copy the template
cp .env.example .env

# Add your Supabase credentials
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

5. **Start development**
```bash
npm run dev
```

Visit http://localhost:5173

## 🌍 Environment Setup

### Development Database

1. Create a separate Supabase project for development
2. Follow the setup steps in `DEV-SETUP-QUICK-START.md`
3. Use `.env.development` for dev credentials
4. Switch environments:
```bash
# Development
cp .env.development .env
npm run dev

# Production
cp .env.production .env
npm run dev
```

### Environment Files

- `.env` - Current environment (gitignored)
- `.env.development` - Development credentials (gitignored)
- `.env.production` - Production credentials (gitignored)

## 📱 Mobile Features

### Responsive Design
- **Collapsible Cards** - Tap headers to expand/collapse on mobile
- **Auto-collapse** - Completed feedings automatically collapse
- **Compact Badges** - Smaller badges on tiny devices
- **Touch-friendly** - Large tap targets and gestures

### Mobile Behavior
- **Desktop (>768px)**: Cards always expanded
- **Mobile (≤768px)**: Cards can collapse, auto-collapse when done

## 🔧 Development

### Project Structure
```
src/
├── lib/
│   ├── components/     # Svelte components
│   ├── storage.ts      # Supabase operations
│   ├── types.ts        # TypeScript definitions
│   └── copy.ts         # Localization strings
├── assets/             # Images and icons
└── App.svelte          # Main application
```

### Key Components
- **FeedingCard.svelte** - Individual feeding slot UI
- **HistoryList.svelte** - Feeding history display
- **ConfirmModal.svelte** - Custom confirmation dialog

### Scripts
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
```

## 🔒 Security

### Authentication
- Supabase Auth integration
- User-based access control
- Optional user tracking

### Data Protection
- Row-Level Security (RLS) policies
- Rate limiting per user
- Audit logging of all changes
- Environment variables gitignored

### Best Practices
- Never commit credentials
- Use separate dev/prod databases
- Regular security reviews

## 📚 Documentation

- `DEV-SETUP-QUICK-START.md` - Development environment setup
- `setup-dev-db.md` - Database configuration
- `switch-environment.md` - Environment switching
- `export-schema.md` - Database export guide

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is for personal/household use.

## 🐱 About

Built for Muchu & Apolo's casita to keep everyone synchronized on feeding times and prevent double feedings.
