"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  getDecryptedData,
} from "../utils/encryption";


export function useAuthRedirect() {
  const pathname = usePathname();
  const router = useRouter();



  useEffect(() => {

    // 1. Check if user has logged in before (example: email or token in localStorage)
    const storedEmail = getDecryptedData("emailEncrypt");
   // const lastVisited = localStorage.getItem("lastVisited");

    const authPages = ["/onboarding", "/sign-up", "/login"];
     
    console.log("Current Pathname:", pathname);
    console.log("Current Pathname:", pathname);
    console.log("Current Pathname:", pathname);

    // If user already logged in and is on auth page, move them to secure login
    if (storedEmail && authPages.includes(pathname)) {
      router.replace("/secureInput");
      return;
    }

    // 2. Track where user is inside the app (after login)
    const protectedPages = ["/dashboard", "/profile", "/settings"]; // adjust for your app
    if (protectedPages.some((p) => pathname.startsWith(p))) {
      localStorage.setItem("lastVisited", pathname);
    }
  }, [pathname, router]);

  // Helper: function to continue where left off
  const continueWhereLeft = () => {
    const lastVisited = localStorage.getItem("lastVisited");
    if (lastVisited) {
      router.replace(lastVisited);
    } else {
      router.replace("/dashboard"); // fallback
    }
  };

  return { continueWhereLeft };
}
