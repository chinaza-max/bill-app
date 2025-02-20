export const registerUser = async (user) => {
  try {
    const response = await fetch("api/auth", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ...user, apiType: "registerUser" }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw {
        status: response.status,
        ...data,
      };
    }

    return data;
  } catch (error) {
    throw {
      status: error.status || 500,
      message: error.message || "An unexpected error occurred",
      details: error.details,
    };
  }
};

export const loginUser = async (user) => {
  try {
    const response = await fetch("api/auth", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ...user, apiType: "loginUser" }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw {
        status: response.status,
        ...data,
      };
    }

    return data;
  } catch (error) {
    throw {
      status: error.status || 500,
      message: error.message || "An unexpected error occurred",
      details: error.details,
    };
  }
};

export const getPasswordResetLink = async (user) => {
  try {
    const response = await fetch("api/auth", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ...user, apiType: "sendPasswordResetLink" }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw {
        status: response.status,
        ...data,
      };
    }

    return data;
  } catch (error) {
    throw {
      status: error.status || 500,
      message: error.message || "An unexpected error occurred",
      details: error.details,
    };
  }
};

export const validateEmail = async (user) => {
  try {
    const response = await fetch("api/auth", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ...user, apiType: "verifyEmailorTel" }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw {
        status: response.status,
        ...data,
      };
    }

    return data;
  } catch (error) {
    throw {
      status: error.status || 500,
      message: error.message || "An unexpected error occurred",
      details: error.details,
    };
  }
};

export const resendEmailValCode = async (user) => {
  try {
    const response = await fetch("api/auth", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...user,
        apiType: "sendVerificationCodeEmailOrTel",
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw {
        status: response.status,
        ...data,
      };
    }

    return data;
  } catch (error) {
    throw {
      status: error.status || 500,
      message: error.message || "An unexpected error occurred",
      details: error.details,
    };
  }
};
export const refreshAccessToken = async () => {
  try {
    // Make GET request to the API with the necessary query params (e.g., token)
    const response = await fetch(
      `api/auth?apiType=refreshAccessToken&token=YOUR_ACCESS_TOKEN`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw {
        status: response.status,
        ...data,
      };
    }

    return data;
  } catch (error) {
    throw {
      status: error.status || 500,
      message: error.message || "An unexpected error occurred",
      details: error.details,
    };
  }
};

export const logoutUser = async () => {
  try {
    const response = await fetch("api/auth", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ apiType: "logoutUser" }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw {
        status: response.status,
        ...data,
      };
    }

    return data;
  } catch (error) {
    throw {
      status: error.status || 500,
      message: error.message || "An unexpected error occurred",
      details: error.details,
    };
  }
};

export const enterPassCode = async (user) => {
  try {
    const response = await fetch("api/auth", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ...user, apiType: "enterPassCode" }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw {
        status: response.status,
        ...data,
      };
    }

    return data;
  } catch (error) {
    throw {
      status: error.status || 500,
      message: error.message || "An unexpected error occurred",
      details: error.details,
    };
  }
};
