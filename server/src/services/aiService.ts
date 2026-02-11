import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

const prompts: Record<string, string> = {
  explain:
    "Explain the following code. Break down what each part does. " +
    "Be clear and concise. No preamble, no meta-commentary — just the explanation.",
  correct:
    "Review the following code for bugs, bad practices, and possible improvements. " +
    "Show the corrected version with brief explanations of each change. " +
    "No preamble, no meta-commentary — get straight to the point.",
};

export async function stream(code: string, language: string, action: string) {
  const prompt = `${prompts[action]}\n\nLanguage: ${language}\n\n\`\`\`${language}\n${code}\n\`\`\``;
  const result = await model.generateContentStream(prompt);
  return result.stream;
}
