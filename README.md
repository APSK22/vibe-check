# 🧠 Vibe Check

An AI-powered quiz platform that lets you create quizzes instantly, discover personality insights, and share with friends.

**Live Demo:** [https://vibe-check-one.vercel.app/](https://vibe-check-one.vercel.app/)


<img width="1439" alt="Image" src="https://github.com/user-attachments/assets/f06603c8-d0d4-4cca-9684-5e54fac5e0db" />


## ✨ Features

## ✨ Key Features

### 🔧 AI-Powered Quiz Creation
- **Instant Generation**: Build complete quizzes on any topic in seconds.
- **Custom Difficulty**: Select from easy, medium, or hard levels.
- **Flexible Quiz Modes**: Choose between scored quizzes or personality-based “vibe checks”.
- **Smart Options**: Each question includes AI-generated, plausible multiple-choice answers.

### 👨‍🎓 User Experience
- **Interactive Dashboard**: Track and manage quizzes .
- **Responsive Design**: Optimized for desktop, tablet, and mobile use.
- **Real-Time Feedback**: Get immediate results post-quiz.
- **Progress Indicators**: Visual cues for quiz completion and time tracking.

### 🧠 Personality Analysis
- **AI-Powered Insights**: Personality reports based on quiz responses.
- **Trait Categorization**: Results grouped by traits and behavior types.
- **Visual Feedback**: Stylish animations and easy-to-understand summaries.

### 🧩 Backend
- **Supabase PostgreSQL**: Structured, scalable, and relational data storage.
- **Row-Level Security (RLS)**: Granular user-level data access protection.
- **Server Actions**: Handles secure logic like quiz scoring and AI integration.
- **Optimized APIs**: Clean endpoints for quiz data, submissions, and feedback.

### 📤 Sharing & Social Engagement
- **Public or Private Sharing**: Control visibility for each quiz.
- **Direct Links**: Share quizzes instantly with friends and colleagues via whatsapp/facebook/mail.
- **Attempt History**: View past attempts and results.

### 🔐 Security & Performance
- **Secure Auth**: Enterprise-grade sign-in using Clerk.
- **Optimized Loading**: Lightning-fast using Next.js App Router.

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 (App Router)
- **UI Components**: Radix UI + Tailwind CSS
- **Authentication**: Clerk
- **Database**: Supabase with PostgreSQL and Row-Level Security
- **AI Integration**: Google Gemini Flash 2.0
- **Animations**: Framer Motion
- **Form Handling**: React Hook Form + Zod validation
- **Deployment**: Vercel

## 📋 Quiz Types

1. **Scored Quiz**: Traditional quiz format with correct and incorrect answers
2. **Vibe Check**: Opinion-based quiz that analyzes your answers to determine your personality traits

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm/yarn
- Supabase account
- Clerk account 
- Google Gemini API key

### Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/vibe-check.git

# Navigate to the project directory
cd vibe-check

# Install dependencies
npm install

# Set up environment variables 

# Run development server
npm run dev
```

## 📝 Database Setup

The app includes a database migration tool accessible from the dashboard to set up required tables:

- quizzes
- questions
- options
- quiz_submissions
- vibe_results

## 📸 Screenshots

- **Dashboard View**: <img width="1440" alt="image" src="https://github.com/user-attachments/assets/67ec96dd-6847-4c6e-8783-b9c8bc892fea" />

- **Quiz Creator**: <img width="1440" alt="image" src="https://github.com/user-attachments/assets/cdea7173-b355-4d94-882e-dd1ba5e030e7" />

- **Quiz Taking**:<img width="1440" alt="image" src="https://github.com/user-attachments/assets/f2a76705-df35-465e-b6a4-6a0536790af7" />


- **Results Analysis**: <img width="1433" alt="image" src="https://github.com/user-attachments/assets/d2a2b2aa-6820-4111-9a6c-b5c78ae13ce6" />


## 🧑‍💻 Author

**Ajay Pratap Singh Kulharia**

- GitHub: [github.com/APSK22](https://github.com/APSK22)
- LinkedIn: [Ajay Pratap Singh Kulharia](https://www.linkedin.com/in/ajay-pratap-singh-kulharia-82b2192aa/)

## 📄 License

This project is licensed under the APACHE 2.0 License - see the LICENSE file for details.

---
