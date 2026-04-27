import { sendToBus } from "./bus";
import { get, put } from "./storage";

export interface OpenAIComponentEvent {
  type: string;
  action?: string;
  toolCallId?: string;
  // Add other necessary fields based on usage
}

export interface BrainContext {
  // Add necessary fields based on usage
  userId?: string;
  channelId?: string;
  teamId?: string;
  // Add other fields as needed
}

/**
 * Render authorization blocks for Slack UI
 * @param question The question being asked
 * @param componentName The name of the component requesting authorization
 * @param toolCallId The tool call ID for tracking
 * @returns Slack block kit elements
 */
function renderAuthorizationBlocks(question: string, componentName: string, toolCallId: string): any[] {
  // Simple implementation - replace with your actual logic
  return [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Authorization Requested*\n${componentName} wants to answer: "${question}"`
      }
    },
    {
      type: "actions",
      elements: [
        {
          type: "button",
          text: {
            type: "plain_text",
            text: "Authorize"
          },
          style: "primary",
          value: `${componentName}__${toolCallId}`,
          action_id: "authorize_action"
        },
        {
          type: "button",
          text: {
            type: "plain_text",
            text: "Cancel"
          },
          style: "danger",
          value: `${componentName}__${toolCallId}`,
          action_id: "cancel_action"
        }
      ]
    }
  ];
}

export async function isAuthorized(
  payload: { event: OpenAIComponentEvent, context: BrainContext },
  componentName: string,
  question: string
) {
  if (payload.event.type === "tool_call_authorization") {
    let eventAction = payload.event.action || "authorize";
    if (eventAction.indexOf("authorize") > -1) {
      let persistedPayload = await get("authorization/" + payload.event.toolCallId)
      console.log("persistedPayload", JSON.stringify(persistedPayload, null, 2))
      payload.event = persistedPayload.event
      payload.context = persistedPayload.context

      return persistedPayload
    } else if (payload.event.action === "cancel") {
      return {
        error: "User cancelled the authorization",
      }
    }
  } else {
    await put(`authorization/${payload.event.toolCallId || "unknown"}`, payload)
    const toolCallId = payload.event.toolCallId || "unknown";
    let blocks = renderAuthorizationBlocks(question, componentName, toolCallId)
    await sendToBus("slack", {
      event: {
        fnName: "postMessage",
        params: {
          text: question,
          blocks: blocks,
        },
      },
      context: payload.context,
    })
    return false
  }
}