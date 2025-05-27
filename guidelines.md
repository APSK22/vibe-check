# Vibe Check - Project Guidelines

This document outlines the project architecture, conventions, and best practices used in the Vibe Check application.

## Table of Contents

- [Project Overview](#project-overview)
- [Folder Structure](#folder-structure)
- [Database Schema](#database-schema)
- [API Conventions](#api-conventions)
- [Authentication](#authentication)
- [Coding Standards](#coding-standards)
- [UI Components](#ui-components)

## Project Overview

Vibe Check is an AI-powered quiz platform built with Next.js 15, Supabase, and Google Gemini. The application allows users to create quizzes instantly using AI, discover personality insights, and share with friends.

## Folder Structure

```
vibe-check/
├── src/                      # Source code
│   ├── app/                  # Next.js App Router structure
│   │   ├── (auth)/           # Authentication pages
│   │   ├── (dashboard)/      # Dashboard pages
│   │   ├── api/              # API routes
│   │   │   ├── quiz/         # Quiz-related API endpoints
│   │   │   ├── user-info/    # User info API endpoints
│   │   │   └── webhooks/     # Webhook handlers
│   │   ├── quiz/             # Quiz pages
│   │   ├── layout.tsx        # Root layout
│   │   └── page.tsx          # Home page
│   ├── components/           # Reusable UI components
│   ├── hooks/                # Custom React hooks
│   ├── lib/                  # Utility functions and libraries
│   │   ├── supabase.ts       # Supabase client
│   │   ├── gemini.ts         # Google Gemini integration
│   │   └── utils.ts          # Helper functions
│   └── middleware.ts         # Next.js middleware
├── public/                   # Static assets
├── node_modules/             # Dependencies
└── package.json              # Project configuration
```

### Key Directories

- **app/**: Contains all pages and API routes following Next.js App Router structure
- **components/**: Reusable UI components organized by feature
- **lib/**: Utility functions, database clients, and external API integrations
- **hooks/**: Custom React hooks for shared logic

## Database Schema

The application uses Supabase with PostgreSQL for data storage. The schema includes the following tables:

### Users Table

```sql
CREATE TABLE users (
    id TEXT PRIMARY KEY, -- Clerk user ID
    email TEXT NOT NULL,
    username TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### Quizzes Table

```sql
CREATE TABLE quizzes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    created_by TEXT NOT NULL DEFAULT auth.jwt()->>'sub',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### Questions Table

```sql
CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    order_num INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### Options Table

```sql
CREATE TABLE options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
    option_text TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL DEFAULT FALSE,
    order_num INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### Quiz Submissions Table

```sql
CREATE TABLE quiz_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL DEFAULT auth.jwt()->>'sub',
    score INTEGER NOT NULL DEFAULT 0,
    max_score INTEGER NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### User Answers Table

```sql
CREATE TABLE user_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID REFERENCES quiz_submissions(id) ON DELETE CASCADE,
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
    selected_option_id UUID REFERENCES options(id) ON DELETE CASCADE,
    is_correct BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### Security Practices

- **Row Level Security (RLS)**: All tables have RLS policies enabled
- **Authentication**: Integration with Clerk for identity management
- **Authorization**: Custom policies control access to data based on user identity

## API Conventions

The API follows RESTful conventions and is organized under the `/api` directory.

### API Endpoints

- **GET /api/quiz**: Get list of quizzes
- **POST /api/quiz**: Create a new quiz
- **GET /api/quiz/[id]**: Get quiz by ID
- **PUT /api/quiz/[id]**: Update quiz
- **DELETE /api/quiz/[id]**: Delete quiz
- **POST /api/quiz/[id]/submit**: Submit quiz answers

### API Response Format

```typescript
// Success response
{
  data: any, // Response data
  message: string // Optional success message
}

// Error response
{
  error: {
    message: string, // Error message
    code: string // Optional error code
  }
}
```

### Error Handling

- Use appropriate HTTP status codes
- Include descriptive error messages
- Handle validation errors with proper response format

## Authentication

Authentication is handled via Clerk, which provides:

- User authentication (email, social logins)
- JWT validation
- Session management
- Protected routes

The authentication flow includes:

1. User sign-in/sign-up via Clerk
2. JWT verification via middleware
3. Row-level security in Supabase using JWT claims

## Coding Standards

### TypeScript

- Use proper types for all variables and function parameters
- Avoid `any` type unless absolutely necessary
- Create interfaces for complex data structures

### React Components

- Use functional components with hooks
- Break down complex components into smaller, reusable ones
- Keep components focused on a single responsibility

### State Management

- Use React's built-in state management (useState, useContext) for local state
- Server components for data fetching where appropriate
- React Query for complex data fetching and caching

## UI Components

The UI is built with:

- **Radix UI**: For accessible components
- **Tailwind CSS**: For styling
- **Framer Motion**: For animations

Component usage follows these principles:

- Consistent design across the application
- Responsive design for all screen sizes
- Accessibility compliance
- Reusable components with clear props interfaces

---

This guidelines document should be regularly updated as the project evolves. 