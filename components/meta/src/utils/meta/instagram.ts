import axios from 'axios';
import "../../../defaults"
import { ICLWebhookAttachment, ICLWebhookText } from './wa';
import { put, get, getRuntimeConfig } from 'brain-sdk';
import { MessengerEvent } from './types';
import fetch from 'node-fetch';
import { tellGroup } from './meta';

// import { sleep } from 'openai/core';
let accessToken = process.env.INSTAGRAM_ACCESS_TOKEN || ""
const META_TOKENS_NAMESPACE = "metaTokens";
const DEFAULT_INSTAGRAM_TOKEN_KEY = "instagram/access-token/default";
const INSTAGRAM_TOKEN_KEYS: Record<string, string> = {
  default: DEFAULT_INSTAGRAM_TOKEN_KEY,
  guerrerocarlos: "instagram/access-token/guerrerocarlos",
  inglesconliza: "instagram/access-token/inglesconliza",
  "17841401527750596": "instagram/access-token/guerrerocarlos",
  "17841401707784079": "instagram/access-token/inglesconliza",
};

type InstagramTokenScope = {
  accountId?: string;
  handle?: string;
};

type TokenFetchOptions = {
  suppressErrors?: boolean;
};

function getMetaTokensNamespace() {
  const cloudflare = getRuntimeConfig().cloudflare;
  return cloudflare?.kv?.[META_TOKENS_NAMESPACE] || cloudflare?.resolveKV?.(META_TOKENS_NAMESPACE);
}

function normalizeTokenScope(scope?: InstagramTokenScope) {
  if (!scope) return { accountId: undefined, handle: undefined };
  return {
    accountId: scope.accountId?.trim(),
    handle: scope.handle?.trim().replace(/^@/, "").toLowerCase(),
  };
}

function getInstagramTokenKey(scope?: InstagramTokenScope) {
  const normalized = normalizeTokenScope(scope);
  if (normalized.handle && INSTAGRAM_TOKEN_KEYS[normalized.handle]) {
    return INSTAGRAM_TOKEN_KEYS[normalized.handle];
  }
  if (normalized.accountId && INSTAGRAM_TOKEN_KEYS[normalized.accountId]) {
    return INSTAGRAM_TOKEN_KEYS[normalized.accountId];
  }
  return DEFAULT_INSTAGRAM_TOKEN_KEY;
}

function getEnvInstagramAccessToken(scope?: InstagramTokenScope) {
  const normalized = normalizeTokenScope(scope);
  if (normalized.handle === "guerrerocarlos" || normalized.accountId === "17841401527750596") {
    return process.env.INSTAGRAM_ACCESS_TOKEN_CARLOS || process.env.INSTAGRAM_ACCESS_TOKEN || "";
  }
  if (normalized.handle === "inglesconliza" || normalized.accountId === "17841401707784079") {
    return process.env.INSTAGRAM_ACCESS_TOKEN_INGLESCONLIZA || process.env.INSTAGRAM_ACCESS_TOKEN || "";
  }
  return process.env.INSTAGRAM_ACCESS_TOKEN || "";
}

async function getStoredInstagramAccessToken(scope?: InstagramTokenScope, options?: TokenFetchOptions) {
  const namespace = getMetaTokensNamespace();
  const tokenKey = getInstagramTokenKey(scope);
  if (namespace) {
    try {
      const storedToken = await namespace.get(tokenKey);
      if (storedToken?.trim()) {
        return storedToken.trim();
      }
    } catch (error) {
      if (!options?.suppressErrors) {
        console.error(`Failed to read Instagram token from KV (${tokenKey})`, error);
      }
    }
  }

  return getEnvInstagramAccessToken(scope);
}

// Attach instagram account to the App
// https://developers.facebook.com/apps/7970622379694396/instagram-business/API-Setup/?business_id=1729767651176854

// TODO: maybe add user profile info to context:
// https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-comment
// related: https://developers.facebook.com/docs/whatsapp/conversation-types

