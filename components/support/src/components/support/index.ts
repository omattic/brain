import { daprize, get, sendToBus } from "brain-sdk";
import { getResponseForHashtags } from "./matchHashtag";
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
      let result = await getResponseForHashtags(context?.state?.channelContext?.mech?.json, postedMessage?.redirectEvent.chatGptContext);
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


    }
  }



}

export const sqs = daprize(run)