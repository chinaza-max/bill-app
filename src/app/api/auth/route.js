import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "https://fidopoint.onrender.com/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 25000,
});

//https://fidopoint.onrender.com
//http://localhost:5000/api/v1



// =========================================================
// RATE LIMITER — In-Memory (no Redis needed)
// ============================================================
// Auth routes get the strictest limits since they are the most
// abused endpoints (brute force, credential stuffing, spam).
//
// Adjust the numbers below to tune behaviour:
// ┌─────────────────────┬──────────────────────────────────────┐
// │ Field               │ What it controls                     │
// ├─────────────────────┼──────────────────────────────────────┤
// │ windowMs            │ How long the window lasts (ms)       │
// │ max                 │ Max requests allowed in that window  │
// │ banAfterViolations  │ How many 429s before IP gets banned  │
// │ banDurationMs       │ How long the ban lasts (ms)          │
// └─────────────────────┴──────────────────────────────────────┘

const RATE_LIMIT_CONFIG = {
  // 🔴 Critical — login, register, OTP, password reset
  // These are the most sensitive: brute force / credential stuffing targets
  critical: {
    windowMs: 15 * 60 * 1000,    // 15 minute window       ← adjust here
    max: 8,                        // 8 attempts per window  ← adjust here
    banAfterViolations: 3,         // ban after 3 violations ← adjust here
    banDurationMs: 2 * 60 * 60 * 1000, // 2 hour ban        ← adjust here
  },

  // 🟡 Strict — OTP send, verification codes (spam targets)
  strict: {
    windowMs: 10 * 60 * 1000,    // 10 minute window       ← adjust here
    max: 5,                        // 5 requests per window  ← adjust here
    banAfterViolations: 3,
    banDurationMs: 60 * 60 * 1000, // 1 hour ban            ← adjust here
  },

  // 🟢 General — ping and low-risk GET routes
  general: {
    windowMs: 60 * 1000,          // 1 minute window        ← adjust here
    max: 30,                       // 30 requests per minute ← adjust here
    banAfterViolations: 10,
    banDurationMs: 15 * 60 * 1000, // 15 min ban            ← adjust here
  },
};

// Map each apiType to a tier.
// To change a tier, move the apiType string to a different array.
const API_TYPE_TIERS = {
  critical: [
    "loginUser",       // brute force target
    "registerUser",    // spam account creation
    "enterPassCode",   // passcode guessing
    "sendPinResetOtp", // OTP abuse
  ],
  strict: [
    "sendPasswordResetLink",         // reset link spam
    "verifyEmailorTel",              // verification guessing
    "sendVerificationCodeEmailOrTel", // OTP send spam
    "uploadImageGoogleDrive",        // upload abuse
  ],
  general: [
    "ping", // health check — low risk
  ],
};

// In-memory stores
const requestTracker = new Map(); // `${ip}:${tier}` → { count, windowStart }
const violationTracker = new Map(); // ip → violation count
const banList = new Map(); // ip → ban expiry timestamp

