import { daprize, put, get } from "brain-sdk";
import { BrainContext } from "@types";
import OpenAI from "openai"
import { ChatCompletion, ChatCompletionChunk, ChatCompletionCreateParamsNonStreaming, ChatCompletionToolMessageParam } from "openai/resources/chat/completions";
import { Stream } from "openai/streaming";
import { sendToBus } from "brain-sdk";
import { toolDefinition as datetimeToolDefinition } from "@components/datetime";
import { toolDefinition as exchangeToolDefinition } from "@components/exchange";

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

async function sendResponse(text: string, context: BrainContext) {
  return sendToBus("slack", {
    event: {
      fnName: "postMessage",
      params: {
        text
      },
    },
    context
  })
}

let searchToolDefinition = {
  type: "function",
  function: {
    "name": "search",
    "description": "Allows to do web searches using brave search API.",
    "parameters": {
      "type": "object",
      "properties": {
        "query": {
          "type": "string",
          "description": "Word or sentence to search for."
        }
      },
      "required": ["query"]
    }
  }
}

export async function run(event: OpenAIComponentEvent, context: BrainContext) {
  console.log("👾 openai -> run", JSON.stringify(event, null, 2))
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

  // prompt.tools = [datetimeToolDefinition, exchangeToolDefinition, searchToolDefinition]
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

    // let currentSegment = AWSXRay.getSegment()
    // currentSegment.addAnnotation('model', " > " + prompt.model);
    // if (prompt.model) {
    //   currentSegment.addMetadata("openai.model", prompt.model)
    //   currentSegment.addMetadata("openai.request_id", chatCompletionResponse._request_id)
    //   currentSegment.addMetadata("openai.response_id", chatCompletionResponse.id)
    // }

    let responseMessage = chatCompletionResponse.choices[0].message;
    if (responseMessage.content) {
      console.log("responseMessage.content", responseMessage.content)
      // if (context.type === "slack") {
      await sendResponse(responseMessage.content, context)
      // }
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
