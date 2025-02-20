import axiosInstance from "../axiosInstance";

export async function POST(req) {
  try {
    const { accessToken, apiType, ...requestData } = await req.json();

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
      case "userData":
        response = await axiosInstance.get("/user/whoIAm", {
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
