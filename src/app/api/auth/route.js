import axios from "axios";
const axiosInstance = axios.create({
  baseURL: "http://localhost:5000/api/v1", // Base URL  http://localhost:5000  //https://fidopoint.onrender.com/api/v1
  headers: {
    "Content-Type": "application/json", // Set default content-type for the API requests
  },
  timeout: 600000,
});

export async function POST(req) {
  try {
    const { apiType, ...requestData } = await req.json();

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
      case "loginUser":
        response = await axiosInstance.post("/auth/loginUser", requestData);

        break;

      case "registerUser":
        response = await axiosInstance.post("/auth/registerUser", requestData);
        break;

      case "sendPasswordResetLink":
        response = await axiosInstance.post(
          "/auth/sendPasswordResetLink",
          requestData
        );
        break;

      case "verifyEmailorTel":
        response = await axiosInstance.post(
          "/auth/verifyEmailorTel",
          requestData
        );
        break;

      case "sendVerificationCodeEmailOrTel":
        response = await axiosInstance.post(
          "/auth/sendVerificationCodeEmailOrTel",
          requestData
        );
        break;

      case "enterPassCode":
        response = await axiosInstance.post("/auth/enterPassCode", requestData);
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
    console.log(error);
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
              message: "Conflicts",
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

          console.log("sssssssssss");
          console.log(process.env.NODE_ENV);

          console.log("sssssssssss");

          return new Response(
            JSON.stringify({
              status: "error",
              message: "Internal server error",
              details: errorMessage,
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

    /*if (!token) {
      return new Response(
        JSON.stringify({
          status: "error",
          message: "Token is required for refreshAccessToken",
        }),
        { status: 400 }
      );
    }*/

    let response;

    // Handle different API types
    switch (apiType) {
      case "refreshAccessToken":
        // Here, you'd typically send the token to your backend for refreshing
        response = await axiosInstance.post("/auth/refreshAccessToken", {
          token,
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
