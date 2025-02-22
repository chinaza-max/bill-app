import axios from "axios";

console.log("process.env.NEXT_PUBLIC_DOMAIN");
console.log("process.env.NEXT_PUBLIC_DOMAIN");
console.log("process.env.NEXT_PUBLIC_DOMAIN");
console.log("process.env.NEXT_PUBLIC_DOMAIN");

const axiosInstance = axios.create({
  baseURL: `https://fidopoint.onrender.com/api/v1`,
  headers: {
    "Content-Type": "application/json",
  },
});

export default axiosInstance;
