# 🚀 Resume Improver

A modern, automated tool for analyzing resumes against job descriptions – delivers instant feedback, improvement tips, visual match percentage, and beautiful, actionable reports.

---

## ✨ Overview

Resume Improver lets you upload a resume (PDF or DOCX) and compare it with any job description.  
The system analyzes your fit, highlights missing skills, strengths, provides a tailored checklist, and shows your match percentage in a dynamic progress bar.

---

## 🛠️ Technologies

- **Backend:**  
  - Java, Spring Boot  
  - PDFBox + Apache POI (extract text from files)
  - OpenAI (GPT-4o) integration for AI-driven analysis

- **Frontend:**  
  - React + TypeScript  
  - TailwindCSS  
  - react-markdown (render Markdown)
  - react-circular-progressbar (visual match bar)
  - html2pdf.js (export results as PDF)

---

## 📦 Project Structure

resume-improver/
│
├── backend/
│ └── ... (Spring Boot, AnalyzeController, etc.)
│
├── frontend/
│ └── src/
│ ├── App.tsx
│ ├── CircularProgressBar.tsx
│ └── ...
│
├── .gitignore
└── README.md

yaml
Copy
Edit

---

## ⚡ Getting Started

### 1. OpenAI API Key Configuration

Add your OpenAI API key to  
`backend/src/main/resources/application.properties`:
openai.api.key=sk-xxxxxxx

shell
Copy
Edit

### 2. Run the Backend

```bash
cd backend
mvn spring-boot:run
# Available at http://localhost:8080
3. Run the Frontend
bash
Copy
Edit
cd frontend
npm install
npm run dev
# Available at http://localhost:5174 (Vite default)
🖼️ UI Example

📝 Usage
Upload your resume (PDF or DOCX)

Paste a relevant job description

Click "Analyze"

Get a full report including:

Animated match percentage

Missing skills and recommendations

Highlighted strengths

Interactive checklist

Export as PDF button

🌍 Notes
Requires a valid OpenAI API key (GPT-4o or compatible)

Backend and frontend are in separate folders

Do not commit node_modules, .idea, build artifacts, or similar files

Fully responsive for mobile and desktop

👤 Author
Shahar Mamok – GitHub: Shahar-Mamok

