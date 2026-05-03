import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "https://fidopoint.onrender.com/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

// ============================================================
// RATE LIMITER — In-Memory (no Redis needed)
// ============================================================
// All limits are easy to adjust below.
// Structure: { windowMs, max, banAfterViolations, banDurationMs }

const RATE_LIMIT_CONFIG = {
  // ⚠️ Sensitive — financial / auth operations
  sensitive: {
    windowMs: 15 * 60 * 1000,   // 15 minute window
    max: 10,                      // max 10 requests per window  ← adjust here
    banAfterViolations: 3,        // ban after hitting limit 3 times ← adjust here
    banDurationMs: 60 * 60 * 1000, // 1 hour ban ← adjust here
  },
  // 🔒 Restricted — write/mutation operations
  restricted: {
    windowMs: 60 * 1000,         // 1 minute window
    max: 20,                      // max 20 requests per minute ← adjust here
    banAfterViolations: 5,
    banDurationMs: 30 * 60 * 1000, // 30 min ban ← adjust here
  },
  // 🟢 General — read operations
  general: {
    windowMs: 60 * 1000,         // 1 minute window
    max: 60,                      // max 60 requests per minute ← adjust here
    banAfterViolations: 10,
    banDurationMs: 15 * 60 * 1000, // 15 min ban ← adjust here
  },
};

// Map each apiType to a tier
// To change a tier, just move the apiType to a different group below
const API_TYPE_TIERS = {
  sensitive: [
    "confirmTransfer",
    "initiateWithdrawal",
    "verifyWithdrawalOtp",
    "makeOrderPayment",
    "updatePin",
    "verifyNIN",
    "initiateNINVerify",
    "generateAccountVirtual",
    "setWithdrawalBank",
    "getChargeSummary",
  ],
  restricted: [
    "updateUser",
    "updateToken",
    "orderAcceptOrCancel",
    "submitSupportRequest",
    "complaintType",
    "notificationDelete",
    "notificationMarkRead",
    "createMerchantAds",
    "verifyCompleteOrder",
    "updateMerchantProfileWithoutFile",
    "updateMerchantProfileWithImage",
    "updateUserProfileWithImage",
    "uploadNIN",
    "getMerchantInformation",
  ],
  general: [
    "userData",
    "getTransactionHistory",
    "getTransactionHistoryOrder",
    "getChatHistory",
    "getMyOrderDetails",
    "agoraToken",
    "getGeneralTransaction",
    "pendingOrder",
    "notification",
    "getMyOrders",
    "getMatchMerchant",
    "getOrderStatistic",
    "hasMerchantAds",
    "getVerificationSettings",
    "getMerchantProfile",
    "getdefaultAds",
    "notificationCountUnread",
    "getMyRangeLimit",
    "banks",
    "nameEnquiry",
    "getSettings",
    "bank-details",
  ],
};

// Storage maps (in-memory, resets on server restart)
const requestTracker = new Map(); // key → { count, windowStart }
const violationTracker = new Map(); // ip → violation count
const banList = new Map(); // ip → ban expiry timestamp

