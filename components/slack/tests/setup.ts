process.env.SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN || "test-bot-token";
process.env.SLACK_APP_TOKEN = process.env.SLACK_APP_TOKEN || "test-app-token";
process.env.SLACK_SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET || "test-signing-secret";
process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || "test-openai-key";
process.env.ADMIN_CHANNEL = process.env.ADMIN_CHANNEL || "CADMIN";

import "./mocks/slack"
import "./mocks/storage"
import "./mocks/openai"
import "./mocks/xray"
import "./mocks/brain-sdk"
