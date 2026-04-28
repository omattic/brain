// import { processSlackEvent } from "@middlewares/slackHandler";
import { sendToBus } from "brain-sdk";
import { parse } from 'querystring'

async function updateInteractiveMessage(responseUrl: string, text: string, blocks: any[]) {
  await fetch(responseUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      replace_original: true,
      text,
      blocks,
    }),
  });
}

export async function webhook(event: any, context: any) {
  console.log("🚀 api:", JSON.stringify(event, null, 2));

  if (event.body) {
    let parsedBody = JSON.parse(event.body);
    if (parsedBody.type === "url_verification") {
      return {
        statusCode: 200,
        body: parsedBody.challenge,
      }
    }
    if (parsedBody.event) {
      await sendToBus("slack", parsedBody);
    }
  }

  console.log("RETURN 200")

  return {
    statusCode: 200,
    body: "OK",
  }
}

export async function interactivity(event, context) {
  console.log("🚀 interactivity:", JSON.stringify(event, null, 2));

  if (event.body) {
    if (event.isBase64Encoded) {
      event.body = Buffer.from(event.body, 'base64').toString('utf-8');
    }
    console.log("🌕 event.body", event.body)
    try {
      event.body = JSON.stringify(JSON.parse(event.body));
    } catch (err) {
      console.log("🔴 err", err)
      let bodyObject = parse(event.body)
      if (bodyObject?.payload) {
        event.body = bodyObject?.payload as string
      }
      console.log("🍑 event.body", typeof event.body, event.body)
      console.log("🌕 Parse querystring result", event.body)
      delete event.isBase64Encoded
      console.log("bodyObject", JSON.parse(event.body))

      let buttonPressedPayload = JSON.parse(event.body)
      let buttonPressedAction = buttonPressedPayload.actions[0]

      let destinationComponent = buttonPressedAction.value.split("__")[0]
      let destinationCallId = buttonPressedAction.value.split("__")[1]

      await sendToBus(destinationComponent, {
        event: {
          type: "tool_call_authorization",
          action: buttonPressedAction.action_id,
          toolCallId: destinationCallId,
        },
        context: {}
      })

      let originalBlocks = buttonPressedPayload.message.blocks
      let newBlocks = [originalBlocks[0]]
      let newText = `*Authorized* by <@${buttonPressedPayload.user.id}>.`
      newBlocks.push(
        {
          "type": "context",
          "elements": [
            {
              "type": "mrkdwn",
              "text": newText
            }
          ]
        }
      )
      let updatedText = buttonPressedPayload.message.text + "\n" + newText

      await updateInteractiveMessage(buttonPressedPayload.response_url, updatedText, newBlocks)

      // if (event.body && typeof event.body !== "string" && (event.body as any).payload) {
      //   console.log("🌕 event.body not string, stringify...")
      //   event.body = (event.body as any).payload
      // }
    }
  }


  return {
    statusCode: 200,
    body: "OK",
  }
}

export async function menu(event, context) {
  console.log("🚀 interactivity:", JSON.stringify(event, null, 2));
  return {
    statusCode: 200,
    body: "OK",
  }
}

