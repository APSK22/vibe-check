# 🧠 Vibe Check

An AI-powered quiz platform that lets you create quizzes instantly, discover personality insights, and share with friends.

**Live Demo:** [https://vibe-check-one.vercel.app/](https://vibe-check-one.vercel.app/)


<img width="1439" alt="Image" src="https://github.com/user-attachments/assets/f06603c8-d0d4-4cca-9684-5e54fac5e0db" />


## ✨ Features

- **🪄 AI Quiz Generation**: Create complete quizzes on any topic in seconds using Google Gemini Flash 2.0
- **🧠 Personality Analysis**: Get AI-powered insights about your personality based on quiz answers
- **🔒 Secure Authentication**: Enterprise-grade authentication with Clerk
- **🚀 Modern UI**: Responsive and animated interface built with Radix UI and Tailwind CSS
- **📊 Quiz Dashboard**: Manage your quizzes with statistics and attempt history
- **🔍 Detailed Results**: View color-coded answers and expandable details for each attempt
- **📱 Mobile Friendly**: Fully functional on all devices with adaptive layouts

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

# Set up environment variables (see env-template.txt)

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

- **Dashboard View**: [Screenshot]
- **Quiz Creator**: [Screenshot]
- **Results Analysis**: [Screenshot]

## 🧑‍💻 Author

**Ajay Pratap Singh Kulharia**

- GitHub: [github.com/ajaykulharia](https://github.com/ajaykulharia)
- LinkedIn: [linkedin.com/in/ajaykulharia](https://linkedin.com/in/ajaykulharia)

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

Made with ❤️ and AI
