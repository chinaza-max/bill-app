"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  MessageCircle,
  AlertOctagon,
  Send,
  Book,
  HelpCircle,
  ChevronRight,
  Loader,
} from "lucide-react";
import getErrorMessage from "@/app/component/error";
import ProtectedRoute from "@/app/component/protect";

import { motion } from "framer-motion";
import { useSelector } from "react-redux";
import { toast } from "react-hot-toast";

const SupportPage = () => {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Form states for different support categories
  const [generalInquiry, setGeneralInquiry] = useState("");
  const [issueType, setIssueType] = useState("");
  const [issueDescription, setIssueDescription] = useState("");
  const [suggestion, setSuggestion] = useState("");
  const isAuthenticated = useSelector((state) => state.user.isAuthenticated);

  // Loading states for API calls
  const [isSubmittingGeneral, setIsSubmittingGeneral] = useState(false);
  const [isSubmittingIssue, setIsSubmittingIssue] = useState(false);
  const [isSubmittingSuggestion, setIsSubmittingSuggestion] = useState(false);

  // Get access token from Redux store
  const accessToken = useSelector((state) => state.user.accessToken);

  // Use an effect to check if the user is authenticated but accessToken is null
  useEffect(() => {
    if (isAuthenticated && !accessToken) {
      console.log(
        "Warning: User is authenticated but access token is not available"
      );
    }
  }, [isAuthenticated, accessToken]);

  const handleBack = () => {
    router.push("/home");
  };

  // Helper function to verify accessToken before making requests
  const verifyAccessToken = () => {
    if (!accessToken) {
      toast.error("Authentication error. Please log in again.");
      // Optionally, redirect to login
      // router.push("/login");
      return false;
    }
    return true;
  };

  // API submission functions
  const submitGeneralInquiry = async () => {
    if (!generalInquiry.trim()) {
      toast.error("Please enter your inquiry");
      return;
    }

    if (!verifyAccessToken()) return;

    setIsSubmittingGeneral(true);
    try {
      const response = await fetch("/api/user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accessToken,
          apiType: "submitSupportRequest",
          message: generalInquiry,
          title: "General Inquiry",
          complaintType: "service",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit inquiry");
      }

      const data = await response.json();
      toast.success("Your inquiry has been submitted successfully!");
      setGeneralInquiry("");
      setSelectedCategory(null);
    } catch (error) {
      toast.error("Failed to submit inquiry. Please try again.");
      console.error("Error submitting inquiry:", error);
      getErrorMessage(error, router, "", isAuthenticated);
    } finally {
      setIsSubmittingGeneral(false);
    }
  };

  const submitIssueReport = async () => {
    if (!issueType || issueType === "Select Issue Type") {
      toast.error("Please select an issue type");
      return;
    }

    if (!issueDescription.trim()) {
      toast.error("Please describe the issue");
      return;
    }

    if (!verifyAccessToken()) return;

    setIsSubmittingIssue(true);
    try {
      const response = await fetch("/api/user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accessToken,
          apiType: "submitSupportRequest",
          message: issueDescription,
          title: `Issue Report: ${issueType}`,
          complaintType: "service",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit issue report");
      }

      const data = await response.json();
      toast.success("Your issue report has been submitted successfully!");
      setIssueType("");
      setIssueDescription("");
      setSelectedCategory(null);
    } catch (error) {
      toast.error("Failed to submit issue report. Please try again.");
      console.error("Error submitting issue report:", error);
      getErrorMessage(error, router, "", isAuthenticated);
    } finally {
      setIsSubmittingIssue(false);
    }
  };

  const submitSuggestion = async () => {
    if (!suggestion.trim()) {
      toast.error("Please enter your suggestion");
      return;
    }

    if (!verifyAccessToken()) return;

    setIsSubmittingSuggestion(true);
    try {
      const response = await fetch("/api/user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accessToken,
          apiType: "submitSupportRequest",
          message: suggestion,
          title: "Feature Suggestion",
          complaintType: "service",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit suggestion");
      }

      const data = await response.json();
      toast.success("Your suggestion has been submitted successfully!");
      setSuggestion("");
      setSelectedCategory(null);
    } catch (error) {
      toast.error("Failed to submit suggestion. Please try again.");
      console.error("Error submitting suggestion:", error);
      getErrorMessage(error, router, "", isAuthenticated);
    } finally {
      setIsSubmittingSuggestion(false);
    }
  };

  const Section = ({ title, children }) => (
    <div className="mb-6">
      <h2 className="text-sm font-medium text-emerald-700 px-4 mb-2">
        {title}
      </h2>
      <div className="bg-white rounded-lg shadow-sm">{children}</div>
    </div>
  );

  const SupportCategories = [
    {
      icon: MessageCircle,
      title: "General Inquiry",
      subtitle: "Ask about our services",
      path: "/userProfile/support/general",
      content: (
        <div className="p-4 space-y-3">
          <input
            type="text"
            className="w-full border border-amber-200 rounded-lg p-3 focus:ring-2 focus:ring-emerald-500"
            placeholder="Title (Optional)"
          />
          <textarea
            className="w-full border border-amber-200 rounded-lg p-3 h-32 focus:ring-2 focus:ring-emerald-500"
            placeholder="Type your general inquiry here..."
            value={generalInquiry}
            onChange={(e) => setGeneralInquiry(e.target.value)}
          />
          <button
            className="w-full bg-emerald-500 text-white py-2 rounded-lg hover:bg-emerald-600 flex items-center justify-center"
            onClick={submitGeneralInquiry}
            disabled={isSubmittingGeneral || !accessToken}
          >
            {isSubmittingGeneral ? (
              <>
                <Loader className="animate-spin h-4 w-4 mr-2" />
                Sending...
              </>
            ) : !accessToken ? (
              "Please wait..."
            ) : (
              "Send Inquiry"
            )}
          </button>
        </div>
      ),
    },
    {
      icon: AlertOctagon,
      title: "Report Issue",
      subtitle: "Technical problems or bugs",
      path: "/support/report-issue",
      content: (
        <div className="p-4 space-y-3">
          <input
            type="text"
            className="w-full border border-amber-200 rounded-lg p-3 focus:ring-2 focus:ring-emerald-500"
            placeholder="Title (Optional)"
          />
          <select
            className="w-full border border-amber-200 rounded-lg p-3"
            value={issueType}
            onChange={(e) => setIssueType(e.target.value)}
          >
            <option>Select Issue Type</option>
            <option>App Crash</option>
            <option>Payment Problem</option>
            <option>Login Issues</option>
            <option>Other Technical Issue</option>
          </select>
          <textarea
            className="w-full border border-amber-200 rounded-lg p-3 h-32 focus:ring-2 focus:ring-emerald-500"
            placeholder="Describe the issue in detail..."
            value={issueDescription}
            onChange={(e) => setIssueDescription(e.target.value)}
          />
          <button
            className="w-full bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 flex items-center justify-center"
            onClick={submitIssueReport}
            disabled={isSubmittingIssue || !accessToken}
          >
            {isSubmittingIssue ? (
              <>
                <Loader className="animate-spin h-4 w-4 mr-2" />
                Submitting...
              </>
            ) : !accessToken ? (
              "Please wait..."
            ) : (
              "Submit Issue Report"
            )}
          </button>
        </div>
      ),
    },
    {
      icon: Send,
      title: "Submit Suggestion",
      subtitle: "Help us improve",
      path: "/support/suggestions",
      content: (
        <div className="p-4 space-y-3">
          <input
            type="text"
            className="w-full border border-amber-200 rounded-lg p-3 focus:ring-2 focus:ring-emerald-500"
            placeholder="Title (Optional)"
          />
          <textarea
            className="w-full border border-amber-200 rounded-lg p-3 h-32 focus:ring-2 focus:ring-emerald-500"
            placeholder="Share your ideas to improve our service..."
            value={suggestion}
            onChange={(e) => setSuggestion(e.target.value)}
          />
          <button
            className="w-full bg-emerald-500 text-white py-2 rounded-lg hover:bg-emerald-600 flex items-center justify-center"
            onClick={submitSuggestion}
            disabled={isSubmittingSuggestion || !accessToken}
          >
            {isSubmittingSuggestion ? (
              <>
                <Loader className="animate-spin h-4 w-4 mr-2" />
                Sending...
              </>
            ) : !accessToken ? (
              "Please wait..."
            ) : (
              "Send Suggestion"
            )}
          </button>
        </div>
      ),
    },
    {
      icon: Book,
      title: "Frequently Asked Questions",
      subtitle: "Quick answers to common questions",
      path: "/support/faqs",
      content: (
        <div className="p-4 space-y-3">
          <div className="border-b border-amber-200 pb-2">
            <h3 className="font-medium text-amber-900">
              How do I reset my password?
            </h3>
            <p className="text-sm text-amber-600">
              Go to Settings `{">"}` Security`{">"}` Reset Password
            </p>
          </div>
          <div className="border-b border-amber-200 pb-2">
            <h3 className="font-medium text-amber-900">
              How can I update my profile?
            </h3>
            <p className="text-sm text-amber-600">
              Navigate to Profile `{">"}` Edit Profile
            </p>
          </div>
          <a href="#" className="text-emerald-600 text-sm hover:underline">
            View All FAQs
          </a>
        </div>
      ),
    },
  ];

  const MenuItem = ({ icon: Icon, title, subtitle, path, highlight }) => (
    <motion.button
      whileTap={{ scale: 0.98 }}
      className="w-full flex items-center justify-between p-4 border-b border-amber-100 last:border-0 hover:bg-emerald-50/30"
      onClick={() => {
        if (path === "/userProfile/support/moreSupport") {
          router.push(path);
        } else {
          setSelectedCategory(
            selectedCategory ===
              SupportCategories.findIndex((cat) => cat.path === path)
              ? null
              : SupportCategories.findIndex((cat) => cat.path === path)
          );
        }
      }}
    >
      <div className="flex items-center space-x-3">
        <div
          className={`w-8 h-8 rounded-full ${
            highlight ? "bg-emerald-50" : "bg-amber-50"
          } flex items-center justify-center`}
        >
          <Icon
            className={`h-5 w-5 ${
              highlight ? "text-emerald-600" : "text-amber-600"
            }`}
          />
        </div>
        <div className="text-left">
          <div className="text-amber-900 font-medium">{title}</div>
          {subtitle && (
            <div
              className={`text-sm ${
                highlight ? "text-emerald-600" : "text-amber-500"
              }`}
            >
              {subtitle}
            </div>
          )}
        </div>
      </div>
      <ChevronRight
        className={`h-5 w-5 ${
          highlight ? "text-emerald-400" : "text-amber-400"
        }`}
      />
    </motion.button>
  );

  return (
    <ProtectedRoute>
      <div className="flex flex-col h-screen bg-amber-50">
        {/* Top Navigation */}
        <div className="bg-gradient-to-r from-amber-600 to-amber-500 text-white px-4 py-3">
          <div className="flex items-center space-x-3">
            <ArrowLeft
              className="h-6 w-6 cursor-pointer"
              onClick={handleBack}
            />
            <h1 className="text-lg font-semibold">Support & Help</h1>
          </div>
        </div>

        {/* Main Content - Scrollable */}
        <div className="flex-1 overflow-auto py-4">
          <Section title="Support Options">
            {SupportCategories.map((category, index) => (
              <MenuItem
                key={index}
                icon={category.icon}
                title={category.title}
                subtitle={category.subtitle}
                path={category.path}
                highlight={index === selectedCategory}
              />
            ))}
          </Section>

          {/* Expanded Category Content */}
          {selectedCategory !== null && (
            <div className="p-4 m-4 bg-white rounded-lg shadow-md">
              <h2 className="text-lg font-semibold text-amber-900 mb-3">
                {SupportCategories[selectedCategory]?.title}
              </h2>
              {SupportCategories[selectedCategory]?.content}
            </div>
          )}

          {/* Additional Support */}
          <Section title="More Support">
            <MenuItem
              icon={HelpCircle}
              title="Contact Support Team"
              subtitle="Direct help from our experts"
              path="/userProfile/support/moreSupport"
              highlight={false}
            />
          </Section>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default SupportPage;