function getClientIp(req) {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

function getTierForApiType(apiType) {
  if (API_TYPE_TIERS.sensitive.includes(apiType)) return "sensitive";
  if (API_TYPE_TIERS.restricted.includes(apiType)) return "restricted";
  return "general"; // default fallback
}

function checkRateLimit(ip, apiType) {
  const now = Date.now();

  // 1. Check if IP is banned
  if (banList.has(ip)) {
    const banExpiry = banList.get(ip);
    if (now < banExpiry) {
      const minutesLeft = Math.ceil((banExpiry - now) / 60000);
      return {
        allowed: false,
        banned: true,
        reason: `You are temporarily banned. Try again in ${minutesLeft} minute(s).`,
        retryAfter: Math.ceil((banExpiry - now) / 1000),
      };
    }
    // Ban expired — clean up
    banList.delete(ip);
    violationTracker.delete(ip);
  }

  // 2. Get config for this apiType's tier
  const tier = getTierForApiType(apiType);
  const config = RATE_LIMIT_CONFIG[tier];
  const key = `${ip}:${tier}`; // group by IP + tier (not per apiType, to prevent bypassing via switching types)

  // 3. Get or init tracker
  let tracker = requestTracker.get(key);
  if (!tracker || now - tracker.windowStart > config.windowMs) {
    // New window
    tracker = { count: 1, windowStart: now };
    requestTracker.set(key, tracker);
    return { allowed: true, tier, remaining: config.max - 1 };
  }

  tracker.count++;

  // 4. Check if over limit
  if (tracker.count > config.max) {
    // Track violations for this IP
    const violations = (violationTracker.get(ip) || 0) + 1;
    violationTracker.set(ip, violations);

    // Ban if violations exceed threshold
    if (violations >= config.banAfterViolations) {
      banList.set(ip, now + config.banDurationMs);
      violationTracker.delete(ip);
      console.warn(
        `[BAN] IP ${ip} banned for ${config.banDurationMs / 60000} mins | tier: ${tier} | apiType: ${apiType}`
      );
    } else {
      console.warn(
        `[RATE LIMIT] IP ${ip} | tier: ${tier} | apiType: ${apiType} | violations: ${violations}/${config.banAfterViolations}`
      );
    }

    const retryAfter = Math.ceil(
      (tracker.windowStart + config.windowMs - now) / 1000
    );
    return {
      allowed: false,
      banned: false,
      tier,
      reason: "Too many requests. Slow down.",
      retryAfter,
    };
  }

  return {
    allowed: true,
    tier,
    remaining: config.max - tracker.count,
  };
}

function rateLimitResponse(result) {
  return new Response(
    JSON.stringify({
      status: "error",
      message: result.banned ? "Access temporarily banned" : "Too many requests",
      details: result.reason,
    }),
    {
      status: result.banned ? 403 : 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(result.retryAfter || 60),
        "X-RateLimit-Remaining": "0",
      },
    }
  );
}

// ============================================================
// CLEANUP — Prevent memory leaks by pruning stale entries
// Runs every 10 minutes
// ============================================================
if (typeof globalThis.__rateLimitCleanupStarted === "undefined") {
  globalThis.__rateLimitCleanupStarted = true;
  setInterval(() => {
    const now = Date.now();
    for (const [key, tracker] of requestTracker.entries()) {
      // Remove entries older than 1 hour regardless of tier
      if (now - tracker.windowStart > 60 * 60 * 1000) {
        requestTracker.delete(key);
      }
    }
    for (const [ip, expiry] of banList.entries()) {
      if (now > expiry) {
        banList.delete(ip);
        violationTracker.delete(ip);
      }
    }
  }, 10 * 60 * 1000);
}

