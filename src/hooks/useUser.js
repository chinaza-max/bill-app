import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateUser, updatePin, userData } from "@/services/userService";

export const useUpdateUser = () => {
  return useMutation({
    mutationFn: updateUser,
    onSuccess: () => {},
    onError: (error) => {
      // Handle error
    },
  });
};

export const useUpdatePin = () => {
  return useMutation({
    mutationFn: updatePin,
    onSuccess: () => {},
    onError: (error) => {
      // Handle error
    },
  });
};

/*
export const useEnterPassCode = () => {
  return useMutation({
    mutationFn: enterPassCode,
    onSuccess: () => {},
    onError: (error) => {
      // Handle error
    },
  });
};*/

export const useUserData = (responseFunc) => {
  return useMutation({
    mutationFn: userData,
    onSuccess: (data) => {
      responseFunc(data);
    },
    onError: (error) => {
      // Handle error
    },
  });
};
