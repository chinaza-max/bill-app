import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  registerUser,
  loginUser /*logoutUser ,*/,
  getPasswordResetLink,
  validateEmail,
  resendEmailValCode,
  refreshAccessToken,
  enterPassCode,
} from "@/services/authService";

export const useRegister = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: registerUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (error) => {
      // Handle error
    },
  });
};

export const useLogin = (responseFunc) => {
  return useMutation({
    mutationFn: loginUser,
    onSuccess: (data) => {
      responseFunc(data);
    },
    onError: (error) => {
      console.log(error);
      // Handle error
    },
  });
};

export const useGetPasswordResetLink = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: getPasswordResetLink,
    onSuccess: (data) => {
      console.log(data);
      // Refetch user data after login
      //queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (error) => {
      console.log(error);
      // Handle error
    },
  });
};

export const useValidateEmail = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: validateEmail,
    onSuccess: (data) => {},
    onError: (error) => {
      console.log(error);
      // Handle error
    },
  });
};

export const useRefreshAccessToken = () => {
  return useMutation({
    mutationFn: refreshAccessToken,
    onSuccess: (data) => {
      console.log(data);
    },
    onError: (error) => {
      console.log(error);
      // Handle error
    },
  });
};

export const useResendEmailValCode = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: resendEmailValCode,
    onSuccess: (data) => {
      console.log(data);
      // Refetch user data after login
      //queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (error) => {
      console.log(error);
      // Handle error
    },
  });
};

export const useEnterPassCode = (responseFunc) => {
  return useMutation({
    mutationFn: enterPassCode,
    onSuccess: (data) => {
      responseFunc(data);
    },
    onError: (error) => {
      // Handle error
    },
  });
};

/*
export const useLogout = () => {
  const queryClient = useQueryClient();

  return useMutation(logoutUser, {
    onSuccess: () => {
      // Remove cached user data on logout
      queryClient.removeQueries({ queryKey: ["users"] });
    },
  });
};
*/
