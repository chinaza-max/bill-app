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
      description: 'Large-scale business operations or corporate entity',
    },
    {
      id: 'business_owner',
      title: 'Business Owner',
      icon: Briefcase,
      description: 'Small to medium business owner or entrepreneur',
   
    },
    {
      id: 'corporate',
      title: 'Corporate Professional',
      icon: Building2,
      description: 'Employed in corporate or government sector',
   
    },
    {
      id: 'merchant',
      title: 'Merchant / Trader',
      icon: ShoppingBag,
      description: 'Retail or wholesale trade business owner',
    
    },
    {
      id: 'freelancer',
      title: 'Freelancer / Self-Employed',
      icon: CreditCard,
      description: 'Independent contractor or self-employed professional'
    },
    {
      id: 'regular',
      title: 'Regular Income Earner',
      icon: HeartHandshake,
      description: 'Steady income from employment or pension'
    },
    {
      id: 'student',
      title: 'Student / Youth',
      icon: GraduationCap,
      description: 'Currently in education or recent graduate'
    },
    {
      id: 'personal',
      title: 'Personal User',
      icon: Home,
      description: 'Individual user for personal transactions'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-amber-100 p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="text-center space-y-3">
          <h1 className="text-3xl font-bold text-amber-900">What best describes you?</h1>
          <p className="text-amber-700">
            Help us personalize your experience and match you with suitable transaction partners
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {options.map((option) => {
            const Icon = option.icon;
            const isSelected = selected === option.id;
            
            return (
              <Card
                key={option.id}
                className={`p-4 cursor-pointer transition-all duration-200 hover:shadow-lg ${
                  isSelected
                    ? 'border-2 border-green-500 bg-amber-50'
                    : 'border border-amber-200 hover:border-amber-300'
                }`}
                onClick={() => setSelected(option.id)}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-full ${
                    isSelected ? 'bg-green-100' : 'bg-amber-100'
                  }`}>
                    <Icon className={`w-6 h-6 ${
                      isSelected ? 'text-green-600' : 'text-amber-600'
                    }`} />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold text-amber-900">
                        {option.title}
                      </h3>
                      {isSelected && (
                        <Check className="w-5 h-5 text-green-500" />
                      )}
                    </div>
                    <p className="text-sm text-amber-700 mt-1">
                      {option.description}
                    </p>
                   
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        <button
          className={`w-full p-4 rounded-lg font-medium transition-all duration-200 ${
            selected
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-amber-200 text-amber-700 cursor-not-allowed'
          }`}
          onClick={()=>   router.push('/validation-email')}
          disabled={!selected}
        >

          Continue
          
        </button>
      </div>
    </div>
  );
};

export default OnboardingScreen;