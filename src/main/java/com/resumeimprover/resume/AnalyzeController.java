package com.resumeimprover.resume;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.*;

import okhttp3.OkHttpClient;
import okhttp3.MediaType;
import okhttp3.Request;
import okhttp3.Response;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;

@RestController
@RequestMapping("/api/analyze")
@CrossOrigin
public class AnalyzeController {
    @Value("${openai.api.key}")
    private String OPENAI_API_KEY;

    private static final String OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

    @PostMapping
    public ResponseEntity<String> analyze(@RequestBody AnalyzeRequest request) throws JsonProcessingException {
        System.out.println("==== Got a request! ====");
        System.out.println("Resume: " + request.resumeText);
        System.out.println("Job Description: " + request.jobDescription);


        String prompt = """
You are Resume Improver, a professional resume analyzer.
Your response **must** be formatted in Markdown, and always include the following sections, in order:

## Missing Keywords and Skills
List the most important missing skills, technologies, and experience, organized in logical groups.

## Recommendations for Improvement
Suggest concrete and actionable steps for the candidate to align their resume with the job description.

## Positive Feedback
Add positive feedback on the resume’s strengths and alignment with the job description.

## Resume Improvement Checklist

Leave a blank line before and after the following table, and write it exactly like this (one line per item, no inline tables):

| Add/Emphasize                                 | Remove/De-emphasize         |
|-----------------------------------------------|-----------------------------|
| (items here, one per line)                    | (items here, one per line)  |

---
Resume:
{resume}

Job Description:
{jobDescription}
""".replace("{resume}", request.resumeText).replace("{jobDescription}", request.jobDescription);

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

        String requestBody = mapper.writeValueAsString(jsonMap);
        MediaType mediaType = MediaType.parse("application/json");
        okhttp3.RequestBody body = okhttp3.RequestBody.create(requestBody, mediaType);


        Request req = new Request.Builder()
                .url(OPENAI_API_URL)
                .post(body)
                .addHeader("Authorization", "Bearer " + OPENAI_API_KEY)
                .addHeader("Content-Type", "application/json")
                .build();

        try (Response response = client.newCall(req).execute()) {
            String responseBody = response.body().string(); // לקרוא פעם אחת!
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

    private String toJson(String text) {
        return "\"" + text.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n") + "\"";
    }

    private String extractGptAnswer(String json) {
        int idx = json.indexOf("\"content\":\"");
        if (idx == -1) return json;
        int start = idx + 11;
        int end = json.indexOf("\"", start);
        if (end == -1) return json.substring(start);
        String content = json.substring(start, end);
        return content.replace("\\n", "\n").replace("\\\"", "\"");
    }

    public static class AnalyzeRequest {
        public String resumeText;
        public String jobDescription;
    }

}
