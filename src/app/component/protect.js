// app/protected/layout.js
"use client";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { useState, useEffect } from "react";
import { decryptData } from "../../utils/data-encryption";
import { useUserData } from "@/hooks/useUser";
import { useDispatch } from "react-redux";
import { setUser } from "@/store/slice";

const ProtectedLayout = ({ children }) => {
  const router = useRouter();
  const [accessToken, setAccessToken] = useState();
  const dispatch = useDispatch();

  const { mutate, isLoading, isError, error, isSuccess } = useUserData(
    async (data) => {
      dispatch(
        setUser({
          user: data.data.data,
          accessToken: accessToken,
          isAuthenticated: true,
        })
      );
    }
  );

  const { isAuthenticated, isPasscodeEntered } = useSelector(
    (state) => state.user
  );

  /*
  if (isAuthenticated) {
    console.log(isAuthenticated);
    console.log(isPasscodeEntered);
    const userDataEn = localStorage.getItem("userData");
    const userDataDe = decryptData(userDataEn);

    console.log(userDataDe);
  
    try {
      mutate({
        accessToken: userDataDe.accessToken,
      });
    } catch (error) {
     
      console.error("Login error:", error);
    } finally {
    
    }
  }*/

  useEffect(() => {
    if (isAuthenticated) {
      const userDataEn = localStorage.getItem("userData");
      if (userDataEn) {
        const userDataDe = decryptData(userDataEn);
        // Only trigger mutate when there's an access token available

        setAccessToken(userDataDe.accessToken);
        mutate({
          accessToken: userDataDe.accessToken,
        });
      }
    }
  }, [isAuthenticated, mutate]);

  useEffect(() => {
    // Redirect to sign-in if not authenticated
    if (!isAuthenticated) {
      router.push("/sign-in");
    } else if (!isPasscodeEntered) {
      router.push("/secureInput");
    }
  }, [isAuthenticated, isPasscodeEntered]);

  useEffect(() => {
    console.log(error);
  }, [error]);
  // If not authenticated or passcode not entered, don't render children
  if (!isAuthenticated || !isPasscodeEntered) {
    return null; // You can show a loading spinner or something in this case
  }

  return <>{children}</>;
};

export default ProtectedLayout;
