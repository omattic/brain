import { FetchedSlackDocs, ParsedTextAndconfig } from "@services/slack";
import {
  BlockAction,
} from "@slack/bolt";
import { AllMessageEvents, AppMentionEvent, AssistantThreadContextChangedEvent } from "@slack/types";

export type SlackEvent =
  AllMessageEvents |
  AppMentionEvent |
  BlockAction |
  AssistantThreadContextChangedEvent |
  null


export type MiddlewarePayload = {
  type: "slack"
  event?: SlackEvent
  state?: ExecutionState
  config?: ChannelConfig
  finish?: boolean
}

export type BrainContext = MiddlewarePayload

export type ChannelConfig = {
  parser?: string
  disableBot?: boolean
  onlyUsernames?: boolean
  skipBroadcast?: boolean
  onlyThreadHistory?: boolean
  autoreply?: boolean
  autosend?: boolean
  proposeResponse?: boolean
  tools?: Array<string>
  agents?: string[]
  agentName?: string
  agentChannel?: string
  defaultAgent?: string
  threadPerUser?: boolean
  pipeProposal?: string
  pipeProposalAutosend?: string
  mechanicalResponses?: string
  directHumanResponse?: string
  enableMultiAgents?: string
  model?: string
  temperature?: string
  respondTo?: string
  sendToBus?: string
  isMechanical?: boolean
  isAutomatic?: boolean
  responseProfile?: string
}

export type ExecutionState = {
  prompt?: string
  userId?: string
  channelId?: string
  isAppMention?: boolean
  adminChannelId?: string
  channelType?: string
  threadTs?: string
  eventTs?: string
  isDm?: boolean
  isIm?: boolean
  isGroup?: boolean
  contextChannelId?: string
  isBotMessage?: boolean
  messageUsername?: string
  botMentioned?: boolean
  incomingMessageText?: string
  adminChannelPrompt?: string
  channelSpecificPrompt?: string
  isThreadBroadcast?: boolean
  promises?: Promise<any>[]
  historyMessages?: any[]
  adminConfig?: any,
  skipUserUsername?: boolean
  redirectEvent?: RedirectMessageToSlackChatEvent
  hasBotProfile?: boolean
  channelInfoCache?: { [key: string]: string }
  usernameToIdCache?: { [key: string]: string }
  userInfoCache?: { [key: string]: string }
  channelNameToId?: { [key: string]: string }
  channelContext?: any
  docList?: FetchedSlackDocs[]
}

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
