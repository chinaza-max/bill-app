import { useState, useCallback } from "react";

const useRequest = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [errorDetail, setErrorDetail] = useState(null);

  const [loading, setLoading] = useState(false);

  const request = useCallback(async (url, method = "GET", body = null) => {
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const options = {
        method,
        headers: {},
      };

      /*if (method === "POST" && body) {
        options.body = JSON.stringify(body);
      }*/

      if (method !== "GET" && body) {
        if (body instanceof FormData) {
          console.log("ssssssssssssss");
          console.log(body);
          console.log("sssssssssssssss");
          options.body = body; // Let browser set Content-Type
        } else {
          console.log("body");
          console.log(body);
          console.log("body");

          options.headers["Content-Type"] = "application/json";
          options.body = JSON.stringify(body);
        }
      }

      const res = await fetch(url, options);
      const result = await res.json();
      console.log(result);
      if (!res.ok) {
        setErrorDetail(result.details || "Something went wrong");

        throw new Error(result.message || "Request failed");
      }

      setData(result);
      return result;
    } catch (err) {
      setError(err.message || "Something went wrong");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, error, loading, request, errorDetail };
};

export default useRequest;
