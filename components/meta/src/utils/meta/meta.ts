import { WebhookObject } from "whatsapp/build/types/webhooks";
import { redirectMessageToSlackChat } from "../../redirectMessageToSlack";
import {
  getAllMediaCaptions,
  getInstagramHandle,
  getInstagramHandleAndImage,
  getMediaCaptionAndPermalink,
  InstagramDirectMessageEntry,
  InstagramEntry,
  replyToComment,
  sendInstagramMessage
} from "./instagram";
import { getMediaUrl, ICLWebhookAttachment, ICLWebhookText, sendWhatsappMessage, SimpleMedia } from "./wa";
import { MessengerEvent } from "./types";
import { get } from "brain-sdk";
import { getRuntimeConfig } from "brain-sdk";
import { addAlias, microHash } from "../aliaser";
import * as emoji from "node-emoji";

import debug from "debug";
const log = debug("icl:meta")

/**
 * Sleep function that creates a human-like delay
 * @param ms milliseconds to sleep, defaults to 1000ms
 * @param text optional text whose length will determine the sleep time
 * @returns Promise that resolves after the delay
 */
function sleep(ms: number = 1000, text?: string): Promise<void> {
  if (text) {
    // Calculate delay based on text length, simulating human typing
    // Initial thinking time
    const thinkingTime = 500 + Math.random() * 500;
    
    // Average human typing speed is around 40-60 WPM (200-300ms per word)
    // Words are typically 5-6 characters
    const wordsEstimate = text.length / 5;
    
    // Typing gets faster as the message gets longer (flow state)
    const typingSpeedFactor = Math.max(0.7, 1 - (wordsEstimate / 100)); // Gradually decrease typing time for longer texts
    
    // Base typing time: ~200ms per word with some randomness
    const typingTime = wordsEstimate * 200 * typingSpeedFactor;
    
    // Add randomness to make it feel more human (±20%)
    const randomFactor = 0.8 + (Math.random() * 0.4);
    
    // Calculate total delay but cap it at 20 seconds (20000ms)
    const totalDelay = Math.min((thinkingTime + typingTime) * randomFactor, 20000);
    
    return new Promise(resolve => setTimeout(resolve, totalDelay));
  }
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Biling
// https://business.facebook.com/billing_hub/accounts/details?asset_id=388104074387933&business_id=1729767651176854&placement=standalone&account_type=whatsapp-business-account

// 17841401527750596  -> @guerrerocarlos
// 509081371596726 -> @olimati.photography
let instagramBotIds = ["17841401527750596",
  "17841401707784079", "500192769437412" // Instagram DMs ID, Instagram Comments ID 
]
let instagramBots = {
  "17841401527750596": {
    handle: "guerrerocarlos",
    name: "Carlos Guerrero",
    accessToken: process.env.INSTAGRAM_ACCESS_TOKEN_CARLOS || ""
  },
  "17841401707784079": {
    handle: "inglesconliza",
    name: "Ingles Con Liza",
    accessToken: process.env.INSTAGRAM_ACCESS_TOKEN_INGLESCONLIZA || ""
  }
}

type AttachmentsToTelegram = {
  type: string,
  url: string,
  mimeType: string,
  caption?: string,
  filename?: string
}

type OmatticAIWebhook = {
  payload: any
  useBot: string
  update_id: string
  content: string
  userName: string
  userId: string
  skipAutopilot?: boolean
  change: any
  status: any
  text: string
  xid: string
  chatGptMode?: string
  chatGptContext?: string
  attachments?: AttachmentsToTelegram[]
}

export async function processWebhookBridge(messengerEvent: MessengerEvent) {
  // if (metaPayload.bridge === "instagram") {
  //   return sendMessage(event.queryStringParameters.id, event.queryStringParameters.text);
  // }
  // if (metaPayload.bridge === "instagramfeed") 
  //   return replyToComment(event.queryStringParameters.id, event.queryStringParameters.text)
  // }
  console.log("pre-EMOJIFIED:", messengerEvent.text)

  if (messengerEvent.text) {
    messengerEvent.text = emoji.emojify(messengerEvent.text)
  }
  console.log("EMOJIFIED:", messengerEvent.text)

  await sleep(undefined, messengerEvent.text)

  if (messengerEvent.bridge === "whatsapp" && messengerEvent.id) {

    if (messengerEvent.attachments) {
      for (let attachment of messengerEvent.attachments) {
        console.log("SENDING ATTACHMENT", attachment)
        await sendWhatsappMessage(messengerEvent.id, attachment as ICLWebhookAttachment, messengerEvent)
      }
    }

    if (messengerEvent.text) {
      return sendWhatsappMessage(messengerEvent.id, { type: "text", text: messengerEvent.text } as ICLWebhookText, messengerEvent)
    }

    // if (messengerEvent.template) {
    //   await sendWhatsappTemplate(messengerEvent.id, messengerEvent.template as WhatsappTemplate)
    // }
  }

  if (messengerEvent.bridge === "instagram" && messengerEvent.id) {
    if (messengerEvent.attachments) {
      for (let attachment of messengerEvent.attachments) {
        await sendInstagramMessage(messengerEvent, attachment as ICLWebhookAttachment)
      }
    }

    if (messengerEvent.text) {
      return sendInstagramMessage(messengerEvent,
        { type: "text", text: messengerEvent.text } as ICLWebhookText)
    }
  }

  if (messengerEvent.bridge === "instagramcomment" && messengerEvent.id && messengerEvent.text) {
    return replyToComment(messengerEvent.id, messengerEvent.text, {
      accountId: messengerEvent.accountId,
    })
  }

}



export async function processWebhookMessage(metaPayload: any) {
  log("processWebhookMessage", metaPayload)
  let skipAutopilot = false

  switch (metaPayload.object) {
    case "instagram":
      let instagramPayload = metaPayload as InstagramEntry
      let commentTest = [] as string[]

      for (let entry of instagramPayload.entry) {
        let entryMessaging = (entry as any as InstagramDirectMessageEntry).messaging
        if (entryMessaging) {
          let relatedUser
          for (let messagingEntry of entryMessaging) {
            relatedUser = messagingEntry.sender

            if (messagingEntry.read) {
              let originMessage = await get(`instagram/sent/${messagingEntry.read.mid}`)
              console.log("originMessage", originMessage)
              let body = {
                payload: instagramPayload,
                update_id: entry.id + "_" + messagingEntry.timestamp,
                useBot: "@taskgptbot",
                status: "read",
                originMessage
              }
              console.log("body", body)
              if (!instagramBotIds.includes(relatedUser.id)) {
                await tellGroup("ICLSupport", "InstagramDM", body)
              }
            }

            if (messagingEntry.message) {
              console.log("messagingEntry.message", messagingEntry.message)
              console.log("messagingEntry.sender", messagingEntry.sender)
              console.log("messagingEntry.sender", messagingEntry.sender)
              let senderHandleAndImage = await getInstagramHandle(messagingEntry.sender.id)
              let senderHandle = senderHandleAndImage.username
              let iID = "i:" + relatedUser.id
              let xID = microHash(iID)
              await addAlias("social", "aliases", xID, iID)
              await addAlias("social", "aliases", iID, "iu:" + senderHandle)
              if (senderHandleAndImage.profile_picture_url) {
                await addAlias("social", "aliases", iID, "ii:" + senderHandleAndImage.profilePictureUrl)
              }

              let attachments = [] as AttachmentsToTelegram[]
              let data = {
                update_id: entry.id + "_" + messagingEntry.timestamp,
                payload: instagramPayload,
                useBot: "@taskgptbot",
                userName: senderHandle,
                userId: `instagram_${relatedUser.id}`,
                skipAutopilot,
                content: "",
                text: "",
                xid: xID,
                attachments: [] as AttachmentsToTelegram[],
                // profileMediaCaptions: [] as string[]
              } as OmatticAIWebhook

              let content = ""

              console.log("⭐️ messagingEntry", messagingEntry)
              // data.profileMediaCaptions = await getAllMediaCaptions(messagingEntry.sender.id)

              // commentTest.push(`👤[@${senderHandle}](https://instagram.com/${senderHandle})`) // to ${await getInstagramHandle(messagingEntry.recipient.id)} comment:`)
              if (messagingEntry.message.text) {
                commentTest.push(`${messagingEntry.message.text}`)
                content = messagingEntry.message.text
              }

              let instagramAttachments = messagingEntry.message.attachments
              if (instagramAttachments?.length > 0) {
                let instagramAttachment = instagramAttachments[0] as any
                if (instagramAttachment.type === "image") {
                  attachments.push({ type: "image", url: instagramAttachment.payload.url, mimeType: "image/jpeg" })
                }
                if (instagramAttachment.type === "audio") {
                  attachments.push({ type: "audio", url: instagramAttachment.payload.url, mimeType: "video/mp4" })
                }
                if (instagramAttachment.type === "video") {
                  attachments.push({ type: "video", url: instagramAttachment.payload.url, mimeType: "video/mp4" })
                }
                if (instagramAttachment.type === "ig_reel") {
                  attachments.push({ type: "video", url: instagramAttachment.payload.url, mimeType: "video/mp4", caption: instagramAttachment.payload.title })
                }
              }

              data.text = commentTest.join("\n")
              data.content = content
              data.attachments = attachments

              if (!instagramBotIds.includes(relatedUser.id)) {
                relatedUser = entryMessaging[0].recipient
                skipAutopilot = true

                await sendToOmattic("ICLSupport", "InstagramDM",
                  data,
                )
              } else {
                console.log("SKIPPING SENDING")
              }
            }

          }
        } else {
          let relatedUser
          for (let change of entry.changes) {
            let content = [] as string[]


            if (change.field === "live_comments") {
              let iID = "i:" + change.value.from.id
              await addAlias("social", "aliases", iID, "iu:" + change.value.from.username)
              let xID = microHash(iID)
              await addAlias("social", "aliases", xID, iID)

              content.push(`🔴LIVE 👤[@${change.value.from.username}](https://instagram.com/${change.value.from.username}): ${change.value.text}`)
              relatedUser = change.value.from

              // TODO: Make sure relatedUser is correct
              if (relatedUser && instagramBotIds.includes(relatedUser.id)) {
                skipAutopilot = true
              }

              // let telegramPayload = {
              //   ...instagramPayload,
              //   useBot: "@taskgptbot",
              //   userName: change.value.from.username,
              //   userId: `instagramfeed_${relatedUser.id}`,
              //   skipAutopilot
              // }

              let body = {
                payload: instagramPayload,
                update_id: change.value.id,
                useBot: "@taskgptbot",
                content: change.value.text,
                userName: change.value.from.username,
                userId: `instagram_${relatedUser.id}`,
                change,
                xid: xID,
                text: content.join("\n"),
                // attachments
              } as OmatticAIWebhook

              if (!instagramBotIds.includes(relatedUser.id) && relatedUser.username !== "inglesconliza") {
                console.log("body", JSON.stringify(body, null, 2))
                await tellGroup("ICLSupport", "InstagramDM", body)
              }
            }


            if (change.field === "comments") {
              let iID = "i:" + change.value.from.id
              await addAlias("social", "aliases", iID, "iu:" + change.value.from.username)
              let xID = microHash(iID)
              await addAlias("social", "aliases", xID, iID)

              let mediaData = await getMediaCaptionAndPermalink(change.value.media.id) || {}
              let commentedMediaCaption = mediaData?.caption || ""
              let permalinkId = ""
              if (mediaData?.permalink) {
                permalinkId = mediaData?.permalink.split("/").slice(-2)[0]
              }
              let mediaCaptionForPermalink = permalinkId
              if (commentedMediaCaption?.length > 5) {
                mediaCaptionForPermalink = commentedMediaCaption.split("\n")[0]
              }
              content.push(`*Commented on post* [${mediaCaptionForPermalink.split("#")[0]}](${mediaData?.permalink}):`)
              content.push(`${change.value.text}`)
              relatedUser = change.value.from

              // TODO: Make sure relatedUser is correct
              if (relatedUser && instagramBotIds.includes(relatedUser.id)) {
                skipAutopilot = true
              }

              // let telegramPayload = {
              //   ...instagramPayload,
              //   useBot: "@taskgptbot",
              //   userName: change.value.from.username,
              //   userId: `instagramfeed_${relatedUser.id}`,
              //   skipAutopilot
              // }

              let body = {
                payload: instagramPayload,
                update_id: change.value.id,
                useBot: "@taskgptbot",
                content: change.value.text,
                userName: change.value.from.username,
                userId: `instagram_${relatedUser.id}`,
                change,
                xid: xID,
                text: content.join("\n"),
                chatGptMode: "GetCommentAndResponse",
                chatGptContext: (commentedMediaCaption ? ("These are comments attached to an instagram post with this caption: " + commentedMediaCaption) : ("The instagram post has no caption.")),
                // attachments
              } as OmatticAIWebhook

              if (!instagramBotIds.includes(relatedUser.id) && relatedUser.username !== "inglesconliza") {
                console.log("body", JSON.stringify(body, null, 2))
                await tellGroup("ICLSupport", "InstagramComments", body)
              }
            }
          }


          // if(relatedUser.id === "17841401527750596") {
          //   relatedUser = entry.changes[0].value.from
          // }

          // if (instagramPayload.entry[0].changes[0].value.from.id !== "17841401527750596") { // ALWAYS CHECK THAT IS NOT BY OURSELVES xD
          //   let result = await replyToComment(instagramPayload.entry[0].changes[0].value.id, `@${instagramPayload.entry[0].changes[0].value.from.username} te envié un mensaje privado 📫`)
          //   console.log("COMPLETED reply!", result)
          //   result = await sendMessage(instagramPayload.entry[0].changes[0].value.from.id, `¡Hola ${instagramPayload.entry[0].changes[0].value.from.username}! ¡Gracias por escribirme! Nos vemos en http://carlosguerrero.com/ `)
          //   console.log("COMPLETED message!", result)
          // }

          // TODO: Maybe find a way to get the instagramfeed_userId of the person who commented, related to **1

        }
      }


      break;
    case "whatsapp_business_account":
      let whatsappPayload = metaPayload as WebhookObject;
      for (let entry of whatsappPayload.entry) {
        for (let change of entry.changes) {
          if (change.value.messaging_product === "whatsapp" && change.field === "messages") {
            let content = []
            let wMessageLines = []
            log("change", change)

            // TODO, handle change.value.statuses
            // "statuses": [
            //   {
            //     "id": "wamid.HBgLMzQ2NTM1OTYxODIVAgARGBI5OEQyQTFEQkI1RjFCQjU4MjgA",
            //     "status": "delivered",
            //     "timestamp": "1725319118",
            //     "recipient_id": "34653596182",
            //     "conversation": {
            //       "id": "04f8fba3bb50bba45c5b3b61986e387e",
            //       "origin": {
            //         "type": "service"
            //       }
            //     },
            //     "pricing": {
            //       "billable": true,
            //       "pricing_model": "CBP",
            //       "category": "service"
            //     }
            //   }
            // ]

            console.log("statuses?")
            if (change.value.statuses) {
              console.log("statuses: yes")
              for (let status of change.value.statuses) {
                let originMessage = await get(`whatsapp/sent/${status.id}`)
                console.log("originMessage", originMessage)
                let body = {
                  payload: whatsappPayload,
                  update_id: status.recipient_id + "_" + status.timestamp,
                  useBot: "@taskgptbot",
                  status: status,
                  originMessage
                }
                console.log("body", body)
                await tellGroup("ICLSupport", "WhatsApp", body)
              }
            }

            if (change.value.contacts) {
              let wID = "wi:" + change.value.contacts[0].wa_id
              await addAlias("social", "aliases", wID, `wn:${change.value.contacts[0].profile.name}`)
              let gotUsername
              for (let contact of change.value.contacts) {
                gotUsername = `${contact.profile.name} (+${contact.wa_id})`
                // wMessageLines.push(`📱 ${contact.profile.name} (+${contact.wa_id})`)
              }
              let xID = microHash(wID)
              await addAlias("social", "aliases", xID, wID)
              let attachments = []
              for (let message of change.value.messages) {
                let gotSomething = false
                if (message.type === "text") {
                  gotSomething = true
                  wMessageLines.push(`${message.text?.body}`)
                  content.push(message.text?.body)
                }
                if (message.type === "image" || message.type === "video" || message.type === "document" || message.type === "audio") {
                  gotSomething = true
                  let attachmentObject = message[message.type] || {}
                  attachments.push({ type: message.type, url: await getMediaUrl(attachmentObject as SimpleMedia), caption: (attachmentObject as any).caption || (attachmentObject as any).filename, mimeType: (attachmentObject as any)?.mime_type })
                }
                if (!gotSomething) {
                  let payload = (message as any)[message.type]
                  wMessageLines.push(JSON.stringify(payload, null, 2))
                }

                let body = {
                  payload: whatsappPayload,
                  update_id: change.value.messages[0].id,
                  useBot: "@taskgptbot",
                  content: content.join("\n"),
                  userName: gotUsername || change.value.contacts[0].profile.name,
                  userId: `whatsapp_${change.value.contacts[0].wa_id}`,
                  change,
                  attachments,
                  xid: xID,
                  text: wMessageLines.join("\n")
                } as OmatticAIWebhook

                await tellGroup("ICLSupport", "WhatsApp", body)
              }
            }
          }
        }
      }
  }
}

function normalizeChannelKey(value: string) {
  return value
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toUpperCase();
}

const SLACK_CONFIG_NAMESPACE = "slackConfig";

type SlackDestinationConfig = {
  channelId: string;
  workspace?: string;
};

function getSlackConfigNamespace() {
  const cloudflare = getRuntimeConfig().cloudflare;
  return cloudflare?.kv?.[SLACK_CONFIG_NAMESPACE] || cloudflare?.resolveKV?.(SLACK_CONFIG_NAMESPACE);
}

async function getStoredSlackDestination(groupName: string, topicName: string): Promise<SlackDestinationConfig | null> {
  const namespace = getSlackConfigNamespace();
  if (!namespace) {
    return null;
  }

  const groupKey = normalizeChannelKey(groupName).toLowerCase();
  const topicKey = normalizeChannelKey(topicName).toLowerCase();
  const candidateKeys = [
    `slack/destinations/${groupKey}/${topicKey}`,
    `slack/destinations/${topicKey}`,
  ];

  for (const key of candidateKeys) {
    const rawValue = await namespace.get(key);
    if (!rawValue) {
      continue;
    }

    try {
      const parsed = JSON.parse(rawValue) as SlackDestinationConfig;
      if (parsed?.channelId) {
        return parsed;
      }
    } catch (error) {
      console.warn(`Invalid Slack destination config at ${key}`, error);
    }
  }

  return null;
}

function resolveEnvSlackDestination(groupName: string, topicName: string): SlackDestinationConfig | null {
  const groupKey = normalizeChannelKey(groupName);
  const topicKey = normalizeChannelKey(topicName);

  const channelId =
    process.env[`${groupKey}_${topicKey}_CHANNEL`] ||
    process.env[`${topicKey}_CHANNEL`] ||
    process.env.META_SLACK_CHANNEL ||
    process.env.ADMIN_CHANNEL ||
    "";

  if (!channelId) {
    return null;
  }

  return {
    channelId,
    workspace: process.env[`${groupKey}_${topicKey}_WORKSPACE`] || process.env[`${topicKey}_WORKSPACE`] || process.env.META_SLACK_WORKSPACE || process.env.SLACK_DEFAULT_WORKSPACE || undefined,
  };
}

async function routeMetaEventToSlack(groupName: string, topicName: string, payload: any) {
  const destination = (await getStoredSlackDestination(groupName, topicName)) || resolveEnvSlackDestination(groupName, topicName);
  if (!destination?.channelId) {
    console.warn(`Skipping Meta Slack redirect for ${groupName}/${topicName} because no Slack channel is configured`);
    return;
  }

  await redirectMessageToSlackChat({
    ...payload,
    channel_id: destination.channelId,
    workspace: destination.workspace,
    username: payload.username || payload.userName,
    text: payload.text || payload.content || payload.status?.status || "",
  });
}

export async function sendToOmattic(groupName: string, topicName: string, data: any) {
  await routeMetaEventToSlack(groupName, topicName, data);
}

export async function tellGroup(groupName: string, topicName: string, body: any) {
  await routeMetaEventToSlack(groupName, topicName, body);
}
