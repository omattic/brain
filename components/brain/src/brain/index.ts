import { daprize, sendToBus, put, get } from "brain-sdk";
import OpenAI from "openai"
import { ChatCompletion, ChatCompletionChunk, ChatCompletionCreateParamsNonStreaming, ChatCompletionToolMessageParam } from "openai/resources/chat/completions";
import { Stream } from "openai/streaming";
import * as emoji from "node-emoji";

let datetimeToolDefinition = {
  type: "function",
  function: {
    "name": "datetime",
    "description": "Provides the current date and time.",
    "parameters": {
    }
  }
}

let exchangeToolDefinition = {
  type: "function",
  function: {
    "name": "exchange",
    "description": "Provides the exchange rate of any currency (in USD).",
    "parameters": {
      "type": "object",
      "properties": {
        "currency": {
          "type": "string",
          "description": "Symbol of the currency the user wants to know the exchange rate for, example: 'CLP', 'EUR', 'PGY', etc."
        }
      },
      "required": ["currency"]
    }
  }
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export type OpenAIComponentEvent = {
  type: "openai" | "tool_call" | "tool_call_authorization",
  fnName?: string,
  prompt?: ChatCompletionCreateParamsNonStreaming,
  response?: OpenAiCompletionCreateResultType
  completionId?: string,
  toolCallId?: string,
  text?: string,
  arguments?: any
  action?: "authorize" | "cancel"
}

type OpenAiCompletionCreateResultType = (ChatCompletion & { _request_id?: string; }) | (Stream<ChatCompletionChunk> & { _request_id?: string; })

async function sendResponse(text: string, context: any) {
  return sendToBus(context?.state?.channelContext?.config?.sendBrainResponseTo || "slack", {
    event: {
      fnName: "postMessage",
      params: {
        text: emoji.emojify(text),
      },
    },
    context
  })
}

export async function run(event: OpenAIComponentEvent, context: any) {
  console.log("👾 openai -> run", JSON.stringify(event, null, 2))
  if (!process.env.OPENAI_API_KEY) {
    console.warn("Skipping brain run because OPENAI_API_KEY is not configured");
    return;
  }
  let chatCompletionResponse
  let prompt
  let skipAgent = false

  if (event.type === "tool_call") {
    let eventCompletionId = event.completionId
    let persistedCompletion = await get(`chatCompletion/${eventCompletionId}`)
    console.log("⭐️ persistedCompletion", JSON.stringify(persistedCompletion, null, 2))

    prompt = persistedCompletion.prompt
    prompt.messages.push({
      role: "tool",
      tool_call_id: event.toolCallId,
      content: event.text,
    } as ChatCompletionToolMessageParam);

    console.log("updated prompt", JSON.stringify(prompt, null, 2))

    let messagesWithToolCalls = prompt.messages.filter((message) => message.tool_calls)
    let expectedToolCallIds = []
    for (let mwtc of messagesWithToolCalls) {
      for (let toolCall of mwtc.tool_calls) {
        expectedToolCallIds.push(toolCall.id)
      }
    }

    let toolCallIdsFromMessages = prompt.messages.map((message) => message.tool_call_id).filter((id) => id !== undefined)

    console.log("expectedToolCallIds", expectedToolCallIds)
    console.log("toolCallIdsFromMessages", toolCallIdsFromMessages)

    skipAgent = expectedToolCallIds.length !== toolCallIdsFromMessages.length
    console.log("skipAgent", skipAgent)

    event = persistedCompletion.event as OpenAIComponentEvent
    context = persistedCompletion.context

    if (skipAgent) {
      await put(`chatCompletion/${eventCompletionId}`, {
        event,
        context,
        prompt
      })
    }

  } else {
    prompt = event.prompt
  }

  if (skipAgent) {
    return
  }

  // prompt.tools = [datetimeToolDefinition, exchangeToolDefinition]
  // prompt.tool_choice = "auto"

  console.log("🟢🟢🟢 prompt", JSON.stringify(prompt, null, 2))
  try {
    chatCompletionResponse = await openai.chat.completions.create(prompt)
  } catch (err) {
    try {
      chatCompletionResponse = await openai.chat.completions.create(prompt)
    } catch (err) {
      await sendResponse(err.errorMessage, context)
    }
  }

  if ((chatCompletionResponse as ChatCompletion).choices) {
    console.log("chatCompletionResponse", JSON.stringify(chatCompletionResponse, null, 2))

    let responseMessage = chatCompletionResponse.choices[0].message;
    if (responseMessage.content) {
      console.log("responseMessage.content", responseMessage.content)
      await sendResponse(responseMessage.content, context)
    }

    if (responseMessage.tool_calls) {
      prompt.messages.push(responseMessage);
      await put(`chatCompletion/${chatCompletionResponse.id}`, {
        event,
        context,
        prompt
      })

      for (let toolCall of responseMessage.tool_calls) {
        const functionName = toolCall.function.name;

        console.log("toolCall", JSON.stringify(toolCall, null, 2))

        await sendToBus(functionName, {
          event: {
            type: "tool_call",
            completionId: chatCompletionResponse.id,
            toolCallId: toolCall.id,
            arguments: JSON.parse(toolCall.function.arguments),
          } as OpenAIComponentEvent,
          context
        });

      }
    }
  }

}

export const sqs = daprize(run, "brain")
