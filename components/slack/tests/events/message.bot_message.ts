import { BotMessageEvent } from "@slack/types"

export default {
  "subtype": "bot_message",
  "text": "Hello are you there?",
  "username": "guerrerocarlos",
  "icons": {
    "image_48": "https://s3-us-west-2.amazonaws.com/slack-files2/bot_icons/2025-01-02/8264810894784_48.png"
  },
  "type": "message",
  "ts": "1741376681.681839",
  "bot_id": "B081AM1MACX",
  "app_id": "A081TNA8XPW",
  "blocks": [
    {
      "type": "rich_text",
      "block_id": "cVrp",
      "elements": [
        {
          "type": "rich_text_section",
          "elements": [
            {
              "type": "emoji",
              "name": "bust_in_silhouette",
              "unicode": "1f464"
            },
            {
              "type": "link",
              "url": "https://instagram.com/guerrerocarlos",
              "text": "@guerrerocarlos",
              "unsafe": true
            },
            {
              "type": "text",
              "text": "\nBuen día, quiero saber mas de tu curso"
            }
          ]
        }
      ]
    }
  ],
  "channel": "C085CLKB0UQ",
  "event_ts": "1741376681.681839",
  "channel_type": "group"
} as BotMessageEvent