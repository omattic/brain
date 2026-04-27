import { AppMentionEvent } from "@slack/types";

export default {
  "user": "U047WF90752",
  "subtype": "document_mention",
  "document_mention": {
    "file_id": "F08MK530MDZ",
    "section_id": "temp:C:XeH589d2dc13c4a4a729235360f0",
    "mentioning_user_ids": [
      "U047WF90752"
    ]
  },
  "type": "app_mention",
  "ts": "1744229393.245989",
  "text": "Se ha mencionado a <@U05UWGZTLGK> en un canvas",
  "team": "T047TUU321Z",
  "blocks": [
    {
      "type": "section",
      "block_id": "ImPH6",
      "text": {
        "type": "mrkdwn",
        "text": "&gt;&gt;&gt;Your name is <@U05UWGZTLGK>  this is a Slack Channel, we have a kind conversation, make the user feel confortable.",
        "verbatim": false
      }
    }
  ],
  "channel": "C08MK530MDZ",
  "event_ts": "1744229393.245989"
} as AppMentionEvent