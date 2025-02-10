import axiosInstance from "@/utils/axiosInstance";

export const getUsers = async () => {
  const response = await axiosInstance.get("/users");
  return response.data;
};

export const createUser = async (user) => {
  const response = await axiosInstance.post("/users", user);
  return response.data;
};
