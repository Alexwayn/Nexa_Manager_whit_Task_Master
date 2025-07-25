import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth, useUser } from '@clerk/clerk-react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ErrorBoundary from '@components/common/ErrorBoundary';
import { businessService } from '@lib/businessService';
import {
  BuildingOfficeIcon,
  UserCircleIcon,
  MapPinIcon,
  PhoneIcon,
  CreditCardIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import nexaLogo from '../../../assets/logos/logo_nexa.png';

export default function Onboarding() {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const navigate = useNavigate();
  const { t } = useTranslation('common');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    trigger,
    getValues,
  } = useForm({
    defaultValues: {
      companyName: '',
      businessType: '',
      industry: '',
      taxId: '',
      website: '',
      phone: '',
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'Italy',
      },
      employeeCount: '',
      description: '',
    },
  });

  // If user is not signed in, redirect to login
  if (isLoaded && !isSignedIn) {
    return <Navigate to='/login' replace />;
  }

  // Check if user has already completed onboarding
  useEffect(() => {
    if (user?.unsafeMetadata?.onboardingComplete) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  // Show loading while Clerk initializes
  if (!isLoaded) {
    return (
      <div className='flex justify-center items-center h-screen'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
        <p className='ml-3 text-blue-600'>Loading...</p>
      </div>
    );
  }

  const onSubmit = async data => {
    setIsSubmitting(true);
    try {
      // Save business data to Supabase
      const businessData = {
        user_id: user.id,
        company_name: data.companyName,
        business_type: data.businessType,
        industry: data.industry,
        tax_id: data.taxId,
        website: data.website,
        phone: data.phone,
        address: data.address,
        employee_count: data.employeeCount,
        description: data.description,
        onboarding_complete: true,
      };

      const result = await businessService.createBusinessProfile(businessData);

      if (result.error) {
        throw new Error(`Failed to create business profile: ${String(result?.error?.message || result?.error || 'Unknown error')}`);
      }

      // Update Clerk user metadata using the correct method
      try {
        await user.update({
          unsafeMetadata: {
            ...user.unsafeMetadata,
            onboardingComplete: true,
            companyName: data.companyName,
            businessType: data.businessType,
          },
        });
      } catch (clerkError) {
        console.warn('Clerk metadata update failed, but business profile was saved:', clerkError);
        // Continue anyway since the business profile was saved successfully
      }

      // Redirect to dashboard
      navigate('/dashboard', { replace: true });
    } catch (error) {
      console.error('Error completing onboarding:', error);

      // Show more specific error messages
      let errorMessage = 'There was an error saving your business information. Please try again.';

      if (error.message?.includes('business profile already exists')) {
        errorMessage =
          'A business profile already exists for your account. Redirecting to dashboard...';
        setTimeout(() => navigate('/dashboard', { replace: true }), 2000);
      } else if (error.message?.includes('duplicate key')) {
        errorMessage = 'A business profile with this information already exists.';
      } else if (error.message?.includes('network')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      }

      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = async () => {
    const fieldsToValidate = getFieldsForStep(currentStep);
    const isValid = await trigger(fieldsToValidate);

    if (isValid) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const getFieldsForStep = step => {
    switch (step) {
      case 1:
        return ['companyName', 'businessType', 'industry'];
      case 2:
        return ['address.street', 'address.city', 'address.state', 'address.zipCode', 'phone'];
      case 3:
        return ['taxId', 'employeeCount'];
      default:
        return [];
    }
  };

  const StepIndicator = () => (
    <div className='flex items-center justify-center mb-8'>
      {[1, 2, 3].map(step => (
        <div key={step} className='flex items-center'>
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step <= currentStep ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}
          >
            {step}
          </div>
          {step < 3 && (
            <div
              className={`w-16 h-1 mx-2 ${step < currentStep ? 'bg-blue-600' : 'bg-gray-200'}`}
            />
          )}
        </div>
      ))}
    </div>
  );

  const Step1Content = () => (
    <div className='space-y-6'>
      <div className='text-center mb-6'>
        <BuildingOfficeIcon className='h-12 w-12 text-blue-600 mx-auto mb-2' />
        <h2 className='text-2xl font-bold text-gray-900'>Company Information</h2>
        <p className='text-gray-600'>Tell us about your business</p>
      </div>

      <div>
        <label className='block text-sm font-medium text-gray-700 mb-2'>Company Name *</label>
        <input
          type='text'
          {...register('companyName', { required: 'Company name is required' })}
          className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
          placeholder='Your Company Name'
        />
        {errors.companyName && (
          <p className='text-red-500 text-sm mt-1'>{errors.companyName.message}</p>
        )}
      </div>

      <div>
        <label className='block text-sm font-medium text-gray-700 mb-2'>Business Type *</label>
        <select
          {...register('businessType', { required: 'Business type is required' })}
          className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
        >
          <option value=''>Select business type</option>
          <option value='sole_proprietorship'>Sole Proprietorship</option>
          <option value='partnership'>Partnership</option>
          <option value='corporation'>Corporation</option>
          <option value='llc'>LLC</option>
          <option value='nonprofit'>Non-Profit</option>
          <option value='other'>Other</option>
        </select>
        {errors.businessType && (
          <p className='text-red-500 text-sm mt-1'>{errors.businessType.message}</p>
        )}
      </div>

      <div>
        <label className='block text-sm font-medium text-gray-700 mb-2'>Industry *</label>
        <select
          {...register('industry', { required: 'Industry is required' })}
          className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
        >
          <option value=''>Select industry</option>
          <option value='technology'>Technology</option>
          <option value='healthcare'>Healthcare</option>
          <option value='finance'>Finance</option>
          <option value='retail'>Retail</option>
          <option value='manufacturing'>Manufacturing</option>
          <option value='consulting'>Consulting</option>
          <option value='education'>Education</option>
          <option value='real_estate'>Real Estate</option>
          <option value='hospitality'>Hospitality</option>
          <option value='other'>Other</option>
        </select>
        {errors.industry && <p className='text-red-500 text-sm mt-1'>{errors.industry.message}</p>}
      </div>
    </div>
  );

  const Step2Content = () => (
    <div className='space-y-6'>
      <div className='text-center mb-6'>
        <MapPinIcon className='h-12 w-12 text-blue-600 mx-auto mb-2' />
        <h2 className='text-2xl font-bold text-gray-900'>Contact Information</h2>
        <p className='text-gray-600'>Where can we reach you?</p>
      </div>

      <div>
        <label className='block text-sm font-medium text-gray-700 mb-2'>Street Address *</label>
        <input
          type='text'
          {...register('address.street', { required: 'Street address is required' })}
          className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
          placeholder='123 Main Street'
        />
        {errors.address?.street && (
          <p className='text-red-500 text-sm mt-1'>{errors.address.street.message}</p>
        )}
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2'>City *</label>
          <input
            type='text'
            {...register('address.city', { required: 'City is required' })}
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
            placeholder='Rome'
          />
          {errors.address?.city && (
            <p className='text-red-500 text-sm mt-1'>{errors.address.city.message}</p>
          )}
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2'>State/Province *</label>
          <input
            type='text'
            {...register('address.state', { required: 'State is required' })}
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
            placeholder='Lazio'
          />
          {errors.address?.state && (
            <p className='text-red-500 text-sm mt-1'>{errors.address.state.message}</p>
          )}
        </div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2'>ZIP/Postal Code *</label>
          <input
            type='text'
            {...register('address.zipCode', { required: 'ZIP code is required' })}
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
            placeholder='00100'
          />
          {errors.address?.zipCode && (
            <p className='text-red-500 text-sm mt-1'>{errors.address.zipCode.message}</p>
          )}
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2'>Country</label>
          <select
            {...register('address.country')}
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
          >
            <option value='Italy'>Italy</option>
            <option value='United States'>United States</option>
            <option value='Germany'>Germany</option>
            <option value='France'>France</option>
            <option value='Spain'>Spain</option>
            <option value='Other'>Other</option>
          </select>
        </div>
      </div>

      <div>
        <label className='block text-sm font-medium text-gray-700 mb-2'>Phone Number *</label>
        <input
          type='tel'
          {...register('phone', { required: 'Phone number is required' })}
          className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
          placeholder='+39 123 456 7890'
        />
        {errors.phone && <p className='text-red-500 text-sm mt-1'>{errors.phone.message}</p>}
      </div>
    </div>
  );

  const Step3Content = () => (
    <div className='space-y-6'>
      <div className='text-center mb-6'>
        <CreditCardIcon className='h-12 w-12 text-blue-600 mx-auto mb-2' />
        <h2 className='text-2xl font-bold text-gray-900'>Business Details</h2>
        <p className='text-gray-600'>Final details to complete your profile</p>
      </div>

      <div>
        <label className='block text-sm font-medium text-gray-700 mb-2'>Tax ID / VAT Number</label>
        <input
          type='text'
          {...register('taxId')}
          className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
          placeholder='IT12345678901'
        />
      </div>

      <div>
        <label className='block text-sm font-medium text-gray-700 mb-2'>Website</label>
        <input
          type='url'
          {...register('website')}
          className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
          placeholder='https://yourcompany.com'
        />
      </div>

      <div>
        <label className='block text-sm font-medium text-gray-700 mb-2'>Number of Employees</label>
        <select
          {...register('employeeCount')}
          className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
        >
          <option value=''>Select employee count</option>
          <option value='1'>Just me</option>
          <option value='2-10'>2-10 employees</option>
          <option value='11-50'>11-50 employees</option>
          <option value='51-200'>51-200 employees</option>
          <option value='201-500'>201-500 employees</option>
          <option value='500+'>500+ employees</option>
        </select>
      </div>

      <div>
        <label className='block text-sm font-medium text-gray-700 mb-2'>Business Description</label>
        <textarea
          {...register('description')}
          rows={4}
          className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
          placeholder='Tell us about what your business does...'
        />
      </div>
    </div>
  );

  const getStepContent = () => {
    switch (currentStep) {
      case 1:
        return <Step1Content />;
      case 2:
        return <Step2Content />;
      case 3:
        return <Step3Content />;
      default:
        return <Step1Content />;
    }
  };

  return (
    <ErrorBoundary>
      <div className='min-h-screen bg-gray-50 flex items-center justify-center p-4'>
        <div className='max-w-2xl w-full bg-white rounded-lg shadow-xl p-8'>
          {/* Header */}
          <div className='text-center mb-8'>
            <img src={nexaLogo} alt='Nexa Manager' className='h-12 mx-auto mb-4' />
            <h1 className='text-3xl font-bold text-gray-900 mb-2'>Welcome to Nexa Manager!</h1>
            <p className='text-gray-600'>Let's set up your business profile to get started</p>
          </div>

          {/* Step Indicator */}
          <StepIndicator />

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)}>
            {getStepContent()}

            {/* Navigation Buttons */}
            <div className='flex justify-between items-center mt-8 pt-6 border-t border-gray-200'>
              <button
                type='button'
                onClick={prevStep}
                disabled={currentStep === 1}
                className={`px-6 py-2 rounded-md text-sm font-medium ${
                  currentStep === 1
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                Previous
              </button>

              <div className='text-sm text-gray-500'>
                Step {currentStep} of {totalSteps}
              </div>

              {currentStep < totalSteps ? (
                <button
                  type='button'
                  onClick={nextStep}
                  className='px-6 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                >
                  Next
                </button>
              ) : (
                <button
                  type='submit'
                  disabled={isSubmitting}
                  className='px-6 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center'
                >
                  {isSubmitting ? (
                    <>
                      <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></div>
                      Completing Setup...
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className='h-4 w-4 mr-2' />
                      Complete Setup
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </ErrorBoundary>
  );
}
