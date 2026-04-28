// import { processSlackEvent } from "@middlewares/slackHandler";
import { sendToBus } from "brain-sdk";
import { parse } from 'querystring'

export async function webhook(event: any, context: any) {
  console.log("🚀 api:", JSON.stringify(event, null, 2));

  if (event.body) {
    if (event.isBase64Encoded) {
      console.log("🌕 IS event.isBase64Encoded, transfrorm to utf-8")
      event.body = Buffer.from(event.body, 'base64').toString('utf-8');
      delete event.isBase64Encoded
    }
  }

  if (event.body) {
    let parsedBody
    try {
      parsedBody = JSON.parse(event.body);
    } catch (e) {
      console.log("🌕 IS NOT JSON, try to parse as querystring")
      parsedBody = parse(event.body);
    }
    console.log("🌕 parsedBody", JSON.stringify(parsedBody, null, 2));
    await sendToBus(process.env.COMPONENT, { event: parsedBody });
  }

  console.log("RETURN 200")

  return {
    statusCode: 200,
    body: "OK",
  }
}
