import OpenAI from "openai";
import { ChatCompletionCreateParamsNonStreaming } from "openai/resources";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function openAIComplete(
  _params: Record<string, unknown>,
  prompt: ChatCompletionCreateParamsNonStreaming,
  onContent?: (content: string, response: any) => void | Promise<void>
) {
  const response = await openai.chat.completions.create(prompt);
  const content = response.choices?.[0]?.message?.content || "";
  if (onContent) {
    await onContent(content, response);
  }
  return response;
}
