import axios from "axios";

const axiosInstance = axios.create({
  baseURL:
    process.env.NEXT_PUBLIC_DOMAIN + "/api/v1" ||
    `http://localhost:5000/api/v1`,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // This ensures cookies are sent with each request
});

export default axiosInstance;
