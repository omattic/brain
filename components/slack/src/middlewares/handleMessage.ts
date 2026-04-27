import {
  getDocsAndConfig,
  postMessage as postSlackMessage,
  restoreIds,
  setStatus
} from "@services/slack"
import {
  AppMentionEvent,
  BotMessageEvent,
  GenericMessageEvent,
  ThreadBroadcastMessageEvent
} from "@slack/types"
import { MiddlewarePayload } from "@types"
import { generateOpenAIPrompt } from "@utils/ai"
import { sendToBus } from "brain-sdk"

import debug from "@utils/debug";
const log = debug("mainHandler")

export async function handleMessage(context: MiddlewarePayload) {
  let { state, config, event } = context as MiddlewarePayload
  console.log("🟢 handleMessage", JSON.stringify(context, null, 2))
  if (!event || (event as GenericMessageEvent).subtype === "message_changed" || (event as GenericMessageEvent).subtype === "message_deleted") {
    // Ignore message_changed and message_deleted events
    return
  } else if ((event as GenericMessageEvent).type === 'message') {
    event = event as GenericMessageEvent
    if (event.subtype === "bot_message") {
      // event = event as BotMessageEvent
      state.isBotMessage = true
    }
    if ((event as unknown as ThreadBroadcastMessageEvent).subtype === "thread_broadcast") {
      // event = event as unknown as ThreadBroadcastMessageEvent
      state.isThreadBroadcast = true
    }
  } else if ((event as AppMentionEvent).type === 'app_mention') {
    event = event as AppMentionEvent
    state.isAppMention = true
  } else {
    return {}
  }

  state.channelId = event.channel
  state.threadTs = event.thread_ts
  state.eventTs = event.event_ts || event.ts
  state.userId = event.user
  state.isIm = (event as GenericMessageEvent).channel_type === "im"
  state.isGroup = (event as GenericMessageEvent).channel_type === "channel" || (event as GenericMessageEvent).channel_type === "mpim" || (event as GenericMessageEvent).channel_type === "group"
  state.messageUsername = (event as BotMessageEvent).username?.toLowerCase()
  state.incomingMessageText = event.text
  state.hasBotProfile = !!event.bot_profile

  if (state.isBotMessage && !state.messageUsername) {
    return { _internal: "Skip message from bot" }
  }

  let [
    channelContext,
  ] = await Promise.all([
    getDocsAndConfig(state.channelId),
  ])

  console.log("⚙ channelContext", JSON.stringify(channelContext, null, 2))

  if (!channelContext.bot && process.env.ADMIN_CHANNEL) {
    console.log("🟢 channelContext.text is empty, using admin channel")
    channelContext = await getDocsAndConfig(process.env.ADMIN_CHANNEL)
    console.log("⚙ ADMIN channelContext", JSON.stringify(channelContext, null, 2))
  }

  console.log("🟢 channelContext", JSON.stringify(channelContext, null, 2))

  config = channelContext.config
  state.channelContext = channelContext

  console.log("⚙ state", JSON.stringify(state, null, 2))
  console.log("⚙ config", JSON.stringify(config, null, 2))

  if (config.disableBot) {
    console.log("🟢 Bot is disabled")
    return { _internal: "Bot is disabled" }
  }

  if (config.skipBroadcast && state.isThreadBroadcast) {
    return { _internal: "Skip thread broadcast" }
  }

  if (
    (
      (!state.hasBotProfile)
      ||
      (config.onlyUsernames && state.messageUsername)
    )
    &&
    (
      (state.isAppMention)
      ||
      (state.isIm)
      ||
      (config.isMechanical)
      ||
      (config.isAutomatic)
    )
  ) {
    console.log("Thinking...")
    // await setStatus(state.channelId, "is thinking...", state.threadTs)
    await setStatus(state.channelId, "is thinking...", state.threadTs)

    let prompt = await generateOpenAIPrompt(context)

    log("prompt", JSON.stringify(prompt, null, 2))

    await sendToBus(
      config.sendToBus || "brain", {
      event: {
        fnName: "getCompletion",
        prompt,
      },
      context
    })

  } else {
    console.log("SKIPPED!")
  }
}
