"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAuthorized = isAuthorized;
const bus_1 = require("./bus");
const storage_1 = require("./storage");
/**
 * Render authorization blocks for Slack UI
 * @param question The question being asked
 * @param componentName The name of the component requesting authorization
 * @param toolCallId The tool call ID for tracking
 * @returns Slack block kit elements
 */
function renderAuthorizationBlocks(question, componentName, toolCallId) {
    // Simple implementation - replace with your actual logic
    return [
        {
            type: "section",
            text: {
                type: "mrkdwn",
                text: `*Authorization Requested*\n${componentName} wants to answer: "${question}"`
            }
        },
        {
            type: "actions",
            elements: [
                {
                    type: "button",
                    text: {
                        type: "plain_text",
                        text: "Authorize"
                    },
                    style: "primary",
                    value: `${componentName}__${toolCallId}`,
                    action_id: "authorize_action"
                },
                {
                    type: "button",
                    text: {
                        type: "plain_text",
                        text: "Cancel"
                    },
                    style: "danger",
                    value: `${componentName}__${toolCallId}`,
                    action_id: "cancel_action"
                }
            ]
        }
    ];
}
async function isAuthorized(payload, componentName, question) {
    if (payload.event.type === "tool_call_authorization") {
        let eventAction = payload.event.action || "authorize";
        if (eventAction.indexOf("authorize") > -1) {
            let persistedPayload = await (0, storage_1.get)("authorization/" + payload.event.toolCallId);
            console.log("persistedPayload", JSON.stringify(persistedPayload, null, 2));
            payload.event = persistedPayload.event;
            payload.context = persistedPayload.context;
            return persistedPayload;
        }
        else if (payload.event.action === "cancel") {
            return {
                error: "User cancelled the authorization",
            };
        }
    }
    else {
        await (0, storage_1.put)(`authorization/${payload.event.toolCallId || "unknown"}`, payload);
        const toolCallId = payload.event.toolCallId || "unknown";
        let blocks = renderAuthorizationBlocks(question, componentName, toolCallId);
        await (0, bus_1.sendToBus)("slack", {
            event: {
                fnName: "postMessage",
                params: {
                    text: question,
                    blocks: blocks,
                },
            },
            context: payload.context,
        });
        return false;
    }
}
