import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  registerUser /*, loginUser, logoutUser */,
} from "@/services/authService";

export const useRegister = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: registerUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (error) => {
      // Handle error
    },
  });

  return mutation;
};

/*
export const useLogin = () => {
  const queryClient = useQueryClient();

  return useMutation(loginUser, {
    onSuccess: () => {
      // Refetch user data after login
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
};

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
