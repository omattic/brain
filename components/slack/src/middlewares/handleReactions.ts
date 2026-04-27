import { ReactionAddedEvent } from "@slack/types"
import { getMessageByTs } from "@services/slack"
import { MiddlewarePayload } from "@types"

export async function handleReactions(params: MiddlewarePayload) {
  let reactionEvent = params.event as any as ReactionAddedEvent

  if (reactionEvent.type === 'reaction_added') {
    if (reactionEvent.reaction === 'eyes') {
      params.event = await getMessageByTs(reactionEvent.item.channel, reactionEvent.item.ts)
    } else {
      params.finish = true
    }
  }
}