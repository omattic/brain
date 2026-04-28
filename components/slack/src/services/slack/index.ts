import { App, LogLevel } from "@slack/bolt"

import { ChannelConfig, MiddlewarePayload } from "@types";
import { ChatCompletionMessageParam } from "openai/resources";
import { ChatPostMessageArguments, ConversationsRepliesResponse, GenericMessageEvent, WebClient } from "@slack/web-api";
import { getRuntimeConfig } from "brain-sdk";

// console.log = function () { }

export type ParsedTextAndconfig = {
  text: string
  config: ChannelConfig
  docList: FetchedSlackDocs[]
}

type SlackChannelDocument = {
  id: string
  url_private: string
  mimetype: string
  title: string
}

export type FetchedSlackDocs = {
  // doc: SlackChannelDocument
  title: string
  content: string
}

export type AutoResponse = {
  keywords: string[],
  comment: string,
  response: string
}

let AppInit = {
  token: process.env.SLACK_BOT_TOKEN,
  appToken: process.env.SLACK_APP_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  // socketMode: process.env.SERVERLESS !== "true",
  // logLevel: LogLevel.DEBUG,
  // socketMode: false
}

const SLACK_CONFIG_NAMESPACE = "slackConfig";
const DEFAULT_SLACK_WORKSPACE = "default";
const workspaceClients = new Map<string, WebClient>();
const workspaceTokenCache = new Map<string, Promise<string | null>>();

function getSlackConfigNamespace() {
  const cloudflare = getRuntimeConfig().cloudflare;
  return cloudflare?.kv?.[SLACK_CONFIG_NAMESPACE] || cloudflare?.resolveKV?.(SLACK_CONFIG_NAMESPACE);
}

function normalizeWorkspace(workspace?: string | null) {
  return workspace?.trim() || DEFAULT_SLACK_WORKSPACE;
}

function getWorkspaceTokenEnvKey(workspace?: string | null) {
  return `SLACK_BOT_TOKEN_${normalizeWorkspace(workspace).replace(/[^a-zA-Z0-9]+/g, "_").toUpperCase()}`;
}

async function getStoredSlackBotToken(workspace?: string | null): Promise<string | null> {
  const normalizedWorkspace = normalizeWorkspace(workspace);
  if (workspaceTokenCache.has(normalizedWorkspace)) {
    return workspaceTokenCache.get(normalizedWorkspace)!;
  }

  const tokenPromise = (async () => {
    const namespace = getSlackConfigNamespace();
    if (!namespace) {
      return null;
    }

    return namespace.get(`slack/workspaces/${normalizedWorkspace}/bot-token`);
  })();

  workspaceTokenCache.set(normalizedWorkspace, tokenPromise);
  return tokenPromise;
}

async function resolveSlackBotToken(workspace?: string | null): Promise<string | null> {
  const normalizedWorkspace = normalizeWorkspace(workspace);
  const storedToken = await getStoredSlackBotToken(normalizedWorkspace);
  if (storedToken) {
    return storedToken;
  }

  return process.env[getWorkspaceTokenEnvKey(normalizedWorkspace)] || process.env.SLACK_BOT_TOKEN || null;
}

export function isSlackConfigured() {
  return Boolean(
    process.env.SLACK_BOT_TOKEN &&
    process.env.SLACK_APP_TOKEN &&
    process.env.SLACK_SIGNING_SECRET
  ) || Boolean(getSlackConfigNamespace());
}

// if (process.env.USE_WEBSOCKETS) {
//   AppInit.socketMode = true
// }

// if(process.env.SLACK_BOT_TOKEN) {
//   AppInit.token = process.env.SLACK_BOT_TOKEN
// } 

export const app = isSlackConfigured() ? new App(AppInit) : ({ client: null } as any);

async function getClient(workspace?: string | null) {
  const normalizedWorkspace = normalizeWorkspace(workspace);
  if (normalizedWorkspace === DEFAULT_SLACK_WORKSPACE && app.client) {
    return app.client;
  }

  const token = await resolveSlackBotToken(normalizedWorkspace);
  if (!token) {
    console.warn(`Slack client is unavailable because no bot token is configured for workspace ${normalizedWorkspace}`);
    return null;
  }

  if (!workspaceClients.has(normalizedWorkspace)) {
    workspaceClients.set(normalizedWorkspace, new WebClient(token));
  }

  return workspaceClients.get(normalizedWorkspace)!;
}

