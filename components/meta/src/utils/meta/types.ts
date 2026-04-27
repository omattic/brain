export type MessengerEvent = {
  object: "messenger_bridge";
  bridge: "whatsapp" | "instagram" | "instagramcomment";
  id: string;
  comment_id?: string;
  text?: string;
  attachments?: MessengerEventAttachments[]
  originChatId?: string;
  originMessageId?: string;
  // template: WhatsappTemplate[]
}

type MessengerEventAttachments = {
  type: "image" | "video" | "audio" | "file" | "location";
  url: string;
  caption?: string;
}