// Phone numbers
// https://business.facebook.com/wa/manage/phone-numbers/?business_id=1729767651176854&waba_id=388104074387933&childRoute=PHONE_PROFILE%2FPROFILE&phone_number=37257886623
// https://business.facebook.com/wa/manage/phone-numbers/?business_id=1729767651176854&waba_id=388104074387933

// Biling
// https://business.facebook.com/billing_hub/accounts/details?asset_id=388104074387933&business_id=1729767651176854&placement=standalone&account_type=whatsapp-business-account

async function refreshInstagramToken(currentToken: string) {
  const url = `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${currentToken}`;
  console.log("Refreshing Instagram token...");
  
  try {
    const response = await fetch(url);
    const data = await response.json() as RefreshTokenInstagramGraphResponse
    
    if (!response.ok) {
      console.error('Failed to refresh token - Response:', data);
      throw new Error(`Failed to refresh token: ${response.status} - ${JSON.stringify(data)}`);
    }
    
    console.log('Token refresh successful');
    console.log('New Access Token length:', data.access_token?.length || 0);
    console.log('Expires in (seconds):', data.expires_in);
    return data;
  } catch (error) {
    console.error('Error refreshing token:', error);
    throw error;
  }
}

let gettingTokenPromise: Promise<string> | null = null
async function getAccessToken(scope?: InstagramTokenScope) {
  const storedToken = await getStoredInstagramAccessToken(scope, { suppressErrors: true });
  if (storedToken) {
    accessToken = storedToken;
    return storedToken;
  }
  return accessToken
  if (gettingTokenPromise) {
    return gettingTokenPromise
  }
  gettingTokenPromise = new Promise(async (success) => {
    try {
      accessToken = await getFreshToken()
      
      // Validate the token before returning it
      const isValid = await validateAccessToken(accessToken);
      if (!isValid) {
        console.error("Retrieved token is not valid, forcing refresh...");
        // Force a refresh by clearing the stored token and trying again
        await put("instagram/latestToken.json", { access_token: "", expires_in: "0", created_at: 0 });
        accessToken = await getFreshToken();
      }
      
      success(accessToken)
    } catch (error) {
      console.error("Error getting access token:", error);
      gettingTokenPromise = null; // Reset the promise so it can be retried
      throw error;
    }
  })

  return gettingTokenPromise
}

async function getFreshToken() {
  return accessToken

  let latestToken = await get("instagram/latestToken.json") || { access_token: accessToken }
  console.log("got latest token", JSON.stringify(latestToken, null, 2))

  // Check if token exists and if it's approaching expiration (refresh when 7 days remaining)
  const currentTime = new Date().getTime();
  const tokenCreationTime = latestToken.created_at || 0;
  const expiresInMs = (parseInt(latestToken.expires_in || "0") * 1000);
  const expirationTime = tokenCreationTime + expiresInMs;
  const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;

  // If token doesn't exist or is expiring within the next 7 days
  if (!latestToken.access_token || (expirationTime - currentTime < sevenDaysInMs)) {
    console.log("Token needs refreshing - will expire in",
      Math.floor((expirationTime - currentTime) / (24 * 60 * 60 * 1000)), "days");

    latestToken = await refreshInstagramToken(latestToken.access_token)
    if (latestToken) {
      latestToken.created_at = currentTime
      await put("instagram/latestToken.json", latestToken)
    }
  } else {
    console.log("Instagram token valid for",
      Math.floor((expirationTime - currentTime) / (24 * 60 * 60 * 1000)),
      "more days");
  }

  accessToken = latestToken.access_token
  console.log("LATEST accessToken set")
  console.log("accessToken", accessToken)
  return accessToken
}


type IgMedia = {
  id: string,
  media_type: string,
  media_url: string,
  permalink: string,
  thumbnail_url: string,
  caption: string
}

type RefreshTokenInstagramGraphResponse = {
  access_token: string,
  expires_in: string,
  token_type: "bearer",
  permissions: string
  created_at: number
}

