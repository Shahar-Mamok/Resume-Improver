package com.resumeimprover.resume;

import com.fasterxml.jackson.databind.ObjectMapper;
import okhttp3.OkHttpClient;
import okhttp3.MediaType;
import okhttp3.Request;
import okhttp3.Response;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.usermodel.XWPFParagraph;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.*;

@RestController
@RequestMapping("/api/analyze")
@CrossOrigin
public class AnalyzeController {
    @Value("${openai.api.key}")
    private String OPENAI_API_KEY;

    private static final String OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

    @PostMapping(consumes = {"multipart/form-data"})
    public ResponseEntity<String> analyze(
            @RequestParam("resume") MultipartFile resumeFile,
            @RequestParam("jobDescription") String jobDescription
    ) {
        System.out.println("==== Got a request! ====");
        System.out.println("Resume file: " + resumeFile.getOriginalFilename());
        System.out.println("Job Description: " + jobDescription);

        String resumeText;
        try {
            resumeText = extractTextFromFile(resumeFile);
        } catch (Exception e) {
            return ResponseEntity.status(400).body("Failed to extract text from file: " + e.getMessage());
        }

        // HTML Table for Visual Checklist (styled for TailwindCSS)
        String tableHtml = """
<table class="min-w-full border rounded-xl overflow-hidden shadow my-4">
  <thead class="bg-gray-200">
    <tr>
      <th class="px-4 py-2 font-bold">Add/Improve</th>
      <th class="px-4 py-2 font-bold">Remove/De-emphasize</th>
      <th class="px-4 py-2 font-bold">Notes</th>
    </tr>
  </thead>
  <tbody>
    <tr class="even:bg-purple-50">
      <td class="px-4 py-2 text-green-700 font-semibold">AWS Experience 🟩</td>
      <td class="px-4 py-2 text-gray-400">N/A</td>
      <td class="px-4 py-2">Distributed Systems, Leadership Examples</td>
    </tr>
  </tbody>
</table>
""";

        // Build prompt and insert table HTML using String.format
        String prompt = String.format("""
              You are Resume Improver, an expert resume analyzer and Markdown designer.
              Always return output in ADVANCED MARKDOWN with:
              - Beautiful section headers (##, ###)
              - Well-aligned tables with meaningful column headers (prefer HTML tables with Tailwind classes if possible!)
              - Bold all section titles and important keywords
              - Bullet points for recommendations and feedback
              - Emojis for extra clarity: 🟩=Good, 🟥=Missing, 🟦=Recommendation
              - Use <mark> for yellow highlight if possible (inline HTML is supported)
              
              Strictly format your output as follows:
              
              ---
              ## 🟦 Resume Analysis for Job Fit

              ### 🟥 Missing Skills and Technologies

              | Category              | Missing Items (comma-separated)         |
              |-----------------------|-----------------------------------------|
              | **Programming**       | AWS, Docker, Distributed Systems        |
              | **Frameworks**        | Spring Boot                             |
              | **Other Skills**      | Problem Solving, Leadership             |

              ### 🟦 Category Recommendations

              #### **Skills**
              - Add AWS, Docker and Distributed Systems experience
              #### **Technologies**
              - Emphasize Spring Boot usage in recent projects

              #### **Projects**
              - Add at least 1 project using distributed architecture

              #### **Soft Skills**
              - Highlight teamwork and leadership (mention specific situations)

              ### 🟩 Positive Aspects
              - **Strong programming foundation**
              - **Great learning agility**
              - **Good communication skills**

              ### 🟦 Visual Checklist Table

              %s

              ---

              Always use Markdown, make sure tables are properly aligned, and important points are easy to find and visually clear!

              Resume:
              %s

              Job Description:
              %s
              """, tableHtml, resumeText, jobDescription);

        OkHttpClient client = new OkHttpClient();

        ObjectMapper mapper = new ObjectMapper();
        Map<String, Object> jsonMap = new HashMap<>();
        jsonMap.put("model", "gpt-4o");

        List<Map<String, String>> messages = new ArrayList<>();
        Map<String, String> userMsg = new HashMap<>();
        userMsg.put("role", "user");
        userMsg.put("content", prompt);
        messages.add(userMsg);

        jsonMap.put("messages", messages);
        jsonMap.put("max_tokens", 1500);

        String requestBody;
        try {
            requestBody = mapper.writeValueAsString(jsonMap);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Failed to serialize request: " + e.getMessage());
        }

        MediaType mediaType = MediaType.parse("application/json");
        okhttp3.RequestBody body = okhttp3.RequestBody.create(requestBody, mediaType);

        Request req = new Request.Builder()
                .url(OPENAI_API_URL)
                .post(body)
                .addHeader("Authorization", "Bearer " + OPENAI_API_KEY)
                .addHeader("Content-Type", "application/json")
                .build();

        try (Response response = client.newCall(req).execute()) {
            String responseBody = response.body().string();
            System.out.println("OpenAI HTTP code: " + response.code());
            System.out.println("OpenAI response: " + responseBody);
            if (!response.isSuccessful()) {
                return ResponseEntity.status(response.code()).body("Error: " + response.message() + " - " + responseBody);
            }
            String answer = extractGptAnswer(responseBody);
            return ResponseEntity.ok(answer);
        } catch (IOException e) {
            return ResponseEntity.status(500).body("Error: " + e.getMessage());
        }
    }

    // Extract text from PDF or DOCX file using Apache PDFBox / POI
    private String extractTextFromFile(MultipartFile file) throws IOException {
        String filename = file.getOriginalFilename().toLowerCase();
        if (filename.endsWith(".pdf")) {
            try (PDDocument document = PDDocument.load(file.getInputStream())) {
                PDFTextStripper stripper = new PDFTextStripper();
                return stripper.getText(document);
            }
        } else if (filename.endsWith(".docx")) {
            try (XWPFDocument doc = new XWPFDocument(file.getInputStream())) {
                StringBuilder sb = new StringBuilder();
                for (XWPFParagraph p : doc.getParagraphs()) {
                    sb.append(p.getText()).append("\n");
                }
                return sb.toString();
            }
        } else {
            throw new IOException("Unsupported file type: " + filename);
        }
    }

    // Very basic extraction from OpenAI API JSON (for markdown content)
    private String extractGptAnswer(String json) {
        int idx = json.indexOf("\"content\":\"");
        if (idx == -1) return json;
        int start = idx + 11;
        int end = json.indexOf("\"", start);
        if (end == -1) return json.substring(start);
        String content = json.substring(start, end);
        return content.replace("\\n", "\n").replace("\\\"", "\"");
    }
}
