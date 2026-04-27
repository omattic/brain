(process as any).env.USE_WEBSOCKETS = true
import { app, postMessage, setStatus } from "@services/slack"
import { processSlackEvent } from "./middlewares/slackHandler";
import * as http from 'http';
// import { assistant } from "@services/slack/assistant";
import { sleep } from "openai/core";

// /* Add functionality here */
// app.message(":wave:", async ({ message, say }) => {
//   // Log the message
//   console.log('Received message:', message);
//   // Send a response
//   await say(`Hello wave!, <@${message.user}>!`);
// })

app.event("app_mention", async ({ event, say }) => {
  console.log("APP MENTION!")
  console.log("🚀", JSON.stringify(event, null, 2))
  await processSlackEvent(event);
})

app.event("*", async ({ event, say }) => {
  console.log("EVENT!", JSON.stringify(event, null, 2))
})

// app.assistant(assistant)

// app.event("assistant_thread_context_changed", async ({ event, say }) => {
//   console.log("🚀 assistant_thread_context_changed!")
//   console.log("🚀", JSON.stringify(event, null, 2))
//   // await processSlackEvent(event);
// })

// {
//   "type": "assistant_thread_started",
//   "assistant_thread": {
//     "user_id": "U08MM3PTRJ8",
//     "context": {
//       "channel_id": "C08MMT6JHHR",
//       "team_id": "T08MM3PTRHA",
//       "enterprise_id": null,
//       "thread_entry_point": "sunroof",
//       "force_search": false
//     },
//     "channel_id": "D08MMTK9FQT",
//     "thread_ts": "1744667311.689369"
//   },
//   "event_ts": "1744667311.727012"
// }


app.event("assistant_thread_started", async ({ event, say }) => {
  console.log("🚀🚀 assistant_thread_started!")
  console.log("🚀", JSON.stringify(event, null, 2))
  // await processSlackEvent(event);

  await setStatus(event.assistant_thread.channel_id, "is starting...", event.assistant_thread.thread_ts)
  await sleep(1000);
  await postMessage(event.assistant_thread.channel_id, "Hey, welcome back!", event.assistant_thread.thread_ts)
  await setStatus(event.assistant_thread.channel_id, "is thinking...", event.assistant_thread.thread_ts)
  await sleep(3000);
  await postMessage(event.assistant_thread.channel_id, "I've got the update you asked for...", event.assistant_thread.thread_ts)
  await setStatus(event.assistant_thread.channel_id, "is fetching report...", event.assistant_thread.thread_ts)
  await sleep(3000);
  await postMessage(event.assistant_thread.channel_id, "Your Q1 hiring jumped 8% YoY. That may be a misalignment given current market dynamics.", event.assistant_thread.thread_ts)
})

app.event("assistant_thread_started", async ({ event, say }) => {
  console.log("🚀🚀 assistant_thread_started!")
  console.log("🚀", JSON.stringify(event, null, 2))
  // await processSlackEvent(event);

  await setStatus(event.assistant_thread.channel_id, "is starting...", event.assistant_thread.thread_ts)
  await sleep(1000);
  await postMessage(event.assistant_thread.channel_id, "Hey, welcome back!", event.assistant_thread.thread_ts)
  await setStatus(event.assistant_thread.channel_id, "is thinking...", event.assistant_thread.thread_ts)
  await sleep(3000);
  await postMessage(event.assistant_thread.channel_id, "I've got the update you asked for...", event.assistant_thread.thread_ts)
  await setStatus(event.assistant_thread.channel_id, "is fetching report...", event.assistant_thread.thread_ts)
  await sleep(3000);
  await postMessage(event.assistant_thread.channel_id, "Your Q1 hiring jumped 8% YoY. That may be a misalignment given current market dynamics.", event.assistant_thread.thread_ts)
})




app.message(async ({ message, say }) => {
  // Log the message
  console.log('Received message:', message);
  // Send a response
  // await say(`Hello, <@${message.user}>!`);
  console.log("🚀", JSON.stringify(message, null, 2))
  await processSlackEvent(message);
})

// Start the Slack bot
const slackPort = process.env.PORT || 4000;
app.start(slackPort);
console.log(`Slack bot started on port ${slackPort}`);

// Create and start an HTTP server
const hostname = '0.0.0.0';
const httpPort = 3000;
const startDate = new Date();

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end(`Hello, World! (Carlos was here :D :D) started: ${startDate.toISOString()}`);
});

server.listen(httpPort, hostname, () => {
  console.log(`Server running at http://${hostname}:${httpPort}/`);
});
