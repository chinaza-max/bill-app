import axios from "axios";

const axiosInstance = axios.create({
  baseURL:
    process.env.NEXT_PUBLIC_API_URL || "https://fidopoint.onrender.com/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

export default axiosInstance;
