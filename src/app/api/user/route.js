import axios from "axios";
const axiosInstance = axios.create({
  baseURL: "https://fidopoint.onrender.com/api/v1",
  headers: {
    "Content-Type": "application/json", // Set default content-type for the API requests
  },
});
//https://chatgpt.com/c/67d576fe-025c-8009-869b-d6463722826f
export async function POST(req) {
  try {
    /* const { accessToken, apiType, ...requestData } =
      await req.json();
*/

    let apiType, accessToken, requestData;
    let formData;
    let externalFormData = new FormData();

    // Check if the request contains multipart form data
    const contentType = req.headers.get("content-type");
    if (contentType && contentType.includes("multipart/form-data")) {
      formData = await req.formData();
      externalFormData = new FormData();

      apiType = formData.get("apiType");
      accessToken = formData.get("accessToken");

      // Copy all fields from the received formData
      for (const [key, value] of formData.entries()) {
        if (key !== "apiType" && key !== "accessToken") {
          // Don't include apiType in the external request
          externalFormData.append(key, value);
        }
      }
    } else {
      // Handle JSON request
      const jsonData = await req.json();
      apiType = jsonData.apiType;
      accessToken = jsonData.accessToken;

      // Destructure to exclude specific fields
      const { accessToken: _, apiType: __, ...rest } = jsonData;
      requestData = rest;
    }

    // Validate required fields
    if (!apiType) {
      return new Response(
        JSON.stringify({
          status: "error",
          message: "apiType is required",
        }),
        { status: 400 }
      );
    }

    let response;

    // Handle different API types
    switch (apiType) {
      case "updateUser":
        response = await axiosInstance.post(
          "/user/updateProfile",
          requestData,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`, // Add accessToken to the Authorization header
            },
          }
        );

        break;

      case "updatePin":
        response = await axiosInstance.post("/user/setPin", requestData, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        break;

      case "submitSupportRequest":
        response = await axiosInstance.post(
          "/user/submitUserMessage",
          requestData,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        break;

      case "getMerchantInformation":
        response = await axiosInstance.post(
          "/user/getMerchantInformation",
          requestData,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        break;

      case "makeOrderPayment":
        response = await axiosInstance.post(
          "/user/makeOrderPayment",
          requestData,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        break;

      case "getChargeSummary":
        response = await axiosInstance.post(
          "/user/getChargeSummary",
          requestData,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        break;

      case "generateAccountVirtual":
        response = await axiosInstance.post(
          "/user/generateAccountVirtual",
          requestData,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        break;

      case "initiateNINVerify":
        const { verificationType, ...updatedRequestData } = requestData;

        response = await axiosInstance.post(
          "/user/initiateNINVerify",
          updatedRequestData,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        break;

      case "verifyNIN":
        response = await axiosInstance.post("/user/verifyNIN", requestData, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        break;

      case "createMerchantAds":
        response = await axiosInstance.post(
          "/user/createMerchantAds",
          requestData,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        break;

      case "updateMerchantProfileWithoutFile":
        response = await axiosInstance.post(
          "/user/updateMerchantProfile",
          requestData,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        break;

      case "updateMerchantProfileWithImage":
        const config = {
          headers: { Authorization: `Bearer ${accessToken}` },
        };
        config.headers["Content-Type"] = "multipart/form-data";
        response = await axiosInstance.post(
          "/user/updateMerchantProfile",
          externalFormData,
          config
        );

        break;

      // Add other API types here
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
    // Handle Axios errors
    if (error.isAxiosError) {
      const status = error.response?.status || 500;
      const errorMessage = error.response?.data?.message || error.message;

      // Handle specific error status codes
      switch (status) {
        case 400:
          return new Response(
            JSON.stringify({
              status: "error",
              message: "Invalid request",
              details: errorMessage,
            }),
            { status: 400 }
          );

        case 401:
          return new Response(
            JSON.stringify({
              status: "error",
              message: "Authentication failed",
              details: errorMessage,
            }),
            { status: 401 }
          );

        case 403:
          return new Response(
            JSON.stringify({
              status: "error",
              message: "Access forbidden",
              details: errorMessage,
            }),
            { status: 403 }
          );

        case 404:
          return new Response(
            JSON.stringify({
              status: "error",
              message: "Resource not found",
              details: errorMessage,
            }),
            { status: 404 }
          );

        case 429:
          return new Response(
            JSON.stringify({
              status: "error",
              message: "Too many requests",
              details: errorMessage,
            }),
            { status: 429 }
          );

        case 409:
          return new Response(
            JSON.stringify({
              status: "error",
              message: error.response.data.message,
              details: errorMessage,
            }),
            { status: 409 }
          );

        default:
          // Log server errors for debugging
          console.error("Server Error:", {
            status,
            message: errorMessage,
            stack: error.stack,
          });

          return new Response(
            JSON.stringify({
              status: "error",
              message: "Internal server error",
              details:
                process.env.NODE_ENV === "development"
                  ? errorMessage
                  : "An unexpected error occurred",
            }),
            { status: 500 }
          );
      }
    }

    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      return new Response(
        JSON.stringify({
          status: "error",
          message: "Invalid JSON in request body",
          details: error.message,
        }),
        { status: 400 }
      );
    }

    // Handle any other unexpected errors
    console.error("Unexpected Error:", {
      message: error.message,
      stack: error.stack,
    });

    return new Response(
      JSON.stringify({
        status: "error",
        message: "An unexpected error occurred",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      }),
      { status: 500 }
    );
  }
}

export async function GET(req) {
  try {
    // Extract search params from the URL
    const { searchParams } = new URL(req.url);

    // Get the apiType and token from the query string
    const apiType = searchParams.get("apiType");
    const token = searchParams.get("token");

    // Validate required parameters
    if (!apiType) {
      return new Response(
        JSON.stringify({
          status: "error",
          message: "apiType is required",
        }),
        { status: 400 }
      );
    }

    // Extract all other parameters into an object
    const additionalParams = {};
    searchParams.forEach((value, key) => {
      // Skip apiType and token as they're handled separately
      if (key !== "apiType" && key !== "token") {
        additionalParams[key] = value;
      }
    });

    let response;
    const headers = {
      Authorization: `Bearer ${token}`,
    };

    // Handle different API types
    switch (apiType) {
      case "userData":
        response = await axiosInstance.get("/user/whoIAm", {
          headers,
          params: additionalParams, // Pass additional parameters to the request
        });
        break;

      case "getTransactionHistory":
        response = await axiosInstance.get("/user/getTransactionHistory", {
          headers,
          params: additionalParams,
        });
        break;

      case "getGeneralTransaction":
        response = await axiosInstance.get("/user/getGeneralTransaction", {
          headers,
          params: additionalParams,
        });
        break;

      case "getMatchMerchant":
        response = await axiosInstance.get("/user/getMyMerchant", {
          headers,
          params: additionalParams,
        });
        break;

      case "getOrderStatistic":
        response = await axiosInstance.get("/user/getOrderStatistic", {
          headers,
          params: additionalParams,
        });
        break;

      case "getMerchantProfile":
        response = await axiosInstance.get("/user/getMerchantProfile", {
          headers,
          params: additionalParams,
        });
        break;

      case "getdefaultAds":
        response = await axiosInstance.get("/user/getdefaultAds", {
          headers,
          params: additionalParams,
        });
        break;

      case "getMyRangeLimit":
        response = await axiosInstance.get("/user/getMyRangeLimit", {
          headers,
          params: additionalParams,
        });
        break;

      case "getSettings":
        response = await axiosInstance.get("/user/getSettings", {
          headers,
          params: additionalParams,
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

    // Return success response with the data
    return new Response(
      JSON.stringify({
        status: "success",
        message: `${apiType} completed successfully`,
        data: response.data,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*", // For CORS
        },
      }
    );
  } catch (error) {
    // Handle Axios errors
    if (error.isAxiosError) {
      const status = error.response?.status || 500;
      const errorMessage = error.response?.data?.message || error.message;

      switch (status) {
        case 401:
          return new Response(
            JSON.stringify({
              status: "error",
              message: "Authentication failed",
              details: errorMessage,
            }),
            { status: 401 }
          );

        default:
          return new Response(
            JSON.stringify({
              status: "error",
              message: "Internal server error",
              details:
                process.env.NODE_ENV === "development"
                  ? errorMessage
                  : "An unexpected error occurred",
            }),
            { status: 500 }
          );
      }
    }

    // Handle other errors
    console.error("Unexpected Error:", {
      message: error.message,
      stack: error.stack,
    });

    return new Response(
      JSON.stringify({
        status: "error",
        message: "An unexpected error occurred",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      }),
      { status: 500 }
    );
  }
}

/*
export async function GET(req) {
  try {
    // Extract search params from the URL
    const { searchParams } = new URL(req.url);

    // Get the apiType and other parameters from the query string
    const apiType = searchParams.get("apiType");
    const token = searchParams.get("token"); // Assuming the token is passed as a query parameter

    // Validate required parameters
    if (!apiType) {
      return new Response(
        JSON.stringify({
          status: "error",
          message: "apiType is required",
        }),
        { status: 400 }
      );
    }

    let response;

    // Handle different API types
    switch (apiType) {
    
      case "userData":
        response = await axiosInstance.get("/user/whoIAm", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        break;

      case "getTransactionHistory":
        response = await axiosInstance.get("/user/getTransactionHistory", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        break;

      case "getGeneralTransaction":
        response = await axiosInstance.get("/user/getGeneralTransaction", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        break;

      case "getMatchMerchant":
        response = await axiosInstance.get("/user/getMyMerchant", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        break;

      case "getOrderStatistic":
        response = await axiosInstance.get("/user/getOrderStatistic", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        break;

      case "getMerchantProfile":
        response = await axiosInstance.get("/user/getMerchantProfile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        break;

      case "getdefaultAds":
        response = await axiosInstance.get("/user/getdefaultAds", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        break;

      case "getMyRangeLimit":
        response = await axiosInstance.get("/user/getMyRangeLimit", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        break;
      case "getSettings":
        response = await axiosInstance.get("/user/getSettings", {
          headers: {
            Authorization: `Bearer ${token}`,
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

    // Return success response with the refreshed token or necessary data
    return new Response(
      JSON.stringify({
        status: "success",
        message: `${apiType} completed successfully`,
        data: response.data, // The refreshed token or any other relevant data
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*", // If needed for CORS
        },
      }
    );
  } catch (error) {
    // Handle Axios errors
    if (error.isAxiosError) {
      const status = error.response?.status || 500;
      const errorMessage = error.response?.data?.message || error.message;

      switch (status) {
        case 401:
          return new Response(
            JSON.stringify({
              status: "error",
              message: "Authentication failed",
              details: errorMessage,
            }),
            { status: 401 }
          );

        default:
          return new Response(
            JSON.stringify({
              status: "error",
              message: "Internal server error",
              details:
                process.env.NODE_ENV === "development"
                  ? errorMessage
                  : "An unexpected error occurred",
            }),
            { status: 500 }
          );
      }
    }

    // Handle other errors
    console.error("Unexpected Error:", {
      message: error.message,
      stack: error.stack,
    });

    return new Response(
      JSON.stringify({
        status: "error",
        message: "An unexpected error occurred",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      }),
      { status: 500 }
    );
  }
}
*/
