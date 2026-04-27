import { isSlackConfigured, postMessage, restoreIds } from "@services/slack";
import { daprize, put } from "brain-sdk"
import { markdownToSlack } from "@utils/markdown";
import { processSlackEvent } from "@middlewares/slackHandler";

// Create a safe tracing wrapper that handles local development
const isLocal = process.env.IS_LOCAL || process.env.SERVERLESS !== "true";

export type SlackComponentEvent = {
  type: "slack",
  fnName: string
  params: {
    text: string
  }
} | any

export async function run(event: SlackComponentEvent, context: any) {
  console.log("run -> event", JSON.stringify(event, null, 2))
  if (!isSlackConfigured()) {
    console.warn("Skipping slack run because Slack secrets are not configured");
    return null;
  }
  // return AWSXRay.captureAsyncFunc('SlackComponent', async (segment) => {
  let result = null;
  try {
    const { fnName, params } = event;

    // if (segment) {
    //   segment.addAnnotation('event_type', fnName || 'api_gateway');
    // }

    if (fnName) {
      if (fnName === "postMessage") {
        let threadTs = context.state.threadTs
        if (!threadTs && params.replyInThread) {
          threadTs = context.state.eventTs
        }

        let publishedMessage = await postMessage(context.state.channelId,
          restoreIds(markdownToSlack(params.text), context),
          threadTs, params.replyBroadcast, params.username, params.blocks)

        if (params.redirectEvent) {
          delete publishedMessage.response_metadata
          await put("postedMessages/" + `${context.state.channelId}/ts/${publishedMessage.ts}.json`, { publishedMessage, redirectEvent: params.redirectEvent })

          if (params.redirectEvent.username) {
            await put(`messagesPerUser/` + `${params.redirectEvent.username}/${params.redirectEvent.channel_id}/publishedMessage.json`, publishedMessage)
          }
        }
      }
    } else {
      console.log("process slack event")
      await processSlackEvent(event)
    }
    return result
  } catch (error) {
    // if (segment) {
    //   segment.addError(error);
    // }
    throw error;
  }
  // });
}

export const sqs = daprize(run)
