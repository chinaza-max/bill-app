import axiosInstance from "@/utils/axiosInstance";

export const registerUser = async (user) => {
  return await axiosInstance.post("/auth/registerUser", user);
};

export const loginUser = async (credentials) => {
  return await axiosInstance.post("/auth", credentials);
};

export const logoutUser = async () => {
  return await axiosInstance.post("/auth");
};
