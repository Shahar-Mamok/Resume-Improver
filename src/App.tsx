import React, { useState } from 'react';
// Ignore TS errors for these packages (for JS projects you can remove these lines)
// @ts-ignore
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";
// @ts-ignore
import mammoth from "mammoth";
import ReactMarkdown from "react-markdown";

// Set the worker for PDF.js (required for Vite + pdfjs-dist)
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

// PDF file to text extraction
const extractPdfText = async (file) => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let text = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map(item => item.str).join(' ') + '\n';
  }
  return text;
};

// DOCX file to text extraction
const extractDocxText = async (file) => {
  const arrayBuffer = await file.arrayBuffer();
  const { value } = await mammoth.extractRawText({ arrayBuffer });
  return value;
};

function App() {
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  // Analyze button handler - sends texts to backend and updates result
  const handleAnalyze = async () => {
    setLoading(true);
    setResult('');
    try {
      const response = await fetch('http://localhost:8080/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resumeText,
          jobDescription,
        }),
      });
      const data = await response.text();
      // Try to unwrap response if it's a GPT JSON format
      let niceContent = data;
      try {
        const parsed = JSON.parse(data);
        niceContent = parsed.choices?.[0]?.message?.content ?? data;
      } catch (e) {
        // Not JSON - ignore
      }
      if (!response.ok) {
        setResult(`Error: ${response.status} - ${niceContent}`);
      } else {
        setResult(niceContent);
      }
    } catch (error) {
      setResult('Error contacting backend');
    }
    setLoading(false);
  };

  // Custom renderer for markdown tables with Tailwind
  const markdownComponents = {
    table: ({ node, ...props }) => (
      <table className="min-w-full border-collapse border border-gray-300 rounded-xl overflow-hidden shadow my-4">
        {props.children}
      </table>
    ),
    th: ({ node, ...props }) => (
      <th className="bg-gray-100 border px-4 py-2 text-left font-semibold">{props.children}</th>
    ),
    td: ({ node, ...props }) => (
      <td className="border px-4 py-2">{props.children}</td>
    ),
    tr: ({ node, ...props }) => (
      <tr className="even:bg-gray-50">{props.children}</tr>
    ),
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100">
      <div className="backdrop-blur-md bg-white/60 rounded-3xl shadow-2xl p-10 w-full max-w-lg border border-white/70">
        <h1 className="text-4xl font-extrabold mb-3 text-center text-gray-800 drop-shadow-sm tracking-tight">
          Resume Improver
        </h1>
        <p className="text-gray-700 text-center mb-8 text-lg">
          Upload your resume and compare it to a job description – instant insights and improvement tips.
        </p>

        {/* Resume text area and file upload */}
        <div className="mb-6">
          <label className="block text-gray-700 font-semibold mb-2" htmlFor="resume-text">
            Resume (paste text or upload PDF/DOCX)
          </label>
          <textarea
            id="resume-text"
            className="block w-full min-h-[60px] text-sm text-gray-700 border-2 border-gray-300 rounded-xl bg-white/80 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition mb-2"
            placeholder="Paste your resume text here..."
            value={resumeText}
            onChange={e => setResumeText(e.target.value)}
          />
          <input
            type="file"
            accept=".pdf,.docx"
            className="mt-2"
            onChange={async (e) => {
              const file = e.target.files[0];
              if (!file) return;
              if (file.type === "application/pdf") {
                setResumeText(await extractPdfText(file));
              } else if (file.name.endsWith(".docx")) {
                setResumeText(await extractDocxText(file));
              } else {
                alert("Only PDF or DOCX supported.");
              }
            }}
          />
        </div>

        {/* Job description text area */}
        <div className="mb-6">
          <label className="block text-gray-700 font-semibold mb-2" htmlFor="job-description">
            Job Description
          </label>
          <textarea
            id="job-description"
            className="block w-full min-h-[60px] text-sm text-gray-700 border-2 border-gray-300 rounded-xl bg-white/80 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400 transition"
            placeholder="Paste the job description here..."
            value={jobDescription}
            onChange={e => setJobDescription(e.target.value)}
          />
        </div>

        {/* Analyze button */}
        <button
          type="button"
          className="w-full py-2 px-4 mb-6 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-pink-500 hover:to-blue-500 text-white font-bold rounded-xl shadow-md transition duration-200 active:scale-95 disabled:opacity-50"
          onClick={handleAnalyze}
          disabled={loading || !resumeText || !jobDescription}
        >
          {loading ? 'Analyzing...' : 'Analyze'}
        </button>

        {/* Results */}
        <div className="bg-white/90 rounded-xl p-4 text-gray-800 text-left min-h-[80px] border-2 border-blue-200 shadow-xl transition-all duration-300">
          {result
            ? (
              <div className="prose max-w-full">
                <ReactMarkdown components={markdownComponents}>{result}</ReactMarkdown>
              </div>
            )
            : <span className="italic text-gray-400">Analysis results will appear here (UI placeholder)</span>
          }
        </div>
      </div>
    </div>
  );
}

export default App;
