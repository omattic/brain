// import { processSlackEvent } from "@middlewares/slackHandler";
import { sendToBus } from "brain-sdk";

export async function webhook(event: any, context: any) {
  console.log("🚀 api:", JSON.stringify(event, null, 2));

  if (event.body) {
    let parsedBody = JSON.parse(event.body);
    await sendToBus("meta", { event: parsedBody, context: {} });
  }

  return {
    statusCode: 200,
    body: "OK",
  }
}
