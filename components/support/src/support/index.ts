import { daprize, get, sendToBus } from "brain-sdk";
import { getResponseForHashtags } from "./matchHashtag";
import {
  ensureInstagramResponseProfile,
  recordInstagramResponse,
  resolveInstagramResponse,
} from "brain-database";
import * as emoji from "node-emoji";

export async function run(event: any, context: any) {
  console.log("👾 support -> run", JSON.stringify(event, null, 2))

  if (event.fnName) {
    if (event.fnName === "postMessage") {

      event.params.text = emoji.emojify(event.params.text)
      let postedMessage = await get("postedMessages/" + `${context.state.channelId}/ts/${context.event.event_ts}.json`, { retry: 5 })
      if (postedMessage?.redirectEvent) {
        context.redirectEvent = postedMessage.redirectEvent

        await sendToBus("slack", {
          event: {
            fnName: "postMessage",
            params: {
              text: "" + event.params.text,
            },
          },
          context
        })

        if (context.state.channelContext?.config.supportChannel && context.state.channelContext?.config.supportSystem) {
          let fnName = "sendMessage"
          if (context.state.channelContext?.config.supportChannel === "whatsapp") {
            fnName = "sendWhatsappMessage"
          }
          if (context.state.channelContext?.config.supportChannel === "instagram") {
            fnName = "sendInstagramMessage"
          }
          await sendToBus(context.state.channelContext?.config.supportSystem, {
            event: {
              fnName,
              params: {
                text: "" + event.params.text,
              },
            },
            context
          })
        }

      }

    }
  }

  if (context?.state?.channelContext?.mech) {
    let postedMessage = await get("postedMessages/" + `${context.state.channelId}/ts/${context.event.event_ts}.json`, { retry: 5 })
    if (postedMessage?.redirectEvent) {
      console.log("redirectEvent", JSON.stringify(postedMessage.redirectEvent, null, 2))
      console.log("Let's process this!")
      const responseProfile = context.state.channelContext?.config?.responseProfile || context.state.channelId || postedMessage.redirectEvent.channel_id || "default";
      const fallbackRules = context?.state?.channelContext?.mech?.json || [];
      await ensureInstagramResponseProfile(responseProfile, fallbackRules, "support-mech-seed");
      let result = await resolveInstagramResponse(
        responseProfile,
        postedMessage?.redirectEvent.chatGptContext || "",
        fallbackRules
      ) || getResponseForHashtags(fallbackRules, postedMessage?.redirectEvent.chatGptContext || "");
      context.redirectEvent = postedMessage.redirectEvent
      await sendToBus("meta", {
        event: {
          fnName: "sendDirectMessage",
          params: {
            text: result.dm,
          },
        },
        context
      })
      await sendToBus("meta", {
        event: {
          fnName: "sendComment",
          params: {
            text: result.comment,
          },
        },
        context
      })
      await sendToBus("slack", {
        event: {
          fnName: "postMessage",
          params: {
            text: "[comment]: " + result.comment,
            replyInThread: true
          },
        },
        context
      })
      await sendToBus("slack", {
        event: {
          fnName: "postMessage",
          params: {
            text: "[dm]: " + result.dm,
            replyInThread: true
          },
        },
        context
      })

      await recordInstagramResponse(responseProfile, {
        profile: responseProfile,
        matchedHashtag: "matchedHashtag" in result ? result.matchedHashtag : undefined,
        ruleId: "ruleId" in result ? result.ruleId : undefined,
        postText: postedMessage?.redirectEvent.chatGptContext || "",
        redirectEvent: postedMessage.redirectEvent,
        response: {
          comment: result.comment,
          dm: result.dm,
        },
        meta: {
          channelId: context.state.channelId,
          eventTs: context.event.event_ts,
        },
      });


    }
  }



}

export const sqs = daprize(run)
