
import WhatsApp from 'whatsapp';
import fetch from 'node-fetch';
import * as fs from 'fs';
// import { createPresignedUrl, put, putStream } from '../storage/s3';
import { put } from 'brain-sdk';
import { PassThrough } from 'stream';
import { AudioMediaObject, DocumentMediaObject, ImageMediaObject, MessageTemplateObject, VideoMediaObject } from 'whatsapp/build/types/messages';
import { ComponentTypesEnum } from 'whatsapp/build/types/enums';
import { MessengerEvent } from './types';
import axios from 'axios';

// WhatsApp
// { ComponentTypesEnum, LanguagesEnum, ParametersTypesEnum } from 'whatsapp';

// https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/components
// https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/payload-examples
// https://developers.facebook.com/docs/whatsapp/cloud-api/guides/send-message-templates

// https://developers.facebook.com/apps/560836895592724/whatsapp-business/wa-dev-console/?business_id=199390907680778

// WhatsApp Manager:
// https://business.facebook.com/wa/manage/home/?business_id=1729767651176854&waba_id=388104074387933&global_scope_id=1729767651176854
// Templates:
// https://business.facebook.com/wa/manage/message-templates/?business_id=1729767651176854&waba_id=388104074387933&global_scope_id=1729767651176854&filters=%7B%22search_text%22%3A%22%22%2C%22tag%22%3A[]%2C%22language%22%3A[]%2C%22status%22%3A[%22APPROVED%22%2C%22IN_APPEAL%22%2C%22PAUSED%22%2C%22PENDING%22%2C%22REJECTED%22]%2C%22quality%22%3A[]%2C%22date_range%22%3A30%7D

// https://developers.facebook.com/docs/whatsapp/business-management-api/get-started#system-user-access-tokens
// https://business.facebook.com/latest/settings/system_users?business_id=1729767651176854&selected_user_id=61563918405349

// https://developers.facebook.com/docs/permissions#w

// import 'dotenv/config'

// Console:
// https://developers.facebook.com/apps/7970622379694396/dashboard/?business_id=1729767651176854
// https://developers.facebook.com/apps/7970622379694396/whatsapp-business/wa-dev-quickstart/?business_id=1729767651176854

// Templates:
// info_evento
// https://business.facebook.com/wa/manage/template-details/?business_id=1729767651176854&waba_id=388104074387933&id=1314290206645403&date_range=last_30_days


export type WMessage = {
  from: string;
  id: string;
  timestamp: string;
  text: {
    body: string;
  };
  type: string;
}
export type Status = {
  id: string;
  status: string;
  timestamp: string;
  recipient_id: string;
  conversation: {
    id: string;
    expiration_timestamp: string;
    origin: {
      type: string;
    };
  };
  pricing: {
    billable: boolean;
    pricing_model: string;
    category: string;
  };
}
const SERVICE_NAME = process.env.SERVICE_NAME || "whastapp";

export function putEvent(
  event: WhatsappEvent
) {

  return put(
    `allEvents/whastapp/${new Date().getTime()}`,
    event
  );
}

export async function putMessage(
  message: any
) {
  // console.log("👀 putDataByCustomerId", `customerId/${customerId}/${dataObject.object}/${dataObject.id}`)
  return put(
    `messages/${message.from}/${message.timestamp}`,
    message
  );
}

export async function putStatus(
  status: any
) {
  // let existingStatus = null as Status | null
  // try {
  //   existingStatus = await get(
  //     SERVICE_NAME,
  //     `statuses/${status.id}`
  //   );
  // } catch (err) {
  //   console.log(err)
  // }

  // if (existingStatus && existingStatus.timestamp > status.timestamp) {
  //   return
  // }
  // console.log("👀 putDataByCustomerId", `customerId/${customerId}/${dataObject.object}/${dataObject.id}`)
  return put(
    `statuses/${status.id}`,
    { status }
  );
}

export type WhatsappEvent = {
  object: "whatsapp_business_account" | "instagram";
  entry: {
    id: string;
    changes: {
      value: {
        messaging_product: string;
        metadata: {
          display_phone_number: string;
          phone_number_id: string;
        };
        contacts: {
          profile: {
            name: string;
          };
          wa_id: string;
        }[];
        messages: WMessage[];
        statuses: Status[];
      };
      field: string;
    }[];
  }[];
}


process.env.CLOUD_API_ACCESS_TOKEN = process.env.CLOUD_API_ACCESS_TOKEN || ""
process.env.CLOUD_API_VERSION = "v20.0"
const waPhoneNumberId = parseInt(process.env.WA_PHONE_NUMBER_ID || "407076939150585", 10);
const wa = new WhatsApp(waPhoneNumberId);

