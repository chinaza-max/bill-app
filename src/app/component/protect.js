// app/protected/layout.js
"use client";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { useState, useEffect } from "react";
import { decryptData } from "../../utils/data-encryption";
import { useUserData } from "@/hooks/useUser";
import { useDispatch } from "react-redux";
import { setUser, setPasscodeStatus } from "@/store/slice";
import getErrorMessage from "@/app/component/error";

const ProtectedLayout = ({ children }) => {
  const router = useRouter();
  const [accessToken, setAccessToken] = useState();
  const [isPasscodeEntered2, setIsPasscodeEntered2] = useState();

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

      dispatch(
        setPasscodeStatus({
          isPasscodeEntered: isPasscodeEntered2,
        })
      );

      if (!isPasscodeEntered2) {
        router.push("/secureInput");
      }
    }
  );

  const { isAuthenticated, isPasscodeEntered } = useSelector(
    (state) => state.user
  );

  useEffect(() => {
    if (!isAuthenticated) {
      const userDataEn = localStorage.getItem("userData");
      if (userDataEn) {
        const userDataDe = decryptData(userDataEn);

        if (!userDataDe.isAuthenticated) {
          router.push("/sign-in");
        }

        const setIsPasscodeEntered2B =
          userDataDe.isPasscodeEntered == true ? true : false;
        setIsPasscodeEntered2(setIsPasscodeEntered2B);

        setAccessToken(userDataDe.accessToken);

        mutate({
          accessToken: userDataDe.accessToken,
        });
      }
    }
  }, [isAuthenticated, mutate]);

  useEffect(() => {
    const userDataEn = localStorage.getItem("userData");
    if (userDataEn) {
      const userDataDe = decryptData(userDataEn);

      getErrorMessage(error, router, "", userDataDe.isAuthenticated);
    } else {
      getErrorMessage(error, router);
    }
  }, [error]);
  // If not authenticated or passcode not entered, don't render children
  if (!isAuthenticated || !isPasscodeEntered) {
    return null; // You can show a loading spinner or something in this case
  }

  return <>{children}</>;
};

export default ProtectedLayout;
