'use client';

import React from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import Link from 'next/link';
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

const SignUpForm = () => {
  const initialValues = {
    firstName: '',
    lastName: '',
    phoneNumber: '',
    password: '',
    dateOfBirth: '',
    acceptTerms: false,
  };

  const validationSchema = Yup.object().shape({
    firstName: Yup.string()
      .required('First name is required')
      .min(2, 'First name must be at least 2 characters'),
    lastName: Yup.string()
      .required('Last name is required')
      .min(2, 'Last name must be at least 2 characters'),
    phoneNumber: Yup.string()
      .required('Phone number is required')
      .matches(/^[0-9]{10}$/, 'Phone number must be 10 digits'),
    password: Yup.string()
      .required('Password is required')
      .min(8, 'Password must be at least 8 characters')
      .matches(/[a-zA-Z]/, 'Password must contain at least one letter')
      .matches(/[0-9]/, 'Password must contain at least one number'),
    dateOfBirth: Yup.date()
      .required('Date of birth is required')
      .max(new Date(), 'Date of birth cannot be in the future'),
    acceptTerms: Yup.boolean()
      .oneOf([true], 'You must accept the terms and conditions'),
  });

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log(values);
    } catch (error) {
      console.error('Submission error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
            Create Your Account
          </h1>
          <p className="text-sm text-gray-600 mb-8">
            Fill in your information below or register with your social account
          </p>
        </div>

        <div className="bg-white p-8 rounded-lg shadow-md">
          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ isSubmitting, errors, touched, setFieldValue }) => (
              <Form className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      onChange={(e) => setFieldValue('firstName', e.target.value)}
                      className={`${
                        errors.firstName && touched.firstName
                          ? 'border-red-500'
                          : ''
                      }`}
                    />
                    <ErrorMessage
                      name="firstName"
                      component="div"
                      className="text-xs text-red-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      onChange={(e) => setFieldValue('lastName', e.target.value)}
                      className={`${
                        errors.lastName && touched.lastName
                          ? 'border-red-500'
                          : ''
                      }`}
                    />
                    <ErrorMessage
                      name="lastName"
                      component="div"
                      className="text-xs text-red-500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    name="phoneNumber"
                    type="tel"
                    onChange={(e) => setFieldValue('phoneNumber', e.target.value)}
                    className={`${
                      errors.phoneNumber && touched.phoneNumber
                        ? 'border-red-500'
                        : ''
                    }`}
                  />
                  <ErrorMessage
                    name="phoneNumber"
                    component="div"
                    className="text-xs text-red-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    onChange={(e) => setFieldValue('password', e.target.value)}
                    className={`${
                      errors.password && touched.password
                        ? 'border-red-500'
                        : ''
                    }`}
                  />
                  <ErrorMessage
                    name="password"
                    component="div"
                    className="text-xs text-red-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Input
                    id="dateOfBirth"
                    name="dateOfBirth"
                    type="date"
                    onChange={(e) => setFieldValue('dateOfBirth', e.target.value)}
                    className={`${
                      errors.dateOfBirth && touched.dateOfBirth
                        ? 'border-red-500'
                        : ''
                    }`}
                  />
                  <ErrorMessage
                    name="dateOfBirth"
                    component="div"
                    className="text-xs text-red-500"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="acceptTerms"
                    name="acceptTerms"
                    onCheckedChange={(checked) => 
                      setFieldValue('acceptTerms', checked)
                    }
                  />
                  <Label htmlFor="acceptTerms" className="text-sm">
                    I accept the terms and conditions
                  </Label>
                </div>
                <ErrorMessage
                  name="acceptTerms"
                  component="div"
                  className="text-xs text-red-500"
                />

                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing up...
                    </>
                  ) : (
                    'Sign Up'
                  )}
                </Button>

                <div className="text-center text-sm">
                  Already have an account?{' '}
                  <Link href="/sign-in" className="text-blue-600 hover:text-blue-800">
                    Login
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

export default SignUpForm;