// ============================================================
// POST HANDLER
// ============================================================
export async function POST(req) {
  try {
    const ip = getClientIp(req);
    let apiType, accessToken, requestData;
    let externalFormData = new FormData();

    const contentType = req.headers.get("content-type");
    if (contentType && contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      apiType = formData.get("apiType");
      accessToken = formData.get("accessToken");
      for (const [key, value] of formData.entries()) {
        if (key !== "apiType" && key !== "accessToken") {
          externalFormData.append(key, value);
        }
      }
    } else {
      const jsonData = await req.json();
      apiType = jsonData.apiType;
      accessToken = jsonData.accessToken;
      const { accessToken: _, apiType: __, ...rest } = jsonData;
      requestData = rest;
    }

    if (!apiType) {
      return new Response(
        JSON.stringify({ status: "error", message: "apiType is required" }),
        { status: 400 }
      );
    }

    // ✅ Rate limit check
    const limitResult = checkRateLimit(ip, apiType);
    if (!limitResult.allowed) return rateLimitResponse(limitResult);

    let response;

    switch (apiType) {
      case "updateUser":
        response = await axiosInstance.post("/user/updateProfile", requestData, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        break;

      case "updatePin":
        response = await axiosInstance.post("/user/setPin", requestData, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        break;

      case "orderAcceptOrCancel":
        response = await axiosInstance.post(
          "/user/orderAcceptOrCancel",
          requestData,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        break;

      case "updateToken":
        response = await axiosInstance.post("/user/updateToken", requestData, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        break;

      case "submitSupportRequest":
        response = await axiosInstance.post(
          "/user/submitUserMessage",
          requestData,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        break;

      case "confirmTransfer":
        response = await axiosInstance.post(
          "/user/confirmTransfer",
          requestData,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        break;

      case "complaintType":
        response = await axiosInstance.post(
          "/user/submitUserMessage",
          requestData,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        break;

      case "getMerchantInformation":
        response = await axiosInstance.post(
          "/user/getMerchantInformation",
          requestData,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        break;

      case "notificationDelete":
        response = await axiosInstance.post(
          "/user/notification/delete",
          requestData,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        break;

      case "initiateWithdrawal":
        response = await axiosInstance.post(
          "/user/initiateWithdrawal",
          requestData,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        break;

      case "verifyWithdrawalOtp":
        response = await axiosInstance.post(
          "/user/verifyWithdrawalOtp",
          requestData,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        break;

      case "notificationMarkRead":
        response = await axiosInstance.post(
          "/user/notification/read",
          requestData,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        break;

      case "makeOrderPayment":
        response = await axiosInstance.post(
          "/user/makeOrderPayment",
          requestData,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        break;

      case "getChargeSummary":
        response = await axiosInstance.post(
          "/user/getChargeSummary",
          requestData,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        break;

      case "setWithdrawalBank":
        response = await axiosInstance.post(
          "/user/setWithdrawalBank",
          requestData,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        break;

      case "generateAccountVirtual":
        response = await axiosInstance.post(
          "/user/generateAccountVirtual",
          requestData,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        break;

      case "initiateNINVerify":
        const { verificationType, ...updatedRequestData } = requestData;
        response = await axiosInstance.post(
          "/user/initiateNINVerify",
          updatedRequestData,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        break;

      case "verifyNIN":
        response = await axiosInstance.post("/user/verifyNIN", requestData, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        break;

      case "createMerchantAds":
        response = await axiosInstance.post(
          "/user/createMerchantAds",
          requestData,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        break;

      case "verifyCompleteOrder":
        response = await axiosInstance.post(
          "/user/verifyCompleteOrder",
          requestData,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        break;

      case "updateMerchantProfileWithoutFile":
        response = await axiosInstance.post(
          "/user/updateMerchantProfile",
          requestData,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        break;

      case "updateMerchantProfileWithImage":
        response = await axiosInstance.post(
          "/user/updateMerchantProfile",
          externalFormData,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );
        break;

      case "updateUserProfileWithImage":
        response = await axiosInstance.post(
          "/user/updateProfile",
          externalFormData,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );
        break;

      case "uploadNIN":
        response = await axiosInstance.post("/user/uploadNIN", externalFormData, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "multipart/form-data",
          },
        });
        break;

      default:
        return new Response(
          JSON.stringify({
            status: "error",
            message: `Unsupported apiType: ${apiType}`,
          }),
          { status: 400 }
        );
    }

    return new Response(
      JSON.stringify({
        status: "success",
        message: `${apiType} completed successfully`,
        data: response.data,
      }),
      { status: 200 }
    );
  } catch (error) {
    if (error.isAxiosError) {
      const status = error.response?.status || 500;
      const errorMessage = error.response?.data?.message || error.message;

      switch (status) {
        case 400:
          return new Response(
            JSON.stringify({ status: "error", message: "Invalid request", details: errorMessage }),
            { status: 400 }
          );
        case 401:
          return new Response(
            JSON.stringify({ status: "error", message: "Authentication failed", details: errorMessage }),
            { status: 401 }
          );
        case 403:
          return new Response(
            JSON.stringify({ status: "error", message: "Access forbidden", details: errorMessage }),
            { status: 403 }
          );
        case 404:
          return new Response(
            JSON.stringify({ status: "error", message: "Resource not found", details: errorMessage }),
            { status: 404 }
          );
        case 429:
          return new Response(
            JSON.stringify({ status: "error", message: "Too many requests", details: errorMessage }),
            { status: 429 }
          );
        case 409:
          return new Response(
            JSON.stringify({ status: "error", message: error.response.data.message, details: errorMessage }),
            { status: 409 }
          );
        default:
          console.error("Server Error:", { status, message: errorMessage, stack: error.stack });
          return new Response(
            JSON.stringify({
              status: "error",
              message: "Internal server error",
              details: process.env.NODE_ENV === "development" ? errorMessage : "An unexpected error occurred",
            }),
            { status: 500 }
          );
      }
    }

    if (error instanceof SyntaxError) {
      return new Response(
        JSON.stringify({ status: "error", message: "Invalid JSON in request body", details: error.message }),
        { status: 400 }
      );
    }

    console.error("Unexpected Error:", { message: error.message, stack: error.stack });
    return new Response(
      JSON.stringify({
        status: "error",
        message: "An unexpected error occurred",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      }),
      { status: 500 }
    );
  }
}

// ============================================================
// GET HANDLER
// ============================================================
export async function GET(req) {
  try {
    const ip = getClientIp(req);
    const { searchParams } = new URL(req.url);

    const apiType = searchParams.get("apiType");
    const token = searchParams.get("token");

    if (!apiType) {
      return new Response(
        JSON.stringify({ status: "error", message: "apiType is required" }),
        { status: 400 }
      );
    }

    // ✅ Rate limit check
    const limitResult = checkRateLimit(ip, apiType);
    if (!limitResult.allowed) return rateLimitResponse(limitResult);

    const additionalParams = {};
    searchParams.forEach((value, key) => {
      if (key !== "apiType" && key !== "token") {
        additionalParams[key] = value;
      }
    });

    const headers = { Authorization: `Bearer ${token}` };
    let response;

    switch (apiType) {
      case "userData":
        response = await axiosInstance.get("/user/whoIAm", { headers, params: additionalParams });
        break;

      case "getTransactionHistory":
        response = await axiosInstance.get("/user/getTransactionHistory", { headers, params: additionalParams });
        break;

      case "getTransactionHistoryOrder":
        response = await axiosInstance.get("/user/getTransactionHistoryOrder", { headers, params: additionalParams });
        break;

      case "getChatHistory":
        response = await axiosInstance.get("/user/getChatHistory", { headers, params: additionalParams });
        break;

      case "getMyOrderDetails":
        response = await axiosInstance.get("/user/getMyOrderDetails", { headers, params: additionalParams });
        break;

      case "agoraToken":
        response = await axiosInstance.get("/user/agora/token", { headers, params: additionalParams });
        break;

      case "getGeneralTransaction":
        response = await axiosInstance.get("/user/getGeneralTransaction", { headers, params: additionalParams });
        break;

      case "pendingOrder":
        response = await axiosInstance.get("/user/merchant/pendingOrders", { headers, params: additionalParams });
        break;

      case "notification":
        response = await axiosInstance.get("/user/notification", { headers, params: additionalParams });
        break;

      case "getMyOrders":
        response = await axiosInstance.get("/user/getMyOrders", { headers, params: additionalParams });
        break;

      case "getMatchMerchant":
        response = await axiosInstance.get("/user/getMyMerchant", { headers, params: additionalParams });
        break;

      case "getOrderStatistic":
        response = await axiosInstance.get("/user/getOrderStatistic", { headers, params: additionalParams });
        break;

      case "hasMerchantAds":
        response = await axiosInstance.get("/user/hasMerchantAds", { headers, params: additionalParams });
        break;

      case "getVerificationSettings":
        response = await axiosInstance.get("/user/getVerificationSettings", { headers, params: additionalParams });
        break;

      case "getMerchantProfile":
        response = await axiosInstance.get("/user/getMerchantProfile", { headers, params: additionalParams });
        break;

      case "getdefaultAds":
        response = await axiosInstance.get("/user/getdefaultAds", { headers, params: additionalParams });
        break;

      case "notificationCountUnread":
        response = await axiosInstance.get("/user/notification/unread/count", { headers, params: additionalParams });
        break;

      case "getMyRangeLimit":
        response = await axiosInstance.get("/user/getMyRangeLimit", { headers, params: additionalParams });
        break;

      case "banks":
        response = await axiosInstance.get("/user/getBank", { headers, params: additionalParams });
        break;

      case "nameEnquiry":
        response = await axiosInstance.get("/user/nameEnquiry", { headers, params: additionalParams });
        break;

      case "getSettings":
        response = await axiosInstance.get("/user/getSettings", { headers, params: additionalParams });
        break;

      case "bank-details":
        response = await axiosInstance.get("/user/bank-details", { headers, params: additionalParams });
        break;

      default:
        return new Response(
          JSON.stringify({ status: "error", message: `Unsupported apiType: ${apiType}` }),
          { status: 400 }
        );
    }

    return new Response(
      JSON.stringify({
        status: "success",
        message: `${apiType} completed successfully`,
        data: response.data,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    if (error.isAxiosError) {
      const status = error.response?.status || 500;
      const errorMessage = error.response?.data?.message || error.message;

      switch (status) {
        case 401:
          return new Response(
            JSON.stringify({ status: "error", message: "Authentication failed", details: errorMessage }),
            { status: 401 }
          );
        default:
          return new Response(
            JSON.stringify({
              status: "error",
              message: "Internal server error",
              details: process.env.NODE_ENV === "development" ? errorMessage : "An unexpected error occurred",
            }),
            { status: 500 }
          );
      }
    }

    console.error("Unexpected Error:", { message: error.message, stack: error.stack });
    return new Response(
      JSON.stringify({
        status: "error",
        message: "An unexpected error occurred",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      }),
      { status: 500 }
    );
  }
}