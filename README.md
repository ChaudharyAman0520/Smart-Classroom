# Smart Classroom Attendance System (SCAS)

An interactive, elegant, full-stack application designed to simplify classroom attendance logging, roster enrollment, and student engagement. Built with React (Vite) on the frontend and Express on the backend, styled with a modern, high-contrast Tailind CSS design system.

---

## 🚀 Core Features

### 👨‍🏫 For Teachers
- **Comprehensive Dashboard**: View key statistics including overall attendance rate, top student performers, active classrooms, and prompt activity logs.
- **Roster Enrollment**: Register new students with simple, readable everyday codes (e.g., `C01` for Classrooms, `S01` for Students, and `ENR-XXXX` for enrollment IDs) instead of complex database IDs.
- **Attendance Registry**: Record daily student attendance safely with real-time state persistence, automatic session indicators, and toggle inputs (`Present` / `Absent`).
- **Interactive Analytics**: Identify attendance trends, spot at-risk students who have frequent absences, and optimize lecture hours.

### 🎓 For Students
- **Check Attendance**: Log in with an email and simulated OTP to view current attendance percentages on active classes.
- **Visual Performance Trackers**: Follow detailed progress meters and visual notifications explaining your status in enrolled courses.

---

## 🛠️ Tech Stack & Architecture

- **Frontend**: [React 18](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite](https://vite.dev/)
- **Routing & Icons**: [React Router](https://reactrouter.com/) and [Lucide React](https://lucide.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with smooth animations and transitions
- **Backend / Mock Proxy Server**: [Express](https://expressjs.com/) and Node.js serving robust local persistent stores during development and proxying endpoints
- **Validation**: Strict TypeScript types coupled with custom middleware error handlers

---

## 🗂️ Project Structure

The project splits concerns clearly between full-stack server routines and client interfaces:

```text
├── backend/                  # Monolith backend API controllers & routing
│   ├── controllers/          # Request validation, business logic, and custom OTP management
│   ├── models/               # Abstract database and collection layers (User, Classroom, Attendance)
│   ├── routes/               # Clean Express Router routes for auth, classrooms, and sessions
│   ├── services/             # Dynamic email and simulation transmission services
│   └── utils/                # Standard app errors and global handler utilities
├── src/                      # Vite Frontend Application
│   ├── components/           # Reusable UI components (Modals, Loaders, Layouts)
│   ├── pages/                # Main page layouts (Login, TeacherDashboard, StudentProfile)
│   ├── types.ts              # Global standard TypeScript interfaces
│   ├── index.css             # Entry point for Tailwind imports & global font definitions
│   └── main.tsx              # React mounting root
├── server.ts                 # Main full-stack development Express entry point
├── package.json              # Bundling commands and third-party dependencies config
└── .env.example              # Template directory environment variables list
```

---

## ⚙️ Setup and Installation

### 1. Prerequisite Dependencies
Verify that you have [Node.js](https://nodejs.org/) installed locally (v18 or higher recommended).

### 2. Environment Configuration
Duplicate the configuration template to establish environment parameters:
```bash
cp .env.example .env
```
Declare your necessary secrets inside `.env` if requested by secondary mail dispatch features.

### 3. Installation
Install core packages and update local libraries automatically:
```bash
npm install
```

### 4. Running the App
Start the high-performance local development server:
```bash
npm run dev
```
The application will boot successfully on `http://localhost:3000`.

---

## 🔑 Demo Access Profiles

For debugging or auditing the interface, use the following pre-established developer login emails with standard password credentials:

| Role | Email Address | Default Password |
|---|---|---|
| **Teacher** | `teacher@scas.edu` | `password` |
| **Student** | `john@scas.edu` | `password` |
| **Student** | `alice@scas.edu` | `password` |

---

## ☁️ Deployment Guidelines

The application is structured to support seamless full-stack deployment on modern cloud environments.

### 📐 Deploying to Vercel (Serverless Edge)

This project is custom-configured with a modern hybrid Vercel setup using serverless functions and CDN static distribution:

1. **Vercel Imports**: Link your Github repository to [Vercel](https://vercel.com).
2. **Framework Preset**: Vercel automatically detects the Vite configuration.
3. **Environment Variables**: Add your production variables in the Vercel project dashboard:
   - `MONGO_URI` (Your MongoDB Atlas connection URI string)
   - `GEMINI_API_KEY` (Your Google Gemini API key)
   - `JWT_SECRET` (Secure JWT secret string)
   - `APP_URL` (Your designated Vercel production deployment URL)
4. **Deploy**: Push changes; Vercel will bundle the Vite React frontend as a high-performance static site served by their global Edge Network, and route any `/api/*` logic instantly to the serverless Express function wrapper under `/api/index.ts`.

---

### 🎨 Deploying to Render (Persistent Web Service)

To deploy as a traditional monolithic multi-user Node.js container or persistent web service:

1. **Create Web Service**: Create a new Web Service in [Render](https://render.com) linking to this repository.
2. **Configuration Settings**:
   - **Environment**: `Node`
   - **Build Command**: `npm run build` (Builds Vite assets and packages `server.ts` to highly optimized standalone CommonJS inside `dist/server.cjs` with `esbuild`)
   - **Start Command**: `npm start` (Runs the high-speed bundled Node service under `dist/server.cjs`)
3. **Environment Variables**: Use Render's Advanced settings to declare:
   - `PORT`: *Render automatically populates this, and the server is custom-configured to bind to it dynamically.*
   - `MONGO_URI`: (Your MongoDB Atlas connection URI string)
   - `GEMINI_API_KEY`: (Your Google Gemini API key)
   - `JWT_SECRET`: (Secure JWT secret string)
4. **Deploy**: Initiate build. Render will seamlessly construct the static files, package the server, route the load-balanced port, and bring the monolithic deployment live!

