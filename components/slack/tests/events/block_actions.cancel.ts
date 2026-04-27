import { BlockAction } from "@slack/bolt";

export default {
  "type": "block_actions",
  "user": {
    "id": "U081JEVJ430",
    "username": "guerrerocarlos",
    "name": "guerrerocarlos",
    "team_id": "T081R0Z2ELB"
  },
  "api_app_id": "A081TNA8XPW",
  "token": "w3piJZEQpjY1opLDAhHspSIL",
  "container": {
    "type": "message",
    "message_ts": "1743608943.777089",
    "channel_id": "C085CLKB0UQ",
    "is_ephemeral": false,
    "thread_ts": "1743601101.909309"
  },
  "trigger_id": "8699718666595.8059033082691.5b3254bd67cc071c88b64a308d03c32e",
  "team": {
    "id": "T081R0Z2ELB",
    "domain": "r3jso"
  },
  "enterprise": null,
  "is_enterprise_install": false,
  "channel": {
    "id": "C085CLKB0UQ",
    "name": "privategroup"
  },
  "message": {
    "subtype": "thread_broadcast",
    "bot_id": "B081AM1MACX",
    "thread_ts": "1743601101.909309",
    "root": {
      "subtype": "bot_message",
      "text": ":bust_in_silhouette:<https://instagram.com/guerrerocarlos|@guerrerocarlos>\n123 probando",
      "username": "guerrerocarlos",
      "icons": {
        "image_48": "https://s3-us-west-2.amazonaws.com/slack-files2/bot_icons/2025-01-02/8264810894784_48.png"
      },
      "type": "message",
      "ts": "1743601101.909309",
      "bot_id": "B081AM1MACX",
      "app_id": "A081TNA8XPW",
      "thread_ts": "1743601101.909309",
      "reply_count": 7,
      "reply_users_count": 2,
      "latest_reply": "1743622075.992309",
      "reply_users": [
        "B081AM1MACX",
        "U081JJPQDT8"
      ],
      "is_locked": false,
      "subscribed": false,
      "blocks": [
        {
          "type": "rich_text",
          "block_id": "dGJaV",
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
                  "text": "\n123 probando"
                }
              ]
            }
          ]
        }
      ]
    },
    "user": "U081JJPQDT8",
    "type": "message",
    "ts": "1743608943.777089",
    "app_id": "A081TNA8XPW",
    "text": "¡Hola! :blush: En nuestra plataforma ofrecemos una variedad de cursos de inglés que se adaptan a diferentes niveles y necesidades. Puedes encontrar cursos desde inglés básico hasta avanzado, así como opciones especializadas como inglés para negocios y certificación. ¿Te gustaría saber más sobre algún curso en particular?",
    "blocks": [
      {
        "type": "section",
        "block_id": "falOe",
        "text": {
          "type": "mrkdwn",
          "text": "```¡Hola! 😊 En nuestra plataforma ofrecemos una variedad de cursos de inglés que se adaptan a diferentes niveles y necesidades. Puedes encontrar cursos desde inglés básico hasta avanzado, así como opciones especializadas como inglés para negocios y certificación. ¿Te gustaría saber más sobre algún curso en particular?```",
          "verbatim": false
        }
      },
      {
        "type": "actions",
        "block_id": "UMxTi",
        "elements": [
          {
            "type": "button",
            "action_id": "send",
            "text": {
              "type": "plain_text",
              "text": "Send",
              "emoji": true
            },
            "style": "primary",
            "value": "click_me_123"
          },
          {
            "type": "button",
            "action_id": "Cancel",
            "text": {
              "type": "plain_text",
              "text": "Cancel",
              "emoji": true
            },
            "style": "danger",
            "value": "click_me_123"
          }
        ]
      }
    ]
  },
  "state": {
    "values": {}
  },
  "response_url": "https://hooks.slack.com/actions/T081R0Z2ELB/8699718666499/LBOWHPdDpFhOmdUQz61PhlQJ",
  "actions": [
    {
      "action_id": "cancel",
      "block_id": "UMxTi",
      "text": {
        "type": "plain_text",
        "text": "Cancel",
        "emoji": true
      },
      "value": "click_me_123",
      "type": "button",
      "action_ts": "1743622789.991329"
    }
  ],
  "pathParameters": {
    "proxy": "r3js/interactivity"
  }
} as BlockAction