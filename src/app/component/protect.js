"use client";
import { useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { useState, useEffect } from "react";
import { decryptData } from "../../utils/data-encryption";
import { setUser } from "@/store/slice";
import getErrorMessage from "@/app/component/error";

const ProtectedLayout = ({ children }) => {
  const router = useRouter();
  const dispatch = useDispatch();
  const { isAuthenticated, accessToken } = useSelector((state) => state.user);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      const userDataEn = localStorage.getItem("userData");

      if (!userDataEn) {
        router.push("/sign-in");
        return;
      }

      const userDataDe = decryptData(userDataEn);

      try {
        const response = await fetch(
          `/api/user?apiType=userData&token=${userDataDe.accessToken}`
        );

        console.log("userDataDe", userDataDe);
        console.log("response.ok", response.ok);

        if (!response.ok) {
          const data = await response.json();

          getErrorMessage(data, router, "", userDataDe?.isAuthenticated);
          //throw new Error(data.message || "Unexpected error");
        }

        const userData = await response.json();

        dispatch(
          setUser({
            user: userData.data.data,
            accessToken: userDataDe.accessToken,
            isAuthenticated: true,
          })
        );

        if (!userDataDe?.isPasscodeEntered) {
          router.push("/secureInput");
        }
      } catch (error) {
        // console.error("Fetch error:", error);
        //router.push("/sign-in");
      } finally {
        setLoading(false);
      }
    };

    if (!accessToken) {
      fetchUserData();
    } else {
      setLoading(false);
    }
  }, [dispatch, router]);

  // ⏳ **Show loading state until user data is ready**
  if (loading)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-amber-50">
        <div className="flex flex-col items-center space-y-4">
          {/* Emoji and loading spinner */}
          <div className="flex flex-col items-center">
            <span className="text-4xl mb-2">✨</span>
            <div className="w-12 h-12 border-4 border-amber-200 rounded-full animate-spin border-t-amber-600"></div>
          </div>

          {/* Loading message with amber accent */}
          <p className="text-amber-800 text-xl font-medium">
            Setting up your account...
          </p>
          <p className="text-amber-600 text-sm">
            Please wait while we prepare your experience
          </p>
        </div>
      </div>
    );

  return <>{children}</>;
};

export default ProtectedLayout;