// Enter the recipient phone number
// let recipient_number = 34653596188;
// recipient_number = 34628239967;
// recipient_number = 34653596188;
// recipient_number = 56988870074;
// recipient_number = 34653596188;


const newsletter_template_request_Example = {
  "name": "new_content",
  "language":
  {
    // "policy": "deterministic",
    "code": "en_US"
  },
  "components":
    [
      {
        "type": "body",
        "parameters": [
          {
            "type": "text",
            "text": "Intermedio | Semana 1 | Día 1 - Verbs"
          }
        ]
      }
    ]
};


let mediaResponse = {
  url: 'https://lookaside.fbsbx.com/whatsapp_business/attachments/?mid=1149748132779233&ext=1725359234&hash=ATstM9wEuf8Dg_Q8WnmMNyoxcXHT44F0Lkr0nCgi2P6RDg',
  mime_type: 'audio/ogg',
  sha256: '3960ff18cae5829ea5f1bedd2bc1c6590835f1dc263f706d2043336afab3661b',
  file_size: 11755,
  id: '1149748132779233',
  messaging_product: 'whatsapp'
}

type MediaObject = {
  url: string;
  mime_type: string;
  sha256: string;
  file_size: number;
  id: string;
  messaging_product: string;
}


export async function sendWhatsappTemplate(recipientNumber: string, template: MessageTemplateObject<ComponentTypesEnum.Body & ComponentTypesEnum.Header>, replyToMessageId?: string) {
  try {
    let result = await wa.messages.template(template, parseInt(recipientNumber));
    let jsonresult = await result?.responseBodyToJSON()
    // console.log("sendWhatsappTemplate result", jsonresult)
    if (jsonresult.error) {
      console.log("sendWhatsappTemplate error", jsonresult.error.message)
    }
    return jsonresult
  }
  catch (e) {
    console.log("Error:", JSON.stringify(e));
  }
}

export async function downloadMediaToStream(mediaUrl: string | undefined, writeStream: fs.WriteStream | PassThrough) {
  return new Promise(async (success, reject) => {
    let response = await fetch(mediaUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.CLOUD_API_ACCESS_TOKEN}`
      },
    })
    if (!response.ok) {
      throw new Error(`Failed to fetch media: ${response.statusText}`);
    }
    response.body?.pipe(writeStream)
    writeStream.on('finish', () => {
      console.log('Media downloaded successfully');
      success('Media downloaded successfully ' + mediaUrl)
    });

    writeStream.on('error', (error) => {
      console.error('Error writing to file:', error);
      reject('Error downloading file ' + mediaUrl)
    });
  })
}

export async function getMediaMetadata(mediaId: string): Promise<MediaObject | undefined> {
  // curl -X GET 'https://graph.facebook.com/v20.0/<MEDIA_ID>/' \
  // -H 'Authorization: Bearer <CLOUD_API_ACCESS_TOKEN>'
  try {
    let media = await fetch(`https://graph.facebook.com/v20.0/${mediaId}/`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.CLOUD_API_ACCESS_TOKEN}`
      }
    }).then(response => {
      return response.json()
    })
    console.log("media", media)
    return media as MediaObject
  }
  catch (e) {
    console.log("Error:", JSON.stringify(e));
  }
}

export async function setTyping(phoneNumberId: string): Promise<MediaObject | undefined> {
  // curl -X GET 'https://graph.facebook.com/v20.0/<MEDIA_ID>/' \
  // -H 'Authorization: Bearer <CLOUD_API_ACCESS_TOKEN>'
  try {
    let media = await axios.post(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`,
      {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: phoneNumberId,
        type: 'typing_off'
      }, {
      headers: {
        'Authorization': `Bearer ${process.env.CLOUD_API_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    }).then((response: any) => {
      return response.json()
    })
    console.log("media", media)
    return media as MediaObject
  }
  catch (e) {
    console.log("Error:", JSON.stringify(e));
  }
}

export type ICLWebhookText = {
  type: "text",
  text: string,
} & originMessage
export type ICLWebhookAttachment = {
  type: "text" | "image" | "video" | "voice" | "document" | "file",
  url: string,
  caption?: string
  filename?: string
} & originMessage

type originMessage = {
  originChatId: string,
  originMessageId: string
}