async function fetchGet(url: string, params?: object, scope?: InstagramTokenScope) {
  try {
    const response = await axios(
      url,
      {
        params: {
          access_token: await getAccessToken(scope),
          ...params
        },
      }
    );
    return response.data;
  } catch (error) {
    let err = error as any;
    console.log("ERR fetchGet [", err + "]", err.stack);

    // Extract and log detailed error information
    if (err.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.log("Error Response Data:", JSON.stringify(err.response.data, null, 2));
      console.log("Error Response Status:", err.response.status);
      console.log("Error Response Headers:", err.response.headers);
    } else if (err.request) {
      // The request was made but no response was received
      console.log("Error Request:", err.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.log("Error Message:", err.message);
    }
    console.log("Error Config:", err.config);

    // You could also forward this detailed error to your error reporting system
    await tellGroup("ICLSupport", "Errors", {
      text: `@guerrerocarlos: Instagram API Error: ${err.message}`
    });

    if (err.response.headers && err.response.headers['www-authenticate']) {
      await tellGroup("ICLSupport", "Errors", {
        text: `Instagram: ${err.response.headers['www-authenticate']}`
      });
    }
  }
}

function shouldRetryInstagramError(error: any) {
  const status = error?.response?.status;
  return status === 500 || status === 502 || status === 503 || status === 504;
}

async function fetchGetWithRetry(
  url: string,
  params?: object,
  scope?: InstagramTokenScope,
  options: { retries?: number; delayMs?: number } = {}
) {
  const retries = options.retries ?? 2;
  const delayMs = options.delayMs ?? 200;

  let lastError: any;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await axios(url, {
        params: {
          access_token: await getAccessToken(scope),
          ...params,
        },
      }).then((response) => response.data);
    } catch (error) {
      lastError = error;
      if (!shouldRetryInstagramError(error) || attempt === retries) {
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, delayMs * (attempt + 1)));
    }
  }

  return await fetchGet(url, params, scope);
}

