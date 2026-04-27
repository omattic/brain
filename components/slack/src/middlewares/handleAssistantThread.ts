import { AssistantThreadContextChangedEvent } from "@slack/bolt"
import { MiddlewarePayload } from "@types"

// let example = {
//   "type": "assistant_thread_context_changed",
//   "assistant_thread": {
//     "user_id": "U08MM3PTRJ8",
//     "context": {
//       "channel_id": "C08MMT6JHHR",
//       "team_id": "T08MM3PTRHA",
//       "enterprise_id": null
//     },
//     "channel_id": "D08MMTK9FQT",
//     "thread_ts": "1744667059.275069"
//   },
//   "event_ts": "1744667175.699960"
// }

export async function handleAssistantThread(params: MiddlewarePayload): Promise<any> {
  let slackEvent = params.event as AssistantThreadContextChangedEvent

  if (slackEvent?.type === 'assistant_thread_context_changed') {
    let assistantThread = slackEvent.assistant_thread
    // await put(`assistant_thread_context/${assistantThread.user_id}`, assistantThread)
  }

  params.finish = true
}