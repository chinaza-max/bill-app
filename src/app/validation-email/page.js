'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const OTPValidation = () => {
  const [otp, setOtp] = useState(["","","","","",""]);
  const inputRefs = [
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
  ];
  const router = useRouter();

  const validationSchema = Yup.object().shape({
    otp: Yup.string()
      .length(6, "OTP must be exactly 6 digits")
      .matches(/^[0-9]+$/, "OTP must contain only numbers")
      .required("OTP is required"),
  });

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('OTP submitted:', values.otp);
    } catch (error) {
      console.error('Validation error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();
    const numbers = pastedData.replace(/\D/g, '');
    
    if (numbers.length >= 6) {
      const newOtp = numbers.slice(0, 6).split("");
      setOtp(newOtp);
      inputRefs[5].current.focus();
      
      const formValue = { otp: newOtp.join('') };
      if (validationSchema.isValidSync(formValue)) {
        handleSubmit(formValue, { setSubmitting: () => {} });
      }
    }
  };

  const handleChange = (index, value) => {
    if (/^\d*$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      if (value !== '') {
        if (index < 5) {
          inputRefs[index + 1].current.focus();
        } else {
          inputRefs[index].current.blur();
        }
      }

      if (newOtp.every(digit => digit !== '') && newOtp.join('').length === 6) {
        const formValue = { otp: newOtp.join('') };
        if (validationSchema.isValidSync(formValue)) {
          handleSubmit(formValue, { setSubmitting: () => {} });
        }
      }
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!otp[index]) {
        if (index > 0) {
          const newOtp = [...otp];
          newOtp[index - 1] = '';
          setOtp(newOtp);
          inputRefs[index - 1].current.focus();
        }
      } else {
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs[index - 1].current.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs[index + 1].current.focus();
    }
  };

  useEffect(() => {
    inputRefs[0].current.focus();
  }, []);

  return (
    <div className="min-h-screen bg-amber-50 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-sm w-full space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-amber-900 mb-2">
            Verify Your Email
          </h1>
          <p className="text-sm text-amber-700 mb-6">
            We have sent a verification code to your email address.<br />
            Please enter the code below.
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border border-amber-200">
          <Formik
            initialValues={{ otp: '' }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ isSubmitting }) => (
              <Form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-amber-800 mb-2 text-center">
                    Enter Verification Code
                  </label>
                  <div 
                    className="flex justify-center space-x-1 sm:space-x-2"
                    onPaste={handlePaste}
                  >
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        ref={inputRefs[index]}
                        type="text"
                        inputMode="numeric"
                        pattern="\d*"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        className="w-9 h-10 sm:w-10 sm:h-11 text-center text-lg font-semibold border border-amber-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-amber-50"
                        autoComplete="off"
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-center">
                  <button
                    type="button"
                    className="text-green-600 hover:text-green-800 text-xs sm:text-sm font-medium focus:outline-none"
                    onClick={() => {}}
                  >
                    Did not receive the code? Resend
                  </button>
                </div>

                <button
                  type="submit"       
                  onClick={() => router.push('/settingupSecurePin')}
                  disabled={isSubmitting || otp.join("").length !== 6}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <div className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Verifying...
                    </div>
                  ) : (
                    "Verify Email"
                  )}
                </button>

                <div className="text-center text-xs sm:text-sm">
                  <Link href="/sign-in" className="text-green-600 hover:text-green-800">
                    Back to Sign In
                  </Link>
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </div>
    </div>
  );
};

export default OTPValidation;