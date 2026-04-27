import { publishMessage } from "src/utils/slack"

export default async function channel(slackMessage) {
  let placeholderMessage = await publishMessage(slackMessage.event.channel, `\`Channel: ${slackMessage.event.channel}\``, slackMessage.event.thread_ts)
  console.log("placeholderMessage", placeholderMessage)
}