export async function updateInteractiveMessage(response_url: string, text: string, blocks?: any[]) {
  try {
    const response = await fetch(response_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        replace_original: true,
        text: text,
        blocks: blocks,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to update message: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating interactive message:', error);
    throw error;
  }
}

export async function getMessageByTs(channelId: string, ts: string): Promise<GenericMessageEvent | null> {
  const client = await getClient();
  if (!client) {
    return null;
  }
  try {
    const result = await client.conversations.history({
      channel: channelId,
      latest: ts,
      inclusive: true,
      limit: 1,
    });

    if (result.messages && result.messages.length > 0) {
      return { channel: channelId, event_ts: ts, channel_type: "unk", ...result.messages[0] } as any as GenericMessageEvent
    } else {
      throw new Error("Message not found");
    }
  } catch (error) {
    console.error(error);
  }
}


export function parseAutoResponses(content: string): any[] {
  let lines = content.replace(/\n\[/g, "___RN_CORCH___").replace(/\[/g, "\n\[").replace(/___RN_CORCH___/g, "\n[").split("\n")
  let autoResponses = {}
  let responsesArray = [] as any[]


  let splittedLines = []
  for (let line of lines) {
    splittedLines.push(line)
  }
  lines = lines.filter(l => l.length > 0)

  let componentName = null
  let lineValue = null
  let currentObject = null
  let action = null
  for (let line of lines) {
    // console.log("line", line)
    // if (line === "\n" || line.trim().length > 1) {
    line = line.trim()
    if (line.startsWith("[")) {
      componentName = line.split("[")[1].split("]")[0]
      lineValue = line.split(" ").slice(1).join(" ").trim()
      action = "new"
      // console.log(action, "  ✅ componentName", componentName)
    } else {
      lineValue = line
      action = "append"
    }

    if (componentName === "end") {
      responsesArray.push(currentObject)
      currentObject = null
    }

    if (componentName && lineValue) {
      if (!currentObject) {
        currentObject = {}
      }
      if (!currentObject[componentName]) {
        currentObject[componentName] = []
      }
      if (action === "new") {
        currentObject[componentName].push("")
      }
      currentObject[componentName][currentObject[componentName].length - 1] += (lineValue + "\n")
    }
    // }
  }
  responsesArray.push(currentObject)

  // for (let i = 0; i < responsesArray.length; i++) {
  //   for (let param in responsesArray[i]) {
  //     responsesArray[i][param] = responsesArray[i][param].join("\n")
  //   }
  // }

  console.log("responsesArray", responsesArray)

  // for (let responseObject of responsesArray) {
  //   if (responseObject.hashtags) {
  //     for (let keyword of responseObject.hashtags[0].split(" ")) {
  //       autoResponses[keyword.toLowerCase().replace("#", "").replace("\n", "")] = responseObject
  //     }
  //   }
  // }

  console.log("autoResponses", JSON.stringify(autoResponses, null, 2))

  return responsesArray
}

export async function parseTextAndConfig(docs: FetchedSlackDocs[]): Promise<ParsedTextAndconfig> {
  let payload = { config: {} as ChannelConfig } as ParsedTextAndconfig
  let text = ""

  for (let doc of docs) {
    let title = doc.title

    if (title.startsWith("[")) {
      let scope = title.split("]")[0].replace("[", "").toLowerCase().trim()
      payload[scope] = payload[scope] || { text: "" }

      let docConfig = parseConfigFromCanvas(doc.content, "[config]")
      // payload[scope].docConfig = docConfig
      if (docConfig.parser === "json") {
        payload[scope].title = doc.title
        payload[scope]["json"] = parseAutoResponses(doc.content)
      } else {
        payload.config = { ...payload.config, ...docConfig }
        if (scope !== "config") {
          payload[scope].text += doc.content.split("\n").filter(line => !line.startsWith("[")).filter(line => line.length > 1).join("\n") + "\n"
        }
      }
    }

  }

  // for (let doc of docs) {
  //   parser = { ...parser, ...parseConfigFromCanvas(doc.content, "[parser]") }
  // }

  // text = text.split("\n").filter((line) => {
  //   if (line.startsWith(":")) {
  //     return false
  //   } else {
  //     return true
  //   }
  // }).filter((l) => l.trim().length > 0).join("\n")
  return payload
}

export async function getChannelSlackDocs(channelId: string, emojiFilter: string = "["): Promise<FetchedSlackDocs[]> {
  channelId = channelId.replace("#", "")

  let docs = await getChannelDocuments(channelId)

  // console.log("docs", docs)

  docs = docs.filter((doc) => doc.mimetype === "application/vnd.slack-docs" && doc.title.startsWith(emojiFilter)) // "mimetype": "application/vnd.slack-docs"

  let fetchedDocs = await Promise.all(docs.map(async (doc) => {
    let fileContent = await getSlackFileBody(doc)
    if (fileContent.includes("function () {") || fileContent.includes("window.ts_endpoint_url")) {
      // console.log("Content invalid for doc in Channel:" + channelId)
      fileContent = ""
    }

    return { content: fileContent, title: doc.title }
  }))

  return fetchedDocs
}


export async function getDocsAndConfig(channelId: string): Promise<ParsedTextAndconfig> {
  return await parseTextAndConfig(await getChannelSlackDocs(channelId.toUpperCase()))
}

export async function getChannelDocuments(channelId: string): Promise<SlackChannelDocument[]> {
  const client = await getClient();
  if (!client) {
    return [];
  }
  try {
    const result = await client.files.list({
      channel: channelId,
      types: "spaces",
    })
    return result.files as SlackChannelDocument[]
  } catch (error) {
    console.error(error);
    return [];
  }
}

export async function getSlackFileBody(doc: SlackChannelDocument): Promise<string> {
  // log("GET", doc.id)
  const token = await resolveSlackBotToken();
  if (!token) {
    return "";
  }

  let result = await fetch(doc.url_private, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
  let htmlBody = await result.text()
  let htmlText = htmlBody.replace(/<[^>]*>/g, "")

  return htmlText
}

export function parseConfigFromCanvas(canvas: string, keyword: string = "[config]"): ChannelConfig {
  // canvas:  "<h1><control data-remapped=\"true\"><img src=\"https://slack-imgs.com/?c=1&amp;o1=gu&amp;url=https%3A%2F%2Fa.slack-edge.com%2Fproduction-standard-emoji-assets%2F14.0%2Fapple-small%2F1f916%402x.png\" alt=\"robot_face\" data-is-slack>:robot_face:</img></control> Bot Settings</h1>\n\n<p>::: set: autoreply true</p>\n\n<p>::: set: autosend true</p>\n\n<p>::: add: tools agentshub-tools-jupyter</p>\n\n"
  let lines = canvas.split("\n")
  lines = lines.filter(line => line.includes(keyword))
  let config = {} as ChannelConfig
  for (let line of lines) {
    // remove html tags from line
    line = line.replace(/<[^>]*>?/gm, '')

    let parts = line.split(keyword)[1].split(" ").filter(Boolean)

    if (parts.length > 0) {
      if (parts[0] === "set") {
        if (parts[2] === "true" || parts[2] === "false") {
          config[parts[1]] = parts[2] === "true"
        } else {
          config[parts[1]] = parts[2] && parts[2].toLowerCase()
        }
      }
      if (parts[0] === "add") {
        config[parts[1]] = config[parts[1]] || []
        config[parts[1]].push(parts[2] && parts[2].toLowerCase())
      }
    }
  }
  return config
}

export async function historyMessagesToPromptMessages(messages: any[], context: MiddlewarePayload): Promise<ChatCompletionMessageParam[]> {
  let convertedMessages = [] as ChatCompletionMessageParam[]
  let filteredMessages = messages.filter(
    (m) => m.type === "message" && (!m.subtype || m.subtype === 'bot_message' || m.subtype === 'thread_broadcast')
  )
  for (let m of filteredMessages) {
    if (m.blocks.filter(b => b.type === "actions").length > 0) {
      continue
    }
    if (m.app_id) {
      convertedMessages.push({ role: "assistant", content: m.text })
    } else {
      convertedMessages.push({ role: "user", content: `@${m.user}: ` + m.text })
    }
  }
  return convertedMessages
}

export async function getHistory(context: MiddlewarePayload) {

  const { state, config } = context

  let channelId = state.channelId
  channelId = channelId.replace("#", "")

  try {
    if (state.threadTs) {
      return await getSlackThreadHistory(channelId, state.threadTs)
    } else {
      if (!config.onlyThreadHistory) {
        return await getSlackChannelHistory(channelId)
      } else {
        return await getSlackThreadHistory(channelId, state.eventTs)
      }
    }
  } catch (error) {
    return { messages: [], error }
  }
}

export async function getSlackChannelHistory(channelId) {
  const client = await getClient();
  if (!client) {
    return { messages: [] };
  }
  try {
    const result = await client.conversations.history({
      channel: channelId.toUpperCase(),
    });

    if (result.messages) {
      result.messages.reverse()
    }
    return result;
  }
  catch (error) {
    return { messages: [], error }
  }
}

export async function getSlackThreadHistory(channelId, threadTs): Promise<ConversationsRepliesResponse> {
  const client = await getClient();
  if (!client) {
    return { messages: [] } as ConversationsRepliesResponse;
  }
  try {
    const result = await client.conversations.replies({
      channel: channelId,
      ts: threadTs,
    }) as ConversationsRepliesResponse
    return result;
  }
  catch (error) {
    console.error(error);
  }
}

// https://api.slack.com/messaging/sending
// Post a message to a channel your app is in using ID and message text
export async function postMessage(
  channelId,
  text,
  thread_ts = null,
  replyBroadcast?: boolean,
  username?: string,
  blocks?: any[],
  workspace?: string,
  // attachments?: AttachmentsPayload[],
) {

  text = text || ""
  channelId = channelId.replace("#", "")
  const client = await getClient(workspace);
  if (!client) {
    return null;
  }

  try {
    let payload = {
      channel: channelId,
      text,
      parse: "none",
      mrkdwn: true,
    } as ChatPostMessageArguments

    // if (attachments) {
    //   for (let attachment of attachments) {
    //     log("🚀 publishAttachment", attachment)
    //     payload.text += `\nAttachment (${attachment.mimeType}) ${attachment.caption || ""}`
    //     payload.text += `\n${attachment.url}`
    //   }
    // }

    if (thread_ts) {
      payload.thread_ts = thread_ts
      if (typeof payload.thread_ts !== "string") {
        delete payload.thread_ts
      }
    }

    if (replyBroadcast) {
      payload.reply_broadcast = true
    }

    if (blocks) {
      (payload as any).blocks = blocks
    }

    if (username) {
      payload = payload as ChatPostMessageArguments
      (payload as any).username = username
      payload.icon_url = `https://robohash.org/${username}.png` // ":white_check_mark:" 
      // payload.as_user = username
    }

    const result = await client.chat.postMessage(payload as any);
    return result;
  }
  catch (error) {
    console.error(error);
  }
}


export async function deleteMessage(channel_id, ts) {
  const client = await getClient();
  if (!client) {
    return;
  }
  try {
    await client.chat.delete({
      channel: channel_id,
      ts: ts
    });
  }
  catch (error) {
    console.error(error);
  }
}





export async function setStatus(channel_id, status, thread_ts) {
  console.log("🚀 setStatus", channel_id, status)

  if (!thread_ts) {
    return
  }

  const client = await getClient();
  if (!client) {
    return;
  }

  // https://api.slack.com/methods/assistant.threads.setStatus
  try {

    // Call the chat.postMessage method using the built-in WebClient
    const result = await client.assistant.threads.setStatus({
      status,
      channel_id,
      thread_ts
    });

    // Print result, which includes information about the message (like TS)
    // log(JSON.stringify(result, null, 2));
  }
  catch (error) {
    console.error(error);
  }
}

export async function setTitle(channel_id, title, thread_ts) {
  const client = await getClient();
  if (!client) {
    return;
  }
  // https://api.slack.com/methods/assistant.threads.setStatus
  try {
    await client.assistant.threads.setTitle({
      title,
      channel_id,
      thread_ts
    });
  }
  catch (error) {
    console.error(error);
  }
}
// let channelNameToId = {} as { [key: string]: string }
export async function getChannelName(channelId, context: MiddlewarePayload): Promise<string> {
  const client = await getClient();
  if (!client) {
    return "Unknown";
  }
  // https://api.slack.com/methods/conversations.info
  try {
    const result = await client.conversations.info({
      channel: channelId
    })
    context.state.channelNameToId = context.state.channelNameToId || {}
    context.state.channelNameToId[result.channel?.name] = channelId
    console.log("🥶 channel", channelId, result.channel?.name)
    return "#" + result.channel?.name || "Unknown"
  }
  catch (error) {
    console.error(error);
  }
}

function getChannelId(channelName: string, context: MiddlewarePayload): string {
  console.log("getChannelId", channelName, context.state.channelNameToId[channelName])
  if (context.state.channelNameToId[channelName]) {
    return "<#" + context.state.channelNameToId[channelName] + ">"
  }
  return channelName
}


export async function addEmojiReaction(channelId, ts, emoji) {
  const client = await getClient();
  if (!client) {
    return { error: "Slack client unavailable" };
  }
  // https://api.slack.com/methods/reactions.add
  try {
    // Remove colons from the emoji name if they exist
    const cleanEmoji = emoji.replace(/:/g, '');

    // Call the chat.postMessage method using the built-in WebClient
    await client.reactions.add({
      channel: channelId,
      timestamp: ts,
      name: cleanEmoji,
    });
  }
  catch (error) {
    return { error }
  }
}


export function getUserId(username: string, context: MiddlewarePayload): string {
  console.log(":::", context)
  context.state.usernameToIdCache = context.state.usernameToIdCache || {}
  console.log("getUserId", username, context.state.usernameToIdCache, context.state.usernameToIdCache[username])
  if (context.state.usernameToIdCache[username]) {
    return "<@" + context.state.usernameToIdCache[username] + ">"
  } else {
    return "@" + username
  }
}

export async function getUserInfo(user_id, context: MiddlewarePayload): Promise<string> {
  const client = await getClient();
  if (!client) {
    return "Unknown User Info";
  }
  // https://api.slack.com/methods/users.info
  try {
    const result = await client.users.info({
      user: user_id
    })

    let uName = result.user?.name || result.user?.real_name || result.user?.profile?.display_name || result.user?.profile?.real_name_normalized || "Unknown"
    console.log("🥶", user_id, uName)
    context.state.usernameToIdCache = context.state.usernameToIdCache || {}
    context.state.usernameToIdCache[uName] = user_id
    return uName
  }
  catch (error) {
    console.log("Error getting user info", error)
    return "Unknown User Info"
  }
}

export async function getUser(user_id, context: MiddlewarePayload) {
  context.state.userInfoCache = context.state.userInfoCache || {}
  if (context.state.userInfoCache[user_id]) {
    return context.state.userInfoCache[user_id]
  }
  context.state.userInfoCache[user_id] = await getUserInfo(user_id, context)
  return context.state.userInfoCache[user_id]
}

export async function getChannel(channel_id: string, context: MiddlewarePayload) {
  if (context.state.channelInfoCache[channel_id]) {
    return context.state.channelInfoCache[channel_id]
  }
  context.state.channelInfoCache[channel_id] = await getChannelName(channel_id, context)

  return context.state.channelInfoCache[channel_id]
}


export async function restoreNames(text: string, context: MiddlewarePayload) {
  if (!text) return text;

  // Handle user mentions
  const userIdPattern = /@U\w+/g;
  const userMatches = text.match(userIdPattern);

  if (userMatches) {
    const userReplacePromises = userMatches.map(async (match) => {
      const userId = match.replace('@', '');
      const userName = await getUser(userId, context);
      text = text.replace("<" + match + ">", "@" + userName);
      text = text.replace(match, "@" + userName);
    });
    await Promise.all(userReplacePromises);
  }

  // Handle channel mentions
  const channelIdPattern = /#(C\w+)/g;
  const channelMatches = text.match(channelIdPattern);

  if (channelMatches) {
    const channelReplacePromises = channelMatches.map(async (match) => {
      const channelId = match.replace(/#|/g, '');
      const channelName = await getChannel(channelId, context);
      text = text.replace("<" + match + "|>", channelName);
      text = text.replace(match, channelName);
    });
    await Promise.all(channelReplacePromises);
  }

  return text;
}

export function restoreIds(text: string, context: MiddlewarePayload) {
  if (!text) return text;

  console.log("restoreIds->text", text)
  console.log("CTX", context)

  // Handle user mentions
  const usernamePattern = /@\w+/g;
  const userMatches = text.match(usernamePattern);
  console.log("🔥 userMatches", userMatches)

  if (userMatches) {
    userMatches.map((match) => {
      const username = match.replace('@', '');
      text = text.replace(match, getUserId(username, context));
    });
  }

  // Handle channel mentions
  const channelIdPattern = /#\w+/g;
  const channelMatches = text.match(channelIdPattern);
  console.log("🔥 channelMatches", channelMatches)

  if (channelMatches) {
    channelMatches.map(match => {
      const channelId = match.replace(/#|/g, '');
      const channelName = getChannelId(channelId, context);
      console.log("Replace", match, channelName)
      text = text.replace(match, channelName);
    });
  }

  console.log("restoreIds text result", text)
  return text;
}

if (typeof require !== "undefined" && typeof module !== "undefined" && require.main === module) {
  (async () => {
    let result = await getDocsAndConfig("C085CLKB0UQ")

    console.log("result", JSON.stringify(result, null, 2))

    // let restoreIdsText = await restoreIds("@carlos: It seems @brain might be engaged elsewhere. Is there anything specific you need from me? I'm here to help! :sunglasses: :memo:",
    //   { state: {}, config: {} } as MiddlewarePayload)
    // console.log("restoreIdsText", restoreIdsText)


  })()
}