export async function sendWhatsappMessage(
  recipientNumber: string,
  element?: ICLWebhookAttachment | ICLWebhookText,
  messengerEvent?: MessengerEvent
) {
  console.log("🔥 sendWhatsappMessage: Sending message to", recipientNumber);
  try {
    let result

    if ((element as ICLWebhookAttachment).type === "image") {
      let msgElement = element as ICLWebhookAttachment
      let msgPayload = { "link": msgElement.url } as ImageMediaObject
      if (msgElement?.caption) {
        msgPayload["caption"] = msgElement.caption
      }
      console.log("image msgPayload", msgPayload)
      result = await wa.messages.image(msgPayload, parseInt(recipientNumber));
    }

    if ((element as ICLWebhookAttachment).type === "video") {
      let msgElement = element as ICLWebhookAttachment
      let msgPayload = { "link": msgElement.url } as VideoMediaObject
      if (msgElement?.caption) {
        msgPayload["caption"] = msgElement.caption
      }
      result = await wa.messages.video(msgPayload, parseInt(recipientNumber));
    }

    if ((element as ICLWebhookAttachment).type === "voice") {
      let msgElement = element as ICLWebhookAttachment
      let msgPayload = { "link": msgElement.url } as AudioMediaObject
      // result = await wa.messages.audio(msgPayload, parseInt(recipientNumber));
      result = await wa.messages.audio(msgPayload, parseInt(recipientNumber));
    }

    if ((element as ICLWebhookAttachment).type === "document" || (element as ICLWebhookAttachment).type === "file") {
      let msgElement = element as ICLWebhookAttachment
      let msgPayload = { "link": msgElement.url, filename: msgElement.filename } as DocumentMediaObject
      if (msgElement?.caption) {
        msgPayload["caption"] = msgElement.caption
      }
      result = await wa.messages.document(msgPayload, parseInt(recipientNumber));
    }

    if ((element as ICLWebhookText).type === "text") {
      result = await wa.messages.text({ "body": (element as ICLWebhookText).text }, parseInt(recipientNumber));
    }

    result = await result?.responseBodyToJSON()
    console.log("sent_text_message result", result)

    if (result?.messages) {
      console.log("result?.messages", result?.messages)
      for (let message of result.messages) {
        console.log("message", message)
        console.log("element", element)
        if (messengerEvent && message.id) {
          if (messengerEvent.originChatId && messengerEvent.originMessageId) {
            console.log("putting bridge info", `bridge/whatsapp/sent/${message.id}`)
            let result = await put(`whatsapp/sent/${message.id}`, {
              originChatId: messengerEvent.originChatId,
              originMessageId: messengerEvent.originMessageId
            })
            console.log("put result", result)
          }
        }
      }
    }

    // console.log(sent_text_message.rawResponse());
    return result
  }
  catch (e) {
    console.log("Error:", JSON.stringify(e));
  }
}

export declare const enum VideoMediaTypesEnum {
  Mp4 = "video/mp4",
  Threegp = "video/3gp"
}
export declare const enum ImageMediaTypesEnum {
  Jpeg = "image/jpeg",
  Png = "image/png"
}
export declare const enum DocumentMediaTypesEnum {
  Text = "text/plain",
  Pdf = "application/pdf",
  Ppt = "application/vnd.ms-powerpoint",
  Word = "application/msword",
  Excel = "application/vnd.ms-excel",
  OpenDoc = "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  OpenPres = "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  OpenSheet = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
}

export type AudioObject = {
  mime_type: string
  sha256: string
  id: string
  voice: boolean
}
type VideoObject = {
  caption: string;
  filename: string;
  sha256: string;
  id: string;
  mime_type: VideoMediaTypesEnum;
};
type TextObject = {
  body: string;
};
type ImageObject = {
  caption: string;
  sha256: string;
  id: string;
  mime_type: ImageMediaTypesEnum;
};
type DocumentObject = {
  caption: string;
  filename: string;
  sha256: string;
  mime_type: DocumentMediaTypesEnum;
  id: string;
};

// telegramForwardEvent.body.change.value.messages[0].audio
// export async function extractAudioFromWaVoiceMessage(wpAudio: AudioObject) {
//   try {
//     let audio = await wa.bodyBuilder(wpAudio, 34653596188);
//     console.log("audio", audio)
//     return audio
//   }
//   catch (e) {
//     console.log("Error:", JSON.stringify(e));
//   }
// }


// async function send_message() {
//   console.log("Sending message to", recipient_number);
//   try {
//     let sent_text_message = await wa.messages.text({ "body": "Hello world " + new Date().getTime() }, recipient_number);
//     console.log("sent_text_message", sent_text_message)
//     console.log(sent_text_message.rawResponse());
//     console.log(await sent_text_message.responseBodyToJSON())
//   }
//   catch (e) {
//     console.log("Error:", JSON.stringify(e));
//   }
// }