function getClientIp(req) {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

function getTierForApiType(apiType) {
  if (API_TYPE_TIERS.critical.includes(apiType)) return "critical";
  if (API_TYPE_TIERS.strict.includes(apiType)) return "strict";
  return "general";
}

function checkRateLimit(ip, apiType) {
  const now = Date.now();

  // 1. Check active ban
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

  // 2. Get config for this tier
  const tier = getTierForApiType(apiType);
  const config = RATE_LIMIT_CONFIG[tier];
  // Key by IP + tier so switching apiTypes doesn't reset the counter
  const key = `${ip}:${tier}`;

  // 3. Get or init window tracker
  let tracker = requestTracker.get(key);
  if (!tracker || now - tracker.windowStart > config.windowMs) {
    requestTracker.set(key, { count: 1, windowStart: now });
    return { allowed: true, tier, remaining: config.max - 1 };
  }

  tracker.count++;

  // 4. Over limit?
  if (tracker.count > config.max) {
    const violations = (violationTracker.get(ip) || 0) + 1;
    violationTracker.set(ip, violations);

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

  return { allowed: true, tier, remaining: config.max - tracker.count };
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
// CLEANUP — prune stale map entries every 10 minutes
// Prevents unbounded memory growth on long-running servers
// ============================================================
if (typeof globalThis.__authRateLimitCleanupStarted === "undefined") {
  globalThis.__authRateLimitCleanupStarted = true;
  setInterval(() => {
    const now = Date.now();
    for (const [key, tracker] of requestTracker.entries()) {
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

    let apiType, requestData;
    let externalFormData = new FormData();

    const contentType = req.headers.get("content-type");
    if (contentType && contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      apiType = formData.get("apiType");
      for (const [key, value] of formData.entries()) {
        if (key !== "apiType" && key !== "accessToken") {
          externalFormData.append(key, value);
        }
      }
    } else {
      const jsonData = await req.json();
      apiType = jsonData.apiType;
      const { apiType: __, ...rest } = jsonData;
      requestData = rest;
    }

    if (!apiType) {
      return new Response(
        JSON.stringify({ status: "error", message: "apiType is required" }),
        { status: 400 }
      );
    }

    // ✅ Rate limit check — runs before any processing
    const limitResult = checkRateLimit(ip, apiType);
    if (!limitResult.allowed) return rateLimitResponse(limitResult);

    let response;

    switch (apiType) {
      case "loginUser":
        response = await retryRequest({
          method: "post",
          url: "/auth/loginUser",
          data: requestData,
        });
        break;

      case "registerUser":
        response = await retryRequest({
          method: "post",
          url: "/auth/registerUser",
          data: requestData,
        });
        break;

      case "sendPasswordResetLink":
        response = await retryRequest({
          method: "post",
          url: "/auth/sendPasswordResetLink",
          data: requestData,
        });
        break;

      case "verifyEmailorTel":
        response = await retryRequest({
          method: "post",
          url: "/auth/verifyEmailorTel",
          data: requestData,
        });
        break;

      case "sendVerificationCodeEmailOrTel":
        response = await retryRequest({
          method: "post",
          url: "/auth/sendVerificationCodeEmailOrTel",
          data: requestData,
        });
        break;

      case "enterPassCode":
        response = await retryRequest({
          method: "post",
          url: "/auth/enterPassCode",
          data: requestData,
        });
        break;

      case "uploadImageGoogleDrive":
        response = await retryRequest({
          method: "post",
          url: "/auth/uploadImageGoogleDrive",
          data: externalFormData,
          headers: { "Content-Type": "multipart/form-data" },
        });
        break; // ← fixed: missing break in original

      case "sendPinResetOtp":
        response = await retryRequest({
          method: "post",
          url: "/auth/sendPinResetOtp",
          data: requestData,
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
    console.log(error);

    if (error.isAxiosError) {
      const status = error.response?.status || 500;
      const errorMessage = error.response?.data?.message || error.message;

      if (error.code === "ECONNABORTED") {
        return new Response(
          JSON.stringify({
            status: "error",
            message: "Request timeout, please try again later.",
          }),
          { status: 408 }
        );
      }

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
            JSON.stringify({ status: "error", message: "Conflicts", details: errorMessage }),
            { status: 409 }
          );
        default:
          console.error("Server Error:", { status, message: errorMessage, stack: error.stack });
          return new Response(
            JSON.stringify({ status: "error", message: "Internal server error", details: errorMessage }),
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

    let response;

    switch (apiType) {
      case "ping":
        response = await axiosInstance.get("/auth/ping");
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

      if (error.code === "ECONNABORTED") {
        return new Response(
          JSON.stringify({ status: "error", message: "Request timeout, please try again later." }),
          { status: 408 }
        );
      }

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

// ============================================================
// RETRY HELPER
// ============================================================
async function retryRequest(config, retries = 7, delay = 3000) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await axiosInstance(config);
    } catch (error) {
      if (error.code === "ECONNABORTED" || error.message.includes("timeout")) {
        if (attempt < retries - 1) {
          await new Promise((res) => setTimeout(res, delay));
          continue;
        }
      }
      throw error;
    }
  }
}