if (require.main === module) {
  (async () => {
    let event = {
      "version": "2.0",
      "routeKey": "ANY /interactivity",
      "rawPath": "/interactivity",
      "rawQueryString": "",
      "headers": {
        "accept": "application/json,*/*",
        "accept-encoding": "gzip,deflate",
        "content-length": "2567",
        "content-type": "application/x-www-form-urlencoded",
        "host": "rpotential-slack-bot.r.r3js.com",
        "user-agent": "Slackbot 1.0 (+https://api.slack.com/robots)",
        "x-amzn-trace-id": "Root=1-6808451d-79ddf28b2b95f95b7b1083b6",
        "x-forwarded-for": "52.91.92.219",
        "x-forwarded-port": "443",
        "x-forwarded-proto": "https",
        "x-slack-request-timestamp": "1745372445",
        "x-slack-signature": "v0=58cafed881f28ccde58ce66d459531d081e9ceed3777070d5752f56b23a2fc23"
      },
      "requestContext": {
        "accountId": "122610481075",
        "apiId": "yvlp3ngm97",
        "domainName": "rpotential-slack-bot.r.r3js.com",
        "domainPrefix": "rpotential-slack-bot",
        "http": {
          "method": "POST",
          "path": "/interactivity",
          "protocol": "HTTP/1.1",
          "sourceIp": "52.91.92.219",
          "userAgent": "Slackbot 1.0 (+https://api.slack.com/robots)"
        },
        "requestId": "Jc-8riwroAMEMfw=",
        "routeKey": "ANY /interactivity",
        "stage": "$default",
        "time": "23/Apr/2025:01:40:45 +0000",
        "timeEpoch": 1745372445580
      },
      "body": "cGF5bG9hZD0lN0IlMjJ0eXBlJTIyJTNBJTIyYmxvY2tfYWN0aW9ucyUyMiUyQyUyMnVzZXIlMjIlM0ElN0IlMjJpZCUyMiUzQSUyMlUwOE1NM1BUUko4JTIyJTJDJTIydXNlcm5hbWUlMjIlM0ElMjJjYXJsb3MlMjIlMkMlMjJuYW1lJTIyJTNBJTIyY2FybG9zJTIyJTJDJTIydGVhbV9pZCUyMiUzQSUyMlQwOE1NM1BUUkhBJTIyJTdEJTJDJTIyYXBpX2FwcF9pZCUyMiUzQSUyMkEwOE1WOU5DTFAzJTIyJTJDJTIydG9rZW4lMjIlM0ElMjJTeUJNVVo0eE5RVTVNN3FnWjRNZ2FnVGwlMjIlMkMlMjJjb250YWluZXIlMjIlM0ElN0IlMjJ0eXBlJTIyJTNBJTIybWVzc2FnZSUyMiUyQyUyMm1lc3NhZ2VfdHMlMjIlM0ElMjIxNzQ1MzcyNDQwLjMzOTY5OSUyMiUyQyUyMmNoYW5uZWxfaWQlMjIlM0ElMjJEMDhNTVRLOUZRVCUyMiUyQyUyMmlzX2VwaGVtZXJhbCUyMiUzQWZhbHNlJTJDJTIydGhyZWFkX3RzJTIyJTNBJTIyMTc0NTM1Nzg4OC4xNDIzNzklMjIlN0QlMkMlMjJ0cmlnZ2VyX2lkJTIyJTNBJTIyODc4MjY2NTg0MjE1MC44NzM1MTI1OTQzNTg4LmRiYTg2NzFkNTNjMmYyMWJjYTM3NjU3YmJhZTdjYmU4JTIyJTJDJTIydGVhbSUyMiUzQSU3QiUyMmlkJTIyJTNBJTIyVDA4TU0zUFRSSEElMjIlMkMlMjJkb21haW4lMjIlM0ElMjJycG90ZW50aWFsdGVzdHMlMjIlN0QlMkMlMjJlbnRlcnByaXNlJTIyJTNBbnVsbCUyQyUyMmlzX2VudGVycHJpc2VfaW5zdGFsbCUyMiUzQWZhbHNlJTJDJTIyY2hhbm5lbCUyMiUzQSU3QiUyMmlkJTIyJTNBJTIyRDA4TU1USzlGUVQlMjIlMkMlMjJuYW1lJTIyJTNBJTIyZGlyZWN0bWVzc2FnZSUyMiU3RCUyQyUyMm1lc3NhZ2UlMjIlM0ElN0IlMjJ1c2VyJTIyJTNBJTIyVTA4TU1USzg4N00lMjIlMkMlMjJ0eXBlJTIyJTNBJTIybWVzc2FnZSUyMiUyQyUyMnRzJTIyJTNBJTIyMTc0NTM3MjQ0MC4zMzk2OTklMjIlMkMlMjJib3RfaWQlMjIlM0ElMjJCMDhNTVRLODgzViUyMiUyQyUyMmFwcF9pZCUyMiUzQSUyMkEwOE1WOU5DTFAzJTIyJTJDJTIydGV4dCUyMiUzQSUyMkRvK3lvdSthdXRob3JpemUrZmV0Y2hpbmcrZGF0ZXRpbWUlM0YlMjIlMkMlMjJ0ZWFtJTIyJTNBJTIyVDA4TU0zUFRSSEElMjIlMkMlMjJ0aHJlYWRfdHMlMjIlM0ElMjIxNzQ1MzU3ODg4LjE0MjM3OSUyMiUyQyUyMnBhcmVudF91c2VyX2lkJTIyJTNBJTIyVTA4TU1USzg4N00lMjIlMkMlMjJibG9ja3MlMjIlM0ElNUIlN0IlMjJ0eXBlJTIyJTNBJTIyc2VjdGlvbiUyMiUyQyUyMmJsb2NrX2lkJTIyJTNBJTIyMFAxU1IlMjIlMkMlMjJ0ZXh0JTIyJTNBJTdCJTIydHlwZSUyMiUzQSUyMm1ya2R3biUyMiUyQyUyMnRleHQlMjIlM0ElMjJEbyt5b3UrYXV0aG9yaXplK2ZldGNoaW5nK2RhdGV0aW1lJTNGJTIyJTJDJTIydmVyYmF0aW0lMjIlM0FmYWxzZSU3RCU3RCUyQyU3QiUyMnR5cGUlMjIlM0ElMjJhY3Rpb25zJTIyJTJDJTIyYmxvY2tfaWQlMjIlM0ElMjJITnI3cCUyMiUyQyUyMmVsZW1lbnRzJTIyJTNBJTVCJTdCJTIydHlwZSUyMiUzQSUyMmJ1dHRvbiUyMiUyQyUyMmFjdGlvbl9pZCUyMiUzQSUyMmF1dGhvcml6ZSUyMiUyQyUyMnRleHQlMjIlM0ElN0IlMjJ0eXBlJTIyJTNBJTIycGxhaW5fdGV4dCUyMiUyQyUyMnRleHQlMjIlM0ElMjJBdXRob3JpemUlMjIlMkMlMjJlbW9qaSUyMiUzQXRydWUlN0QlMkMlMjJzdHlsZSUyMiUzQSUyMnByaW1hcnklMjIlMkMlMjJ2YWx1ZSUyMiUzQSUyMmRhdGV0aW1lX19jYWxsXzVxOU9Od3U1ZkR5TGRjWG1vWGJSNGI5UyUyMiU3RCUyQyU3QiUyMnR5cGUlMjIlM0ElMjJidXR0b24lMjIlMkMlMjJhY3Rpb25faWQlMjIlM0ElMjJjYW5jZWwlMjIlMkMlMjJ0ZXh0JTIyJTNBJTdCJTIydHlwZSUyMiUzQSUyMnBsYWluX3RleHQlMjIlMkMlMjJ0ZXh0JTIyJTNBJTIyQ2FuY2VsJTIyJTJDJTIyZW1vamklMjIlM0F0cnVlJTdEJTJDJTIyc3R5bGUlMjIlM0ElMjJkYW5nZXIlMjIlMkMlMjJ2YWx1ZSUyMiUzQSUyMmRhdGV0aW1lX19jYWxsXzVxOU9Od3U1ZkR5TGRjWG1vWGJSNGI5UyUyMiU3RCU1RCU3RCU1RCU3RCUyQyUyMnN0YXRlJTIyJTNBJTdCJTIydmFsdWVzJTIyJTNBJTdCJTdEJTdEJTJDJTIycmVzcG9uc2VfdXJsJTIyJTNBJTIyaHR0cHMlM0ElNUMlMkYlNUMlMkZob29rcy5zbGFjay5jb20lNUMlMkZhY3Rpb25zJTVDJTJGVDA4TU0zUFRSSEElNUMlMkY4NzgyNjY1Nzg2MTgyJTVDJTJGWDM2TnI0UW5iWUJRQ2Vvd0t5UVhBeGVlJTIyJTJDJTIyYWN0aW9ucyUyMiUzQSU1QiU3QiUyMmFjdGlvbl9pZCUyMiUzQSUyMmF1dGhvcml6ZSUyMiUyQyUyMmJsb2NrX2lkJTIyJTNBJTIySE5yN3AlMjIlMkMlMjJ0ZXh0JTIyJTNBJTdCJTIydHlwZSUyMiUzQSUyMnBsYWluX3RleHQlMjIlMkMlMjJ0ZXh0JTIyJTNBJTIyQXV0aG9yaXplJTIyJTJDJTIyZW1vamklMjIlM0F0cnVlJTdEJTJDJTIydmFsdWUlMjIlM0ElMjJkYXRldGltZV9fY2FsbF81cTlPTnd1NWZEeUxkY1htb1hiUjRiOVMlMjIlMkMlMjJzdHlsZSUyMiUzQSUyMnByaW1hcnklMjIlMkMlMjJ0eXBlJTIyJTNBJTIyYnV0dG9uJTIyJTJDJTIyYWN0aW9uX3RzJTIyJTNBJTIyMTc0NTM3MjQ0NS41MzAzMjAlMjIlN0QlNUQlN0Q=",
      "isBase64Encoded": true
    }
    await interactivity(event, {})
  })()
}
