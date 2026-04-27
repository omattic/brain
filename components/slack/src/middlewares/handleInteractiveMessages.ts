import { BlockAction } from "@slack/bolt"
import { MiddlewarePayload } from "@types"

export async function handleInteractiveMessages(params: MiddlewarePayload) {
  let { event } = params
  let slackBlockActionEvent = event as BlockAction

  if (slackBlockActionEvent?.type === "block_actions") {
    if (slackBlockActionEvent.actions?.length > 0) {
      let actionId = slackBlockActionEvent.actions[0].action_id.toLowerCase()
      if (actionId) {
        return {
          action: actionId
        }
      }
    }
    params.finish = true
  }
}
