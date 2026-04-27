export function renderAuthorizationBlocks(text, componentName, id) {
  return [
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": text
      }
    },
    {
      "type": "actions",
      "elements": [
        {
          "type": "button",
          "style": "primary",
          "text": {
            "type": "plain_text",
            "text": "Authorize",
            "emoji": true
          },
          "value": componentName + "__" + id,
          "action_id": "authorize_tool_call"
        },
        {
          "type": "button",
          "style": "danger",
          "text": {
            "type": "plain_text",
            "text": "Cancel",
            "emoji": true
          },
          "value": componentName + "__" + id,
          "action_id": "authorize_tool_call"
        }
      ]
    }
  ]
}