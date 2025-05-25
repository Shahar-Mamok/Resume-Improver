import React, { useState } from 'react';
import ReactMarkdown from "react-markdown";
// @ts-ignore
import html2pdf from "html2pdf.js";
import rehypeRaw from "rehype-raw";
// 🚀 Custom Tailwind Markdown Renderer for beautiful output!
const markdownComponents = {
  table: ({ node, ...props }) => (
    <div className="overflow-x-auto my-4">
      <table className="min-w-full border-collapse rounded-2xl shadow-lg">
        {props.children}
      </table>
    </div>
  ),
  thead: ({ node, ...props }) => (
    <thead className="bg-gray-300 text-gray-800">{props.children}</thead>
  ),
  tbody: ({ node, ...props }) => (
    <tbody className="bg-white">{props.children}</tbody>
  ),
  th: ({ node, ...props }) => (
    <th className="px-4 py-3 text-left font-extrabold border-b border-gray-400 bg-gray-100 text-base tracking-wide break-words">{props.children}</th>
  ),
  td: ({ node, ...props }) => (
    <td className="px-4 py-2 border-b border-gray-200 text-gray-700 break-words">{props.children}</td>
  ),
  tr: ({ node, ...props }) => (
    <tr className="even:bg-purple-50 hover:bg-pink-50 transition-colors">{props.children}</tr>
  ),
  h2: ({ node, ...props }) => (
    <h2 className="text-2xl font-extrabold mt-7 mb-2 flex items-center gap-2 border-b border-purple-200 pb-1">
      <span role="img" aria-label="section">🟦</span> {props.children}
    </h2>
  ),
  h3: ({ node, ...props }) => (
    <h3 className="text-xl font-bold mt-4 mb-2 text-pink-600 flex items-center gap-2">
      <span role="img" aria-label="topic">🔹</span> {props.children}
    </h3>
  ),
  ul: ({ node, ...props }) => (
    <ul className="list-disc pl-6 mb-3 text-base text-gray-700">{props.children}</ul>
  ),
  li: ({ node, ...props }) => (
    <li className="mb-1">{props.children}</li>
  ),
  strong: ({ node, ...props }) => (
    <strong className="text-blue-700 font-semibold">{props.children}</strong>
  ),
  mark: ({ node, ...props }) => (
    <mark className="bg-yellow-200 px-1 rounded">{props.children}</mark>
  ),
};

// PDF Download function – grabs the single result block!
function downloadAsPDF() {
  const content = document.getElementById('resume-result');
  if (!content) return;
  // Add a custom PDF title/header
  const header = document.createElement('div');
  header.innerHTML = `<h2 style="color:#9333ea; text-align:center;">Resume Improver Report</h2>`;
  const clone = content.cloneNode(true);
  const wrapper = document.createElement('div');
  wrapper.appendChild(header);
  wrapper.appendChild(clone);
  html2pdf().from(wrapper).save('ResumeAnalysis.pdf');
}

function App() {
  // App state: File, job description, AI result, and loading spinner
  const [resumeFile, setResumeFile] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  // Send file + job description to backend API
  const handleAnalyze = async () => {
    if (!resumeFile || !jobDescription) return;
    setLoading(true);
    setResult('');
    try {
      const formData = new FormData();
      formData.append('resume', resumeFile);
      formData.append('jobDescription', jobDescription);

      const response = await fetch('http://localhost:8080/api/analyze', {
        method: 'POST',
        body: formData
      });

      const data = await response.text();
      let niceContent = data;

      // Try to parse JSON if backend is returning GPT-style JSON
      try {
        const parsed = JSON.parse(data);
        niceContent = parsed.choices?.[0]?.message?.content ?? data;
      } catch (e) {
        // Not JSON, just plain text
      }
      setResult(response.ok ? niceContent : `Error: ${response.status} - ${niceContent}`);
    } catch (error) {
      setResult('Error contacting backend');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100">
      <div className="backdrop-blur-md bg-white/70 rounded-3xl shadow-2xl p-10 w-full max-w-2xl border border-white/80">
        {/* Title & Description */}
        <h1 className="text-4xl font-extrabold mb-2 text-center text-gray-800 drop-shadow-sm tracking-tight">
          Resume Improver
        </h1>
        <p className="text-gray-700 text-center mb-8 text-lg">
          Upload your resume and compare it to a job description – <span className="font-semibold text-pink-600">instant insights and improvement tips</span>.
        </p>

        {/* File upload */}
        <div className="mb-6">
          <label className="block text-gray-700 font-semibold mb-2" htmlFor="resume-upload">
            Resume <span className="font-normal text-gray-400">(PDF or DOCX)</span>
          </label>
          <input
            id="resume-upload"
            type="file"
            accept=".pdf,.docx"
            className="block w-full mb-2"
            onChange={e => {
              const file = e.target.files?.[0];
              if (file) setResumeFile(file);
            }}
          />
        </div>

        {/* Job description */}
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
          disabled={loading || !resumeFile || !jobDescription}
        >
          {loading ? 'Analyzing...' : 'Analyze'}
        </button>

        {/* Results block – this is the ONLY place it renders! */}
        <div
          id="resume-result"
          className="bg-white/95 rounded-2xl p-5 text-gray-800 text-left min-h-[80px] border-2 border-blue-200 shadow-xl transition-all duration-300 mt-2 prose prose-p:mb-2"
        >
          {result
            ? (
              <ReactMarkdown
              components={markdownComponents}
              rehypePlugins={[rehypeRaw]}
            >
              {result}
            </ReactMarkdown>
            )
            : <span className="italic text-gray-400">Analysis results will appear here (UI placeholder)</span>
          }
        </div>
        {/* Only show copy/download if there's a result */}
        {result && (
          <div className="flex gap-3 mt-3">
            <button
              onClick={() => {
                navigator.clipboard.writeText(result);
              }}
              className="py-1 px-4 rounded-lg bg-purple-500 text-white hover:bg-purple-700 font-bold transition shadow"
            >
              Copy All
            </button>
            <button
              onClick={downloadAsPDF}
              className="py-1 px-4 rounded-lg bg-pink-500 text-white hover:bg-pink-700 font-bold transition shadow"
            >
              Download as PDF
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
