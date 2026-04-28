import { SlackComponentEvent } from "@components/slack";

export const event = {
  type: "slack",
  fnName: "postMessage",
  params: {
    text: "Hello world"
  }
} as SlackComponentEvent