import { DaprClient, CommunicationProtocolEnum } from '@dapr/dapr';
import { getDaprHttpPort, getDaprStateStoreName, getDaprHost } from '../env';
import { checkKey, sleep, getBackoffTime } from '../utils';
import { GetOptions } from '../storage';

// Type for Dapr state store response
export type DaprStateResponse = {
  success: boolean;
  key?: string;
  [key: string]: any;
};

// Initialize Dapr client for Dapr mode
let daprClient: DaprClient | null = null;

/**
 * Escapes forward slashes in a key to make it safe for Dapr state store
 */
function escapeSlashes(key: string): string {
  return key.replace(/\//g, '_--_');
}

// Lazy initialization of Dapr client to avoid issues during testing or when not needed
export function getDaprClient(): DaprClient {
  if (!daprClient) {
    daprClient = new DaprClient({
      daprHost: getDaprHost(),
      daprPort: getDaprHttpPort(),
      communicationProtocol: CommunicationProtocolEnum.HTTP,
    });
  }
  return daprClient;
}

/**
 * Stores data in Dapr state store
 */
export async function putToDapr(key: string, value: object): Promise<DaprStateResponse> {
  const stateStoreName = getDaprStateStoreName();
  const client = getDaprClient();
  const formattedKey = escapeSlashes(key);

  console.log(`PUT to Dapr state store '${stateStoreName}', key: ${formattedKey}`);
  
  try {
    // Save to Dapr state store
    await client.state.save(stateStoreName, [
      {
        key: formattedKey,
        value: value
      }
    ]);
    return { success: true, key: formattedKey };
  } catch (error) {
    console.error("Error saving to Dapr state store:", error);
    throw error;
  }
}

/**
 * Retrieves data from Dapr state store
 */
export async function getFromDapr(key: string, opts?: GetOptions): Promise<any> {
  const stateStoreName = getDaprStateStoreName();
  const client = getDaprClient();
  const formattedKey = escapeSlashes(key);
  
  let retryCount = 0;
  let maxRetries = 0;
  if (opts?.retry && opts.retry > 0 && typeof opts.retry === "number") {
    maxRetries = opts?.retry;
  }

  while (true) {
    try {
      console.log(`GET from Dapr state store '${stateStoreName}', key: ${formattedKey}`, 
                  retryCount > 0 ? `(retry ${retryCount}/${maxRetries})` : "");
      
      // Get from Dapr state store
      const result = await client.state.get(stateStoreName, formattedKey);
      
      if (result === null) {
        if (retryCount < maxRetries) {
          retryCount++;
          console.log(`Object not found in Dapr, retrying (${retryCount}/${maxRetries})`, formattedKey);
          // Add exponential backoff delay between retries
          await sleep(getBackoffTime(retryCount));
          continue;
        }
        console.log("Did not find in Dapr state store:", formattedKey);
        return null;
      }
      
      return result;
    } catch (err: any) {
      console.error("Error retrieving from Dapr state store:", err);
      
      if (retryCount < maxRetries) {
        retryCount++;
        console.log(`Error in Dapr get, retrying (${retryCount}/${maxRetries})`, formattedKey);
        // Add exponential backoff delay between retries
        await sleep(getBackoffTime(retryCount));
        continue;
      }
      
      console.log("Failed to retrieve from Dapr state store:", formattedKey);
      return null;
    }
  }
}
