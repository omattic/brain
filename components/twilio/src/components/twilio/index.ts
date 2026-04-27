import { daprize, sendToBus } from "brain-sdk";
import { parse } from 'querystring'

type TwilioSMS = {
  ToCountry: string
  ToState: string
  SmsMessageSid: string
  NumMedia: number
  ToCity: string
  FromZip: string
  SmsSid: string
  SmsStatus: string
  FromCity: string
  Body: string
  FromCountry: string
  To: string
  ToZip: string
  NumSegments: number
  MessageSid: string
  AccountSid: string
  From: string
  ApiVersion: string
}

export async function run(event: TwilioSMS,) {
  console.log(`👾 ${process.env.COMPONENT} -> run`, JSON.stringify(event, null, 2))
  if (!process.env.SLACK_SMS_CHANNEL) {
    console.warn("Skipping twilio run because SLACK_SMS_CHANNEL is not configured");
    return;
  }

  let twillioSms = event as TwilioSMS

  await sendToBus("slack", {
    event: {
      fnName: "postMessage",
      params: {
        text: twillioSms.Body,
        username: "[SMS " + twillioSms.SmsStatus + "] " + twillioSms.From + " -> " + twillioSms.To + " (" + twillioSms.ToCountry + twillioSms.ToState + ")",
        replyBroadcast: true
      }
    },
    context: {
      state: {
        channelId: process.env.SLACK_SMS_CHANNEL,
      }
    }
  })

}

export const sqs = daprize(run)
