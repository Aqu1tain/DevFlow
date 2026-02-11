import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

const prompts: Record<string, string> = {
  explain:
    "You are a code tutor. Explain the following code clearly and concisely. " +
    "Break down what each part does. Use plain language a junior dev would understand.",
  correct:
    "You are a code reviewer. Analyze the following code for bugs, bad practices, and improvements. " +
    "Show the corrected version with brief explanations of what you changed and why.",
};

export async function stream(code: string, language: string, action: string) {
  const prompt = `${prompts[action]}\n\nLanguage: ${language}\n\n\`\`\`${language}\n${code}\n\`\`\``;
  const result = await model.generateContentStream(prompt);
  return result.stream;
}
