import OpenAI from 'openai';
import { ChatCompletionCreateParamsNonStreaming, ChatCompletionMessageParam } from 'openai/resources';
import { MiddlewarePayload } from '@types';
import {
  getHistory,
  historyMessagesToPromptMessages,
  restoreNames
} from '@services/slack';


export async function generateOpenAIPrompt(context: MiddlewarePayload): Promise<ChatCompletionCreateParamsNonStreaming> {
  const { state, config } = context

  let openAiPrompt = {
    model: config.model || "gpt-4o-mini", // 'gpt-4',
    n: 1,
    temperature: 0.8,
  } as ChatCompletionCreateParamsNonStreaming

  if (config.temperature) {
    openAiPrompt.temperature = parseInt(config.temperature)
  }

  let historyMessages = await getHistory(context)
  let messages = historyMessages.messages || []

  let promptMessages = await historyMessagesToPromptMessages(messages, context)

  promptMessages = await Promise.all(promptMessages.map(async (m) => {
    return { ...m, content: await restoreNames(m.content as string, context) }
  }))
  let systemMessage = await restoreNames(state.channelContext?.bot?.text || "", context)

  openAiPrompt.messages = [
    {
      "role": "system",
      "content": [systemMessage].join("\n")
    },
    ...promptMessages
  ] as ChatCompletionMessageParam[]

  // localsegment.close()
  return openAiPrompt as ChatCompletionCreateParamsNonStreaming
}

export type OptionsSkipped = { skipResponse: boolean }
export type DynamicPromptOptions = OpenAI.Chat.ChatCompletionCreateParamsNonStreaming | OptionsSkipped
