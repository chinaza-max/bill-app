const getErrorMessage = (
  error,
  router,
  email,
  isPasscodeEntered,
  currentPath
) => {
  if (!error) return null;

  console.log(error);
  console.log(isPasscodeEntered);

  if (error?.details === "Invalid token.") {
    if (isPasscodeEntered) {
      router.push(`/secureInput`);
    } else {
      setTimeout(() => {
        router.push(`/sign-in`);
      }, 2000);
      return error?.details;
    }
  }

  console.log(error);
  //Authentication failed

  if (error?.details?.includes("No token")) {
    if (isPasscodeEntered) {
      router.push(`/secureInput`);
    } else {
      setTimeout(() => {
        router.push(`/sign-in`);
      }, 2000);
      return error?.details;
    }
  }

  if (error?.details === "Invalid pass code") {
    return error?.details;
  }

  if (error?.message === "Invalid request") {
    return error?.details;
  }

  if (error?.details === "Conflicts") {
    return error?.details;
  }

  if (error?.message === "Internal server error") {
    if (error?.details.includes("email")) {
      return error?.details;
    }
  }

  if (error?.message === "Resource not found") {
    return error?.details;
  }

  if (error?.details === "Your email is not verified yet") {
    setTimeout(() => {
      router.push(`/validation-email`);
    }, 3000);
    // Cleanup the timeout when the component unmounts
    return error?.details + " you will be redirect to do so";
  }

  // Handle axios error response structure
  if (error.response?.data?.message) {
    if (error.response?.data?.message === "Your email is not verified yet") {
      setTimeout(() => {
        router.push(`/validation-email`);
      }, 3000);
      // Cleanup the timeout when the component unmounts
      return error.response.data.message + " you will be redirect to do so";
    }
    return error.response.data.message;
  }
  if (error?.response?.data) {
    return error?.response?.data;
  }

  if (error.response?.data?.errors[0]?.message) {
    return error.response?.data?.errors[0].message;
  }

  // Handle other error formats your server might return
  if (error.message) {
    return error.message;
  }

  return "An unexpected error occurred";
};

export default getErrorMessage;