// send_message();


export type SimpleMedia = { id: string, mime_type: string, caption?: string, voice?: boolean }

export async function getMediaUrl(messageObject: SimpleMedia) {
  return "DISABLED FOR NOW"
  // let mediaMetadata = await getMediaMetadata(messageObject.id)
  // let extension = mediaMetadata?.mime_type.split(";")[0].split('/')[1]
  // let filePath = `whatsapp/${messageObject.id}.${extension}`
  // let s3Stream = putStream("bot", filePath)
  // await downloadMediaToStream(mediaMetadata?.url, s3Stream.writeStream)
  // await s3Stream.promise
  // return createPresignedUrl({ key: `bot/${filePath}` })
}

if (require.main === module) {
  (async () => {
    // let mediaMetadata = await getMediaMetadata("1149748132779233")
    // const outputFilePath = path.join(__dirname, 'media.ogg'); // Replace with the desired output file path
    // let writeFileStream = fs.createWriteStream(outputFilePath)

    // await downloadMediaToStream(mediaMetadata?.url, writeFileStream)

    // let url = await getMediaUrl({
    //   "mime_type": "image/jpeg",
    //   // "sha256": "OWD/GMrlgp6l8b7dK8HGWQg18dwmP3BtIEMzavqzZhs=",
    //   "id": "1896552350836580",
    //   // "voice": true
    // })

    // "type": "image",
    // "image": {
    //     "mime_type": "image/jpeg",
    //     "sha256": "UTXAwdLcd6toruHnIky2PuSsbhZPSzM4l47ud2nDmyA=",
    //     "id": "1896552350836580"
    // }

    // console.log("url>", url)

    let message = {
      "name": "new_content_available",
      "language":
      {
        // "policystring": 'deterministic',
        "code": "es"
      },
      "components":
        [
          {
            "type": "header",
            "parameters": [
              {
                "type": "image",
                "image": {
                  "link": "https://cdn.inglesconliza.com/public/1kXUpbyQV_YwCQ5-xagr_JOCdwAw6z2Mv/hls/preview.jpg"
                  // "id": "1896552350836580",
                }
                // "url": "https://scontent.whatsapp.net/v/t61.29466-34/433973314_1196470044717460_1438768529705515444_n.jpg?ccb=1-7&_nc_sid=8b1bef&_nc_ohc=SMkNQqzlk5IQ7kNvgEMJ6LO&_nc_ht=scontent.whatsapp.net&oh=01_Q5AaIKn5d_IP-q1rXhLx103V78P9Q8XuBj_tYJT7KYYo9mLm&oe=66FFD81B&quot"
              }
            ]
          },
          {
            "type": "body",
            "parameters": [
              {
                "type": "text",
                "text": "Intermedio | Semana 1 | Día 1 - Verbs"
              }
            ]
          },
          {
            "type": "button",
            "index": 0,
            "sub_type": "flow",
            "parameters": [
              {
                "type": "text", "text": "¡Ver clase de hoy!"
              }
            ]
          },
          // {
          //   "type": "button",
          //   // "sub_type": "url",
          //   "parameters": [
          //     {
          //       "type": "text",
          //       "text": "Ver más",
          //       // "payload": "view_more"
          //     }
          //   ]
          // }
        ]
    };


    let textMessage = {
      "name": "new_content",
      "language":
      {
        // "policystring": 'deterministic',
        "code": "es"
      },
      "components":
        [
          // {
          //   "type": "header",
          //   "parameters": [
          //     {
          //       "type": "image",
          //       "image": {
          //         "link": "https://cdn.inglesconliza.com/public/1kXUpbyQV_YwCQ5-xagr_JOCdwAw6z2Mv/hls/preview.jpg"
          //         // "id": "1896552350836580",
          //       }
          //       // "url": "https://scontent.whatsapp.net/v/t61.29466-34/433973314_1196470044717460_1438768529705515444_n.jpg?ccb=1-7&_nc_sid=8b1bef&_nc_ohc=SMkNQqzlk5IQ7kNvgEMJ6LO&_nc_ht=scontent.whatsapp.net&oh=01_Q5AaIKn5d_IP-q1rXhLx103V78P9Q8XuBj_tYJT7KYYo9mLm&oe=66FFD81B&quot"
          //     }
          //   ]
          // },
          {
            "type": "body",
            "parameters": [
              {
                "type": "text",
                "text": "Intermedio | Semana 2 | Día 2 - Verbs"
              }
            ]
          },
          // {
          //   "type": "button",
          //   "index": 0,
          //   "sub_type": "flow",
          //   "parameters": [
          //     {
          //       "type": "text", "text": "¡Ver clase de hoy!"
          //     }
          //   ]
          // },
          // {
          //   "type": "button",
          //   "index": 0,
          //   "sub_type": "url",
          //   // "parameters": [
          //   //   {
          //   //     "type": "text",
          //   //     "text": "Ver más",
          //   //     // "payload": "view_more"
          //   //   }
          //   // ]
          // }
        ]
    };

    let textAndButtonMessage = {
      "name": "content_available",
      "language":
      {
        // "policystring": 'deterministic',
        "code": "es"
      },
      "components":
        [
          // {
          //   "type": "header",
          //   "parameters": [
          //     {
          //       "type": "image",
          //       "image": {
          //         "link": "https://cdn.inglesconliza.com/public/1kXUpbyQV_YwCQ5-xagr_JOCdwAw6z2Mv/hls/preview.jpg"
          //         // "id": "1896552350836580",
          //       }
          //       // "url": "https://scontent.whatsapp.net/v/t61.29466-34/433973314_1196470044717460_1438768529705515444_n.jpg?ccb=1-7&_nc_sid=8b1bef&_nc_ohc=SMkNQqzlk5IQ7kNvgEMJ6LO&_nc_ht=scontent.whatsapp.net&oh=01_Q5AaIKn5d_IP-q1rXhLx103V78P9Q8XuBj_tYJT7KYYo9mLm&oe=66FFD81B&quot"
          //     }
          //   ]
          // },
          {
            "type": "body",
            "parameters": [
              {
                "type": "text",
                "text": "Intermedio | Semana 2 | Día 2 - Verbs"
              }
            ]
          },
          // {
          //   "type": "button",
          //   "index": 0,
          //   "sub_type": "flow",
          //   "parameters": [
          //     {
          //       "type": "text", "text": "¡Ver clase de hoy!"
          //     }
          //   ]
          // },
          {
            "type": "button",
            "index": 0,
            "sub_type": "url",
            "parameters": [
              {
                "type": "text",
                "text": "Ver más",
                // "payload": "view_more"
              }
            ]
          }
        ]
    };

    let evento = {
      "name": "info_evento",
      "language":
      {
        // "policystring": 'deterministic',
        "code": "es"
      },
      "components":
        [
          {
            "type": "header",
            "parameters": [
              {
                "type": "image",
                "image": {
                  "link": "https://cdn.inglesconliza.com/public/1FNXRlWDtRwEeKHeGQ_R0bu6SgBjtY9kj/blob.jpg"
                  // "id": "1896552350836580",
                }
                // "url": "https://scontent.whatsapp.net/v/t61.29466-34/433973314_1196470044717460_1438768529705515444_n.jpg?ccb=1-7&_nc_sid=8b1bef&_nc_ohc=SMkNQqzlk5IQ7kNvgEMJ6LO&_nc_ht=scontent.whatsapp.net&oh=01_Q5AaIKn5d_IP-q1rXhLx103V78P9Q8XuBj_tYJT7KYYo9mLm&oe=66FFD81B&quot"
              }
            ]
          },
          {
            "type": "body",
            "parameters": [
              {
                "type": "text",
                "text": "La semana del Inglés"
              },
              {
                "type": "text",
                "text": "Comienza en 1 hora"
              }
            ]
          },
          // {
          //   "type": "button",
          //   "index": 0,
          //   "sub_type": "flow",
          //   "parameters": [
          //     {
          //       "type": "text", "text": "¡Ver clase de hoy!"
          //     }
          //   ]
          // },
          // {
          //   "type": "button",
          //   "index": 0,
          //   "sub_type": "url",
          //   "parameters": [
          //     {
          //       "type": "text",
          //       "text": "Ver más",
          //       // "payload": "view_more"
          //     }
          //   ]
          // }
        ]
    };


    let result = await sendWhatsappTemplate("34653596188", evento as any)

    // let result = await sendWhatsappMessage("34653596182", {
    //   type: "image",
    //   url: "https://cdn.inglesconliza.com/public/1kXUpbyQV_YwCQ5-xagr_JOCdwAw6z2Mv/hls/preview.jpg",
    //   caption: "123 probando de nuevo!"
    // })

    // // let result = await sendWhatsappTemplate("34653596188", evento)
    console.log("result>", result)

  })()
}
