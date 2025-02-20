export const updateUser = async (user) => {
  try {
    const response = await fetch("api/user", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ...user, apiType: "updateUser" }),
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

export const updatePin = async (user) => {
  try {
    const response = await fetch("api/user", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ...user, apiType: "updatePin" }),
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

export const userData = async (user) => {
  try {
    const response = await fetch(
      `api/user?apiType=userData&token=${user.accessToken}`,
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
