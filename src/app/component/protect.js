"use client";
import { useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { useState, useEffect } from "react";
import { decryptData } from "../../utils/data-encryption";
import { setUser, setPasscodeStatus } from "@/store/slice";
import getErrorMessage from "@/app/component/error";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const ProtectedLayout = ({ children }) => {
  const router = useRouter();
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const { isAuthenticated, isPasscodeEntered } = useSelector(
    (state) => state.user
  );

  // State to store decrypted user data from localStorage
  const [localUserData, setLocalUserData] = useState(null);

  // Load and decrypt user data from localStorage on mount
  useEffect(() => {
    const userDataEn = localStorage.getItem("userData");

    if (userDataEn) {
      const userDataDe = decryptData(userDataEn);

      console.log(userDataDe);
      const fetchUserData = async () => {
        const response = await fetch(
          `/api/user?apiType=userData&token=${userDataDe.accessToken}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        console.log(response);
        if (!response.ok) {
          const data = await response.json();

          console.log(userDataDe?.isAuthenticated);
          getErrorMessage(data, router, "", userDataDe?.isAuthenticated);

          throw {
            status: response.status,
            message: data.message || "An unexpected error occurred",
            details: data.details,
          };
        }

        const userData = await response.json();

        console.log(userData);
        dispatch(
          setUser({
            user: userData.data.data,
            accessToken: userDataDe.accessToken,
            isAuthenticated: true,
          })
        );

        if (userDataDe?.isPasscodeEntered !== true) {
          router.push("/secureInput");
        }

        //return response.json();
      };
      fetchUserData();
      //setLocalUserData(userDataDe);
    } else if (!isAuthenticated) {
      router.push("/sign-in");
    } else {
      router.push("/sign-in");
    }
  }, [isAuthenticated, router]);

  /*
  // Fetch user data query function
  const fetchUserData = async () => {
    console.log(localUserData.accessToken);
    const response = await fetch(
      `/api/user?apiType=userData&token=${localUserData.accessToken}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const data = await response.json();
      throw {
        status: response.status,
        message: data.message || "An unexpected error occurred",
        details: data.details,
      };
    }

    return response.json();
  };

  // Use React Query to fetch user data
  const {
    data: userData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["userData", localUserData?.accessToken],
    queryFn: fetchUserData,
    enabled: !!localUserData?.accessToken && !isAuthenticated,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    retry: 1, // Only retry once on failure
  });
*/
  /*
  // Update Redux state when user data is fetched
  useEffect(() => {
    console.log(userData);
    console.log(localUserData);
    if (userData) {
      dispatch(
        setUser({
          user: userData.data.data,
          accessToken: localUserData?.accessToken,
          isAuthenticated: true,
        })
      );

      /* dispatch(
        setPasscodeStatus({
          isPasscodeEntered: localUserData?.isPasscodeEntered === true,
        })
      );

      if (localUserData?.isPasscodeEntered !== true) {
        router.push("/secureInput");
      }
    }
  }, [userData, localUserData, dispatch, router]);
*/
  // Handle errors
  /*
  useEffect(() => {
    if (isError && error) {
      getErrorMessage(error, router, "", localUserData?.isAuthenticated);
    }
  }, [isError, error, router, localUserData]);
*/
  // Show loading or redirect if not authenticated
  /*if (isLoading) {
    return <div>Loading...</div>; // Add a proper loading component
  }*/

  // If not authenticated or passcode not entered, don't render children

  return <>{children}</>;
};

export default ProtectedLayout;
