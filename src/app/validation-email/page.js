'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import Link from 'next/link';

const OTPValidation = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const inputRefs = [
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
  ];

  const validationSchema = Yup.object().shape({
    otp: Yup.string()
      .length(6, 'OTP must be exactly 6 digits')
      .matches(/^[0-9]+$/, 'OTP must contain only numbers')
      .required('OTP is required'),
  });

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('OTP submitted:', values.otp);
    } catch (error) {
      console.error('Validation error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle paste event
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    
    // Check if pasted content is a 6-digit number
    if (/^\d{6}$/.test(pastedData)) {
      const newOtp = pastedData.split('');
      setOtp(newOtp);
      
      // Auto submit after successful paste
      const formValue = { otp: pastedData };
      if (validationSchema.isValidSync(formValue)) {
        handleSubmit(formValue, { setSubmitting: () => {} });
      }
    }
  };

  // Handle input change
  const handleChange = (index, value) => {
    if (/^\d?$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      // Move to next input if value is entered
      if (value && index < 5) {
        inputRefs[index + 1].current.focus();
      }

      // Auto submit if all fields are filled
      if (newOtp.every(digit => digit !== '') && newOtp.join('').length === 6) {
        const formValue = { otp: newOtp.join('') };
        if (validationSchema.isValidSync(formValue)) {
          handleSubmit(formValue, { setSubmitting: () => {} });
        }
      }
    }
  };

  // Handle backspace
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs[index - 1].current.focus();
    }
  };

  // Focus first input on mount
  useEffect(() => {
    inputRefs[0].current.focus();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
            Verify Your Email
          </h1>
          <p className="text-sm text-gray-600 mb-8">
            We've sent a verification code to your email address.<br />
            Please enter the code below.
          </p>
        </div>

        <div className="bg-white p-8 rounded-lg shadow-md">
          <Formik
            initialValues={{ otp: '' }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ isSubmitting }) => (
              <Form className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
                    Enter Verification Code
                  </label>
                  <div 
                    className="flex justify-center space-x-2"
                    onPaste={handlePaste}
                  >
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        ref={inputRefs[index]}
                        type="text"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        className="w-12 h-12 text-center text-xl font-semibold border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-center">
                  <button
                    type="button"
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium focus:outline-none"
                    onClick={() => {
                      console.log('Resending OTP...');
                      // Add resend logic here
                    }}
                  >
                    Didn't receive the code? Resend
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || otp.join('').length !== 6}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
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
                    'Verify Email'
                  )}
                </button>

                <div className="text-center text-sm">
                  <Link href="/sign-in" className="text-blue-600 hover:text-blue-800">
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