'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Check, Briefcase, CreditCard, Building2, GraduationCap, Users, ShoppingBag, Home, Landmark, HeartHandshake } from 'lucide-react';
import { useRouter } from 'next/navigation';

const OnboardingScreen = () => {
  const [selected, setSelected] = useState(null);
  const router = useRouter();

  const options = [
    {
      id: 'enterprise',
      title: 'Enterprise Business',
      icon: Landmark,
      description: 'Large-scale business operations'
    },
    {
      id: 'business_owner',
      title: 'Business Owner',
      icon: Briefcase,
      description: 'Small to medium business owner'
    },
    {
      id: 'corporate',
      title: 'Corporate Professional',
      icon: Building2,
      description: 'Corporate or government sector'
    },
    {
      id: 'merchant',
      title: 'Merchant / Trader',
      icon: ShoppingBag,
      description: 'Retail or wholesale trade'
    },
    {
      id: 'freelancer',
      title: 'Freelancer',
      icon: CreditCard,
      description: 'Independent contractor'
    },
    {
      id: 'regular',
      title: 'Regular Income',
      icon: HeartHandshake,
      description: 'Steady employment income'
    },
    {
      id: 'student',
      title: 'Student',
      icon: GraduationCap,
      description: 'In education or recent graduate'
    },
    {
      id: 'personal',
      title: 'Personal User',
      icon: Home,
      description: 'Individual transactions'
    }
  ];

  return (
    <div className="min-h-screen bg-white p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="text-center space-y-2 mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">What best describes you?</h1>
          <p className="text-gray-600 text-sm">
            Help us personalize your experience
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-3">
          {options.map((option) => {
            const Icon = option.icon;
            const isSelected = selected === option.id;
            
            return (
              <Card
                key={option.id}
                className={`p-3 cursor-pointer transition-all duration-200 hover:shadow-sm ${
                  isSelected
                    ? 'border border-green-600 bg-green-50/30'
                    : 'border border-gray-200 hover:border-amber-200'
                }`}
                onClick={() => setSelected(option.id)}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-1.5 rounded-lg ${
                    isSelected ? 'bg-green-50' : 'bg-amber-50'
                  }`}>
                    <Icon className={`w-4 h-4 ${
                      isSelected ? 'text-green-600' : 'text-amber-600'
                    }`} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center gap-1">
                      <h3 className="font-medium text-sm text-gray-900 truncate">
                        {option.title}
                      </h3>
                      {isSelected && (
                        <Check className="w-4 h-4 flex-shrink-0 text-green-600" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">
                      {option.description}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        <button
          className={`w-full p-3 rounded-lg font-medium text-sm transition-all duration-200 ${
            selected
              ? 'bg-amber-600 text-white hover:bg-amber-700'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
          onClick={() => router.push('/settingupSecurePin')}
          disabled={!selected}
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default OnboardingScreen;