async function fetchPost(url: string, body: object, params?: object, scope?: InstagramTokenScope) {
  try {
    const response = await axios.post(
      url,
      body,
      {
        params: {
          access_token: await getAccessToken(scope),
          ...params
        },
      }
    );
    return response.data;
  } catch (err: any) {
    console.log("ERR fetchPost [", err + "]", err.stack);

    // Extract and log detailed error information
    if (err.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.log("Error Response Data:", JSON.stringify(err.response.data, null, 2));
      console.log("Error Response Status:", err.response.status);
      console.log("Error Response Headers:", err.response.headers);
      console.log("Request URL:", url);
      console.log("Request Body:", JSON.stringify(body, null, 2));
      console.log("Request Params:", JSON.stringify(params, null, 2));
    } else if (err.request) {
      // The request was made but no response was received
      console.log("Error Request:", err.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.log("Error Message:", err.message);
    }
    console.log("Error Config:", err.config);

    // You could also forward this detailed error to your error reporting system
    await tellGroup("ICLSupport", "Errors", {
      text: `@guerrerocarlos: Instagram API Error in fetchPost: ${err.message}\nURL: ${url}\nStatus: ${err.response?.status}\nResponse: ${JSON.stringify(err.response?.data, null, 2)}`
    });

    if (err.response?.headers && err.response.headers['www-authenticate']) {
      await tellGroup("ICLSupport", "Errors", {
        text: `Instagram: ${err.response.headers['www-authenticate']}`
      });
    }

    // Re-throw the error so calling functions can handle it appropriately
    throw err;
  }
}

export async function getMe() {
  return await fetchGet('https://graph.instagram.com/v20.0/me',
    {
      fields: 'user_id,username',
    }
  ) as { user_id: string, username: string }
}

export async function getComments(mediaId: string) {
  return await fetchGet(`https://graph.instagram.com/v20.0/${mediaId}/comments`,
    {
      fields: 'data',
    }
  )
}


export async function getInstagramHandleAndImage(userId: string) {
  console.log("getInstagramHandleAndImage userId", userId)
  try {
    let result = await fetchGet(`https://graph.instagram.com/${userId}`, {
      fields: 'username,profile_picture_url',
    });

    console.log("getInstagramHandleAndProfileImage result", result);

    return result
  } catch (err) {
    return getInstagramHandle(userId)
  }
}

export async function getInstagramHandle(userId: string) {
  let result = await fetchGet(`https://graph.instagram.com/${userId}`, {
    fields: 'username',
  });

  console.log("getInstagramHandle result", result)

  return result
}

async function getMediaByAccountMediaList(mediaId: string, scope?: InstagramTokenScope) {
  if (!scope?.accountId) {
    return null;
  }

  const response = await fetchGetWithRetry(
    `https://graph.instagram.com/v20.0/${scope.accountId}/media`,
    {
      fields: "id,caption,permalink,media_type,media_url,thumbnail_url",
      limit: 100,
    },
    scope
  );

  const rows = response?.data || [];
  return rows.find((row: any) => row?.id === mediaId) || null;
}

export async function getMediaCaptionAndPermalink(mediaId: string, scope?: InstagramTokenScope): Promise<any> {
  const direct = await fetchGetWithRetry(
    `https://graph.instagram.com/${mediaId}`,
    {
      fields: "caption,permalink,media_type,media_url,thumbnail_url",
    },
    scope
  );

  if (direct?.permalink || direct?.caption) {
    return direct as { caption: string, permalink: string };
  }

  const fallback = await getMediaByAccountMediaList(mediaId, scope);
  if (fallback?.permalink || fallback?.caption) {
    return fallback as { caption: string, permalink: string };
  }

  return null;
}

export async function sendInstagramMessage(
  messengerEvent: MessengerEvent,
  element: ICLWebhookAttachment | ICLWebhookText
) {
  let recipientId = messengerEvent.id
  const tokenScope = { accountId: messengerEvent.accountId };
  console.log("🟢🟢🟢🟢🟢🔴🟢 sendInstagramMessage", recipientId)
  let result

  if ((element as ICLWebhookText).type === "text") {
    // try {
    console.log("🔥🔥 SENDING TEXT!", (element as ICLWebhookText).text)
    // result = await sendTextMessage({ id: recipientId }, (element as ICLWebhookText).text);
    // if (messengerEvent.comment_id) {
    if (messengerEvent.comment_id) {
      console.log("SENDING TEXT TO COMMENT!")
      result = await sendTextMessage({ comment_id: messengerEvent.comment_id }, (element as ICLWebhookText).text, tokenScope);
      console.log("🔥 result with comment_id", { comment_id: messengerEvent.comment_id }, result)
    } else {
      console.log("SENDING TEXT TO ID!")
      result = await sendTextMessage({ id: recipientId }, (element as ICLWebhookText).text, tokenScope);
      console.log("🔥 result with", { id: recipientId }, result)
    }
  }
  if ((element as ICLWebhookAttachment).type === "image") {
    console.log("SENDING IMAGE!")
    let msgElement = element as ICLWebhookAttachment
    console.log("sendInstagramMessage.sendImage", msgElement.url);
    result = await sendUploadAndSendImage(recipientId, msgElement.url, tokenScope)
  }

  if ((element as ICLWebhookAttachment).type === "document") {
    console.log("SENDING DOCUMENT!")
    let msgElement = element as ICLWebhookAttachment
    console.log("sendInstagramMessage.sendImage", msgElement.url);
    result = await sendUploadAndSendImage(recipientId, msgElement.url, tokenScope)
  }

  console.log("sendInstagramMessage.result", result)

  if (messengerEvent) {
    console.log("PUT result id", `instagram/sent/${result.message_id}`, {
      originChatId: messengerEvent.originChatId,
      originMessageId: messengerEvent.originMessageId
    })

    await put(`instagram/sent/${result.message_id}`, {
      originChatId: messengerEvent.originChatId,
      originMessageId: messengerEvent.originMessageId
    })
  }

  return result
  // if ((element as ICLWebhookAttachment).type === "video") {
  //   let msgElement = element as ICLWebhookAttachment
  //   console.log("sendInstagramMessage.sendImage", msgElement.url);
  //   await sendUploadAndSendImage(recipientId, msgElement.url)
  // }
}



export async function getMedia(userId: string) {
  return await fetchGet(
    `https://graph.instagram.com/v20.0/${userId}/media`,
  );
}

export async function getAllMedia(userId: string) {
  return await fetchGet(
    `https://graph.instagram.com/v20.0/${userId}/media?fields=caption`,
  );
  // console.log("response.data", response.data)

  // data: [
  //   {
  //     media_type: 'IMAGE',
  //     media_url: 'https://scontent-mrs2-2.cdninstagram.com/v/t51.29350-15/368004689_623969433174359_847012730585141952_n.webp?stp=dst-jpg&_nc_cat=110&ccb=1-7&_nc_sid=18de74&_nc_ohc=V_OwdJ5j1CkQ7kNvgGmCldr&_nc_ht=scontent-mrs2-2.cdninstagram.com&edm=ANo9K5cEAAAA&oh=00_AYCzjPIdEi3K-AflcEKO4fnsYDZBkd2Coc-0ZC9JUsL-ew&oe=66E0FC99',
  //     permalink: 'https://www.instagram.com/p/CwDzpZyrhlm/',
  //     id: '18349093240077057'
  //   },
  //   {
  //     media_type: 'IMAGE',
  //     media_url: 'https://scontent-mrs2-1.cdninstagram.com/v/t51.29350-15/351807968_232256702856714_5004111097808512602_n.jpg?_nc_cat=100&ccb=1-7&_nc_sid=18de74&_nc_ohc=rXjy42YF2UIQ7kNvgG0iwiC&_nc_ht=scontent-mrs2-1.cdninstagram.com&edm=ANo9K5cEAAAA&oh=00_AYAED5MYtOISjn7XdFLsqp2M6t252eZSVbVcwiqW9xXg6w&oe=66E0F1AC',
  //     permalink: 'https://www.instagram.com/p/CtMNb4NNXBc/',
  //     id: '18143363458290468'
  //   },

}

export async function getAllMediaCaptions(userId: string) {
  const response = await getAllMedia(userId)
  // console.log("response.data", response.data)
  return response.data.data.map((media: any) => {
    return media.caption
  }).filter(Boolean)
  // data: [
  //   {
  //     media_type: 'IMAGE',
  //     media_url: 'https://scontent-mrs2-2.cdninstagram.com/v/t51.29350-15/368004689_623969433174359_847012730585141952_n.webp?stp=dst-jpg&_nc_cat=110&ccb=1-7&_nc_sid=18de74&_nc_ohc=V_OwdJ5j1CkQ7kNvgGmCldr&_nc_ht=scontent-mrs2-2.cdninstagram.com&edm=ANo9K5cEAAAA&oh=00_AYCzjPIdEi3K-AflcEKO4fnsYDZBkd2Coc-0ZC9JUsL-ew&oe=66E0FC99',
  //     permalink: 'https://www.instagram.com/p/CwDzpZyrhlm/',
  //     id: '18349093240077057'
  //   },
  //   {
  //     media_type: 'IMAGE',
  //     media_url: 'https://scontent-mrs2-1.cdninstagram.com/v/t51.29350-15/351807968_232256702856714_5004111097808512602_n.jpg?_nc_cat=100&ccb=1-7&_nc_sid=18de74&_nc_ohc=rXjy42YF2UIQ7kNvgG0iwiC&_nc_ht=scontent-mrs2-1.cdninstagram.com&edm=ANo9K5cEAAAA&oh=00_AYAED5MYtOISjn7XdFLsqp2M6t252eZSVbVcwiqW9xXg6w&oe=66E0F1AC',
  //     permalink: 'https://www.instagram.com/p/CtMNb4NNXBc/',
  //     id: '18143363458290468'
  //   },

}

async function uploadImage(accessToken: string, imageUrl: string) {
  console.log("Uploading image", imageUrl);
  try {
    const response = await axios.post(
      `https://graph.instagram.com/v20.0/me/media`,
      {
        image_url: imageUrl,
        access_token: accessToken,
      }
    );

    console.log("Uploaded result:", response.data)

    return response.data.id; // This will return the media_id
  } catch (err) {
    console.log("Error uploading image", err);
    throw err;
  }
}

export async function sendDocumentMessage(accountId: string, mediaId: string, scope?: InstagramTokenScope) {
  try {
    const response = await axios.post(
      `https://graph.instagram.com/v20.0/me/messages`,
      {
        recipient: { "id": accountId },
        message: {
          "attachment": {
            "type": "file",
            "payload": {
              "url": mediaId,
              'is_reusable': 'true'
            }
          }
        },
        access_token: await getAccessToken(scope),
      }
    );

    return response.data;
  } catch (err) {
    console.log("ERR sendDocumentMessage", err)
    // console.log("ERR response data", err.response.data)
  }
}

export async function sendImageMessage(accountId: string, mediaId: string, scope?: InstagramTokenScope) {
  try {
    const response = await axios.post(
      `https://graph.instagram.com/v20.0/me/messages`,
      {
        recipient: { "id": accountId },
        message: {
          "attachment": {
            "type": "image",
            "payload": {
              "url": mediaId,
              'is_reusable': 'true'
            }
          }
        },
        access_token: await getAccessToken(scope),
      }
    );

    return response.data;
  } catch (err) {
    console.log("ERR sendImageMessage", err)
    // console.log("ERR response data", err.response.data)
  }
}

export async function sendUploadAndSendImage(accountId: string, imageUrl: string, scope?: InstagramTokenScope) {
  try {
    console.log("sendImage", imageUrl);

    // let uploadedId = await uploadImage(accessToken, imageUrl)
    // console.log("uploadedId", uploadedId)
    return sendImageMessage(accountId, imageUrl, scope);
  } catch (err) {
    console.log("ERR sendUploadAndSendImage", err)
    // console.log("ERR response data", err.response.data)
  }
}

type Recipient = {
  "id": string, // User ID
} | {
  "comment_id": string, // Comment ID
}

export async function sendTextMessage(recipient: Recipient, message: string, scope?: InstagramTokenScope) {
  const MAX_MESSAGE_LENGTH = 1000;

  // remove "**" from message
  message = message.replace(/\*\*/g, '');

  // If message is within limits, send it as is
  if (message.length <= MAX_MESSAGE_LENGTH) {
    return await fetchPost(`https://graph.instagram.com/v20.0/me/messages`, {
      recipient,
      message: { "text": message },
    }, undefined, scope);
  }

  // Split the message into chunks
  const chunks = [];
  let remainingText = message;

  while (remainingText.length > 0) {
    let chunk;

    if (remainingText.length <= MAX_MESSAGE_LENGTH) {
      // Last piece fits within the limit
      chunk = remainingText;
      remainingText = '';
    } else {
      // Look for a good splitting point (newlines first, then spaces)
      let splitIndex = remainingText.lastIndexOf('\n\n', MAX_MESSAGE_LENGTH);

      if (splitIndex === -1 || splitIndex < MAX_MESSAGE_LENGTH / 2) {
        // Try single newline if double newline not found or too early
        splitIndex = remainingText.lastIndexOf('\n', MAX_MESSAGE_LENGTH);
      }

      if (splitIndex === -1 || splitIndex < MAX_MESSAGE_LENGTH / 2) {
        // Try space if no good newline found
        splitIndex = remainingText.lastIndexOf(' ', MAX_MESSAGE_LENGTH);
      }

      if (splitIndex === -1 || splitIndex < MAX_MESSAGE_LENGTH / 2) {
        // No good natural break point, force split at limit
        splitIndex = MAX_MESSAGE_LENGTH;
      }

      chunk = remainingText.substring(0, splitIndex).trim();
      remainingText = remainingText.substring(splitIndex).trim();
    }

    chunks.push(chunk);
  }

  // Send all chunks and return the response from the last one
  let lastResponse;
  for (const chunk of chunks) {
    lastResponse = await fetchPost(`https://graph.instagram.com/v20.0/me/messages`, {
      recipient,
      message: { "text": chunk },
    }, undefined, scope);
  }

  return lastResponse;
}

export type InstagramEntry = {
  entry: {
    id: string,
    time: number,
    changes: {
      value: {
        from: {
          id: string,
          username: string,
        },
        media: {
          id: string,
          media_product_type: string,
        },
        id: string,
        text: string,
      },
      field: string,
    }[]
  }[],
  object: string,
}


export type InstagramDirectMessageEntry = {
  "time": number,
  "id": string,
  "messaging": [
    {
      "sender": {
        "id": string
      },
      "recipient": {
        "id": string
      },
      "timestamp": number,
      "read": {
        "mid": string,
      },
      "message": {
        "mid": string,
        "text": string,
        "attachments": [
          {
            "type": "image",
            "payload": {
              "url": "https://lookaside.fbsbx.com/ig_messaging_cdn/?asset_id=2046711195746552&signature=AbyKSuJ4f60SHB4o1Cr99IaqzGqrfbxorvHBHrqZlP5snu3wlkOG3tYUdTGvmwo-hAmsbWe53HFdYyeiZkYmoA-ExFt8BCG11ojFwsoert7vfCtQVbaFWxM1pzYF6Y0K5L04PmBb2fUbYzkTRB9Blw21CV3pdmmIXGbr7gAhmq_iFJWM0FsB1615mK08E36PAvb6YQrO5pQV1V2LJCt_H2uMcdofwA"
            }
          }
        ]
      }
    }
  ]
}

export type InstagramDirectMessage = {
  "object": "instagram",
  // "entry": InstagramDirectMessageEntry[]
}

let testObj = {
  "entry": [
    {
      "id": "17841401527750596",
      "time": 1723482905,
      "changes": [
        {
          "value": {
            "from": {
              "id": "1047725890691345",
              "username": "gnu.photography"
            },
            "media": {
              "id": "18143363458290468",
              "media_product_type": "FEED"
            },
            "id": "17873757252139487",
            "text": "123"
          },
          "field": "comments"
        }
      ]
    }
  ],
  "object": "instagram"
}

export async function replyToComment(commentId: string, text: string, scope?: InstagramTokenScope) {
  console.log(`Attempting to reply to comment ${commentId} with text: "${text}"`);
  
  if (!commentId || !text) {
    throw new Error(`Invalid parameters: commentId=${commentId}, text=${text}`);
  }

  if (text.length > 1000) {
    console.warn(`Text length (${text.length}) exceeds Instagram limit of 1000 characters`);
    text = text.substring(0, 997) + '...';
  }

  try {
    const result = await fetchPost(`https://graph.instagram.com/v20.0/${commentId}/replies`, {
      message: text,
    }, undefined, scope);
    
    console.log(`Successfully replied to comment ${commentId}:`, result);
    return result;
  } catch (error) {
    console.error(`Failed to reply to comment ${commentId}:`, error);
    throw error;
  }
}
export async function getFollowPendingRequests() {
  const me = await getMe();
  return await fetchGet(`https://graph.instagram.com/v20.0/${me.user_id}/pending_users`, {
    fields: 'id,username,profile_picture_url',
  });
}

if (typeof require !== "undefined" && typeof module !== "undefined" && require.main === module) {
  (async () => {
    console.log("TESTS")
    // let result = await fetchPost(`https://graph.instagram.com/v23.0/me/messages`, {
    //   recipient: { "id": "994946942204389" },
    //   message: { "text": "¡HolaID23!" },
    // });

    // console.log("result", result)

    // console.log(await getFollowPendingRequests())

    // await sendImageMessage("509081371596726", "18098582656444269")

    // console.log(await getInstagramHandle("27489809430618594"))
    // console.log(await getAllMedia("509081371596726"))
    // console.log(await getMedia("27489809430618594"))
    // console.log(await getAllMediaCaptions("17841401527750596"))
    // console.log(await getMediaCaption("18021777613238589"))
    // console.log(await getMediaCaptionAndPermalink("18202553536244315"))

    // console.log(await getMe())
    // console.log(await replyToComment("18032221103184171", "Hello!"))
    // console.log(await sendInstagramMessage("6011720288872697", {
    //   "type": "text",
    //   "text": "Hello!"
    // } as ICLWebhookText))

    // let newToken = await refreshInstagramToken(accessToken)

    // console.log(JSON.stringify(newToken, null, 2))

    // autoRefreshToken()
    // console.log(await getAccessToken())
    // console.log(await getAccessToken())
    // console.log(await getAccessToken())
    // console.log(await getAccessToken())
    // console.log(await getAccessToken())
    // console.log(await getAccessToken())
    // console.log(await getAccessToken())
    // console.log(await getAccessToken())
    // console.log(await getAccessToken())
    // console.log(await getAccessToken())
    // console.log(await getAccessToken())
    // console.log(await getAccessToken())

    // console.log(await getInstagramHandle("994946942204389"))
    // console.log(await getInstagramHandleAndImage(("994946942204389")))
    // console.log(await sendDocumentMessage("509081371596726", "https://www.instagram.com/p/CtMNb4NNXBc/"))
    // console.log(await getInstagramIdByHandle("@guerrerocarlos"))

  })()
}

// getAccessToken()

async function validateAccessToken(token: string) {
  try {
    const response = await fetch(`https://graph.instagram.com/me?access_token=${token}&fields=id,username`);
    const data = await response.json();
    
    if (!response.ok) {
      console.error("Token validation failed:", data);
      return false;
    }
    
    console.log("Token validation successful:", data);
    return true;
  } catch (error) {
    console.error("Error validating token:", error);
    return false;
  }
}

export async function debugInstagramAPI() {
  console.log("=== Instagram API Debug Information ===");
  
  try {
    // Check access token
    const token = await getAccessToken();
    console.log("Current access token length:", token?.length || 0);
    console.log("Token starts with:", token?.substring(0, 20) + "...");
    
    // Validate token
    const isValid = await validateAccessToken(token);
    console.log("Token is valid:", isValid);
    
    // Get user info
    const me = await getMe();
    console.log("User info:", me);
    
    // Check token expiration from storage
    const storedToken = await get("instagram/latestToken.json");
    console.log("Stored token info:", {
      created_at: storedToken?.created_at,
      expires_in: storedToken?.expires_in,
      days_until_expiry: storedToken?.created_at 
        ? Math.floor((storedToken.created_at + (parseInt(storedToken.expires_in || "0") * 1000) - Date.now()) / (24 * 60 * 60 * 1000))
        : "unknown"
    });
    
  } catch (error) {
    console.error("Debug failed:", error);
  }
  
  console.log("=== End Debug Information ===");
}

export async function debugCommentReply(commentId: string, text: string) {
  console.log("=== Debug Comment Reply ===");
  console.log("Comment ID:", commentId);
  console.log("Reply text:", text);
  console.log("Text length:", text.length);
  
  try {
    // Check if we can get info about the comment
    const commentInfo = await fetchGet(`https://graph.instagram.com/v20.0/${commentId}`, {
      fields: 'id,text,from,media,timestamp'
    });
    console.log("Comment info:", commentInfo);
    
    // Check permissions
    const me = await getMe();
    console.log("Current user:", me);
    
    // Try the actual reply
    console.log("Attempting reply...");
    const result = await replyToComment(commentId, text);
    console.log("Reply successful:", result);
    
    return result;
  } catch (error) {
    console.error("Debug comment reply failed:", error);
    throw error;
  }
}

if (typeof require !== "undefined" && typeof module !== "undefined" && require.main === module) {
  (async () => {
    console.log(await get("instagram/latesttoken"))
  })();
}
