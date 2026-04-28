import { daprize, sendToBus, isAuthorized } from "brain-sdk";
import { BrainContext } from "@types";

export async function run(event: any, context: BrainContext) {
  let authorized = await isAuthorized({ event, context }, "datetime", "Can I get authorization to see my watch? ⌚️")

  if (authorized) {
    event = authorized.event
    context = authorized.context

    event.text = "Current timestamp is: " + new Date().toISOString()

    await sendToBus("brain", {
      event,
      context
    })
  }
}

export const sqs = daprize(run)

export const toolDefinition = {
  type: "function",
  function: {
    "name": "datetime",
    "description": "Provides the current date and time.",
    "parameters": {
    }
  }
}
