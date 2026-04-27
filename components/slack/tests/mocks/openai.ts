import { vi, beforeAll } from 'vitest';
// Mock OpenAI

// Default responses
let simpleResponse = {
  "id": "chatcmpl-BPCtlwU54iCg9uLryF2fxnnhvJMXt",
  "object": "chat.completion",
  "created": 1745347481,
  "model": "gpt-4o-mini-2024-07-18",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "@carlos: Absolutely! Here's the summary again:\n\n### **New Org Priorities:**\n1. **Streamline Hiring**: Adjust Q3 plans, notably cutting App Support Eng roles.\n2. **Pilot Automation**: Implement Agentforce pilots in Finance, App Support, and PMO.\n3. **Upskill Workforce**: Reskill PMs, Finance, and IT cohorts via Akkodis Academy and LHH.\n\n### **Open Gaps:**\n- **Agent Governance**: Need alignment on prompts and KPIs between IT and business leaders.\n- **Tariff Risk Mitigation**: Balance hiring adjustments while maintaining workforce flexibility.\n\n### **Proposed Governance Cadence:**\n- **Weekly Check-ins**: Review agent performance and governance with IT and business leads.\n- **Monthly Strategy Sessions**: Assess automation impacts and workforce shifts.\n- **Quarterly Reviews**: Evaluate progress against organizational goals.\n\nLet's keep the momentum going! :muscle: :lightbulb:",
        "refusal": null,
        "annotations": []
      },
      "logprobs": null,
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 1253,
    "completion_tokens": 200,
    "total_tokens": 1453,
    "prompt_tokens_details": {
      "cached_tokens": 0,
      "audio_tokens": 0
    },
    "completion_tokens_details": {
      "reasoning_tokens": 0,
      "audio_tokens": 0,
      "accepted_prediction_tokens": 0,
      "rejected_prediction_tokens": 0
    }
  },
  "service_tier": "default",
  "system_fingerprint": "fp_03928220900"
}

let toolRequest = {
  "id": "chatcmpl-BPE1lKjdznAYRe3HlNCQeIQArdDnY",
  "object": "chat.completion",
  "created": 1745351821,
  "model": "gpt-4o-mini-2024-07-18",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": null,
        "tool_calls": [
          {
            "id": "call_20bmfWLoW5CHhERTPULavBZd",
            "type": "function",
            "function": {
              "name": "datetime",
              "arguments": "{}"
            }
          }
        ],
        "refusal": null,
        "annotations": []
      },
      "logprobs": null,
      "finish_reason": "tool_calls"
    }
  ],
  "usage": {
    "prompt_tokens": 950,
    "completion_tokens": 10,
    "total_tokens": 960,
    "prompt_tokens_details": {
      "cached_tokens": 0,
      "audio_tokens": 0
    },
    "completion_tokens_details": {
      "reasoning_tokens": 0,
      "audio_tokens": 0,
      "accepted_prediction_tokens": 0,
      "rejected_prediction_tokens": 0
    }
  },
  "service_tier": "default",
  "system_fingerprint": "fp_0392822090"
}

let hourProvidedResponse = {
  "id": "chatcmpl-BPE1lKjdznAYRe3HlNCQeIQArdDnY",
  "object": "chat.completion",
  "created": 1745351821,
  "model": "gpt-4o-mini-2024-07-18",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "@carlos: Sure! The current time is 10:30 AM. How can I assist you further?",
        "refusal": null,
        "annotations": []
      },
      "logprobs": null,
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 950,
    "completion_tokens": 10,
    "total_tokens": 960,
    "prompt_tokens_details": {
      "cached_tokens": 0,
      "audio_tokens": 0
    },
    "completion_tokens_details": {
      "reasoning_tokens": 0,
      "audio_tokens": 0,
      "accepted_prediction_tokens": 0,
      "rejected_prediction_tokens": 0
    }
  },
  "service_tier": "default",
  "system_fingerprint": "fp_0392822090"
}

// Mock control object to configure responses
export const mockControl = {
  responseToUse: 'simpleResponse',
  customResponses: {},
  availableResponses: {
    simpleResponse,
    toolRequest,
    hourProvidedResponse
  },
  // Add a custom response to be used when specific conditions are met
  addCustomResponse(key, response) {
    this.customResponses[key] = response;
    return this;
  },
  // Set which response should be used by default
  useResponse(responseKey) {
    this.responseToUse = responseKey;
    return this;
  },
  // Reset mock to default state
  reset() {
    this.responseToUse = 'simpleResponse';
    this.customResponses = {};
    return this;
  },
  // Get the response based on current configuration or input parameters
  getResponse(params = {}) {
    // Check if there's a custom handler for these params
    for (const [key, response] of Object.entries(this.customResponses)) {
      if (this._matchesParams(params, key)) {
        return response;
      }
    }
    
    // Otherwise return the default configured response
    return this.availableResponses[this.responseToUse] || simpleResponse;
  },
  // Helper to match parameters
  _matchesParams(params, key) {
    try {
      // Simple string matching on stringified params
      return JSON.stringify(params).includes(key);
    } catch (e) {
      return false;
    }
  }
};

const createMock = vi.fn().mockImplementation((params) => {
  return Promise.resolve(mockControl.getResponse(params));
});

const OpenAI = vi.fn().mockImplementation(() => ({
  chat: {
    completions: {
      create: createMock
    }
  }
}));

beforeAll(() => {
  vi.mock("openai", async (importOriginal) => {
    // const actual = await importOriginal() as object
    return {
      // ...actual,
      default: OpenAI
    }
  })
});

// Export the mock functions for test assertions
export { createMock, OpenAI };
