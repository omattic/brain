import { daprize, isAuthorized, sendToBus } from "brain-sdk";
import { BrainContext } from "@types";

export async function run(event: any, context: BrainContext) {
  const currencies = await fetch("https://core.telegram.org/bots/payments/currencies.json").then((response) => response.json())

  let currencySymbol = event.arguments.currency.toUpperCase()
  let rate = currencies[currencySymbol]

  if (rate) {
    event.text = `The exchange rate for ${rate.code} (${rate.title}) is ${rate.min_amount / (Math.pow(10, rate.exp))} per 1 USD`
  } else {
    event.text = "Could not find rate for " + currencySymbol
  }

  await sendToBus("brain", {
    event,
    context
  })
}

export const sqs = daprize(run)

export const toolDefinition = {
  type: "function",
  function: {
    "name": "exchange",
    "description": "Provides the exchange rate of any currency (in USD).",
    "parameters": {
      "type": "object",
      "properties": {
        "currency": {
          "type": "string",
          "description": "Symbol of the currency the user wants to know the exchange rate for, example: 'CLP', 'EUR', 'PGY', etc."
        }
      },
      "required": ["currency"]
    }
  }
}
