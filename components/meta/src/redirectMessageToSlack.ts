import { get, sendToBus } from "brain-sdk"

export type RedirectMessageToSlackChatEvent = {
  channel_id: string
  botName?: string
  thread_ts?: string
  payload?: any
  useBot?: string
  update_id?: string
  content?: string
  username?: string
  userName?: string
  userId?: string
  skipAutopilot?: boolean
  change?: any
  status?: any
  text?: string
  xid?: string
  chatGptMode?: string
  chatGptContext?: string
  attachments?: AttachmentsPayload[]
}

export type AttachmentsPayload = {
  type: "image" | "video" | "audio" | "document",
  url: string,
  mimeType: string,
  caption?: string,
  filename?: string
}

export async function redirectMessageToSlackChat(redirectEvent: RedirectMessageToSlackChatEvent, opts?: { forceBroadcast?: boolean }) {
  console.log("🚀 Redirecting to", redirectEvent)

  let existingThreadForUser = { thread_ts: null, replyBroadcast: null }
  if (redirectEvent.username) {
    let latestPublishedMessage = await get(`messagesPerUser/${redirectEvent.username}/${redirectEvent.channel_id}/publishedMessage.json`) || {}
    existingThreadForUser.thread_ts = latestPublishedMessage.thread_ts || latestPublishedMessage.ts
  }

  existingThreadForUser.replyBroadcast = true

  // console.log("🚀 existingThreadForUser", existingThreadForUser)

  await sendToBus("slack", {
    event: {
      fnName: "postMessage",
      params: {
        text: redirectEvent.text || redirectEvent.content,
        username: redirectEvent.username || redirectEvent.userName,
        replyBroadcast: existingThreadForUser.replyBroadcast,
        redirectEvent,
        // attachments: redirectEvent.attachments,
      },
    },
    context: {
      createdBy: "meta",
      state: {
        channelId: redirectEvent.channel_id,
        threadTs: existingThreadForUser.thread_ts || redirectEvent.thread_ts,
      }
    }
  })
}
