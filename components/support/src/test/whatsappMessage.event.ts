export const event = {
  "event": {
    "fnName": "getCompletion",
    "prompt": {
      "model": "gpt-4o-mini",
      "n": 1,
      "temperature": 0.8,
      "messages": [
        {
          "role": "system",
          "content": ""
        },
        {
          "role": "assistant",
          "content": "¿Hola! como están?"
        },
        {
          "role": "assistant",
          "content": "¿cómo va todo por aqui?"
        }
      ]
    }
  },
  "context": {
    "event": {
      "subtype": "thread_broadcast",
      "bot_id": "B081AM1MACX",
      "thread_ts": "1745950503.724959",
      "root": {
        "subtype": "bot_message",
        "text": "¿Hola! como están?",
        "username": "Carlos (+34653596182)",
        "type": "message",
        "ts": "1745950503.724959",
        "bot_id": "B081AM1MACX",
        "app_id": "A081TNA8XPW",
        "thread_ts": "1745950503.724959",
        "reply_count": 1,
        "reply_users_count": 1,
        "latest_reply": "1745950561.445589",
        "reply_users": [
          "B081AM1MACX"
        ],
        "is_locked": false,
        "blocks": [
          {
            "type": "rich_text",
            "block_id": "WwHs",
            "elements": [
              {
                "type": "rich_text_section",
                "elements": [
                  {
                    "type": "text",
                    "text": "¿Hola! como están?"
                  }
                ]
              }
            ]
          }
        ]
      },
      "username": "Carlos (+34653596182)",
      "type": "message",
      "ts": "1745950561.445589",
      "app_id": "A081TNA8XPW",
      "text": "¿cómo va todo por aqui?",
      "blocks": [
        {
          "type": "rich_text",
          "block_id": "hxkn",
          "elements": [
            {
              "type": "rich_text_section",
              "elements": [
                {
                  "type": "text",
                  "text": "¿cómo va todo por aqui?"
                }
              ]
            }
          ]
        }
      ],
      "channel": "C084PS720SW",
      "event_ts": "1745950561.445589",
      "channel_type": "group"
    },
    "config": {},
    "state": {
      "isThreadBroadcast": true,
      "channelId": "C084PS720SW",
      "threadTs": "1745950503.724959",
      "eventTs": "1745950561.445589",
      "isIm": false,
      "isGroup": false,
      "messageUsername": "carlos (+34653596182)",
      "incomingMessageText": "¿cómo va todo por aqui?",
      "hasBotProfile": false,
      "channelContext": {
        "config": {
          "disableBot": false,
          "sendToBus": "support",
          "skipUserHistory": false,
          "onlyUsernames": true,
          "onlyUserThread": true
        },
        "bot": {
          "text": "Esta comunicación sucede por WhatsApp, adopta un tono acorde, sencillo y sincero. Un poco mas personal que por redes sociales.\nHas que la conversación sea formal pero cercana, el objetivo es que el cliente se sienta motivado a comprar el curso de inglés (Club de Inglés) y/o formar parte de las \"clases de speaking\" para mejorar su pronunciación y lograr todas sus metas personales.\nLa misión de Liza es ayudar a todas las personas a lograr sus metas, y el aprendizaje del Inglés es una de las herramientas mas útiles que se pueden tener para lograrlo.\nSi el usuario no da mucha información, hazle preguntas sobre lo que le gusta hacer o cuales son sus metas.\nNo incluyas mensajes en formato Markdown, responde en texto plano.\nSiempre responde en singular, no digas \"contamos\" \"ofrecemos\" siempre dilo en singular \"cuento\" \"ofrezco\".\nNo digas “hola” varias veces en un solo hilo de conversación.\nIncluye siempre dos emojis en la respuesta, y que el último sea 💕\nNunca menciones que eres un asistente virtual, para el usuario tú eres Liza. Una mujer, rubia de 34 años, casada con dos niños pequeños\nDirige al usuario siempre a https://curso.inglesconliza.com/ para mas información, precios y suscribirse en solo unos pocos clicks.\n\n"
        }
      }
    },
    "promises": []
  }
}
