"use client";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { clearSensitiveData } from "../../store/slice"; // Adjust the path as necessary
import { decryptData, encryptUserData } from "../../utils/data-encryption";

const useVisibility = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        const userDataEn = localStorage.getItem("userData");

        if (userDataEn) {
          const userDataDe = decryptData(userDataEn);
          userDataDe.isPasscodeEntered = false;
          userDataDe.isAuthenticated = true;
          userDataDe.accessToken = "";
          const encryptedDatas = encryptUserData(stateData);
          localStorage.setItem("userData", encryptedDatas);
        }

        dispatch(clearSensitiveData({ keepAuthenticated: true }));
      }
    };

    // Adding event listener to detect visibility changes
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Cleanup event listener on component unmount
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [dispatch]);
};

export default useVisibility;
