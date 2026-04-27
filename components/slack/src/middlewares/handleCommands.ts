import { MiddlewarePayload } from "@types";

export async function handleCommands
  (params: MiddlewarePayload): Promise<any> {
  // let { state, slackEnvelope } = params
  // let blocks = (slackEnvelopeEvent as any).blocks as Array<Block>

  // if (
  //   blocks.length > 0
  //   && blocks[0].type === "rich_text"
  //   && blocks[0].elements.length > 0
  //   && blocks[0].elements[0].elements.length > 1
  // ) {
  //   let userId = blocks[0].elements[0].elements[0].user_id
  //   let commandText = blocks[0].elements[0].elements[1].text || ""
  //   commandText = commandText.trim()
  //   let commandParameter = blocks[0].elements[0].elements[2]?.text

  //   if (userId === slackEnvelopeAuthorizations[0].user_id) {
  //     if (commands[commandText.slice(1)]) {
  //       await commands[commandText.slice(1)](slackMessage, commandParameter)
  //       return true
  //     }
  //   }
  // }
}
