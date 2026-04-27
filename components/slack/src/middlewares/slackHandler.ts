import { handleCommands } from "./handleCommands"
import { handleInteractiveMessages } from "./handleInteractiveMessages"
import { handleAssistantThread } from "./handleAssistantThread"
import { handleReactions } from "./handleReactions"
import { handleMessage } from "./handleMessage"

import { MiddlewarePayload, SlackEvent } from '@types'

type handlerPrototype = (params: MiddlewarePayload) => Promise<any>
export const handlersList = [
  // handleAssistantThread,
  // handleCommands,
  // handleInteractiveMessages,
  // handleReactions,
  handleMessage,
] as handlerPrototype[]

export async function processSlackEvent(event: SlackEvent) {
  let middlewarePayload = { event, config: {}, state: {}, promises: [] }
  for (let handler of handlersList) {
    console.log("ƛ🟢", handler.name)
    let result = await handler(middlewarePayload as any)
    if ((result as any)?.finish) {
      console.log("ƛ🔴", handler.name, "finished it")
      break
    }
    console.log("result", result)
  }
  await Promise.all(middlewarePayload.promises)
}
