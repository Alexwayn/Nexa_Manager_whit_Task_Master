import { useState } from 'react';
import { supabase } from '@lib/supabaseClient';
import { useAuth } from '@context/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  AtSymbolIcon,
  LockClosedIcon,
  UserIcon as UserOutlineIcon,
  ArrowRightIcon,
  EyeIcon,
  EyeSlashIcon,
  PhoneIcon,
  BuildingOffice2Icon,
  IdentificationIcon,
  CheckIcon,
  QuestionMarkCircleIcon,
  InformationCircleIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';
import {
  UserCircleIcon,
  StarIcon,
  CheckCircleIcon as CheckCircleSolidIcon,
  UsersIcon,
  DocumentTextIcon,
  DevicePhoneMobileIcon,
  CreditCardIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/solid';
import nexaLogo from '@assets/logo_nexa.png';
import PasswordRecovery from '@components/PasswordRecovery';
import Logger from '@utils/Logger';

export default function Login() {
  const { user } = useAuth();
  const location = useLocation();
  const { t } = useTranslation('login');
  // Get the URL from which the user was redirected (if available)
  const from = location.state?.returnTo || '/dashboard';
  const [tab, setTab] = useState('login'); // 'login' | 'register'

  // Login States
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Register States
  const [registerStep, setRegisterStep] = useState(1); // 1, 2, 3
  const [email, setEmail] = useState(''); // Shared email for register step 1
  const [password, setPassword] = useState(''); // Shared password for register step 3
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [vatNumber, setVatNumber] = useState(''); // P.IVA
  const [username, setUsername] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);

  // Common States
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [showPasswordRecovery, setShowPasswordRecovery] = useState(false);

  if (user) return <Navigate to={from} replace />;

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    });
    if (error) setError(t('errors.invalidCredentials'));
    setLoading(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!acceptTerms) {
      setError(t('errors.termsRequired'));
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Sign up the user - the trigger will handle profile creation
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // Pass data needed by the trigger in metadata
          data: {
            username: username,
            full_name: fullName,
            phone: phone || null,
            business_type: businessType || null,
            vat_number: vatNumber || null,
            // The trigger currently uses username and full_name
            // Modify trigger if you need phone, business_type, vat_number immediately
          },
        },
      });

      if (signUpError) throw signUpError;

      // No need to manually insert into profiles here anymore!

      setSuccess(t('success.registration'));
    } catch (err) {
      Logger.error(t('log.registrationError'), err);
      // Check for specific duplicate username error if needed
      if (
        err.message &&
        err.message.includes(
          'duplicate key value violates unique constraint "profiles_username_key"',
        )
      ) {
        setError(t('errors.usernameExists'));
      } else {
        setError(err.message || t('errors.registrationFailed'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSocial = async (provider) => {
    // Social login likely bypasses multi-step registration
    setLoading(true);
    setError('');
    try {
      await supabase.auth.signInWithOAuth({ provider });
    } catch (e) {
      setError(t('errors.socialLogin'));
    }
    setLoading(false);
  };

  const handleDemo = async () => {
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({
      email: 'demo@nexa.com',
      password: 'demo1234',
    });
    if (error) setError(error.message);
    setLoading(false);
  };

  const nextStep = () => setRegisterStep((prev) => Math.min(prev + 1, 3));
  const prevStep = () => setRegisterStep((prev) => Math.max(prev - 1, 1));

  const MarketingSection = () => (
    <div className="hidden lg:flex lg:w-3/5 bg-gradient-to-br from-indigo-50 via-white to-blue-50 items-center justify-center p-12 relative overflow-hidden">
      {/* Subtle background shapes (optional) */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-blue-100 rounded-full opacity-30 -translate-x-16 -translate-y-16"></div>
      <div className="absolute bottom-0 right-0 w-72 h-72 bg-indigo-100 rounded-full opacity-30 translate-x-16 translate-y-16"></div>

      <div className="z-10 w-full max-w-2xl">
        {/* Badge */}
        <span className="inline-block bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full mb-4">
          {t('marketing.badge')}
        </span>

        {/* Logo Image instead of Text Title */}
        <img src={nexaLogo} alt={t('marketing.logoAlt')} className="h-16 mb-6" />

        {/* Description */}
        <p className="text-lg text-gray-600 mb-8">
          {t('marketing.description.main')}
          <span className="text-blue-600 font-semibold">
            {' '}
            {t('marketing.description.highlight')}
          </span>
          {t('marketing.description.main_after')}
        </p>

        {/* Stats Section */}
        <div className="grid grid-cols-3 gap-8 mb-12 text-center">
          <div>
            <UsersIcon className="h-8 w-8 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-semibold text-gray-800">5.000+</p>
            <p className="text-sm text-gray-500">{t('marketing.stats.users')}</p>
          </div>
          <div>
            <CheckCircleSolidIcon className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-semibold text-gray-800">99.9%</p>
            <p className="text-sm text-gray-500">{t('marketing.stats.uptime')}</p>
          </div>
          <div>
            <StarIcon className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
            <p className="text-2xl font-semibold text-gray-800">4.8/5</p>
            <p className="text-sm text-gray-500">{t('marketing.stats.reviews')}</p>
          </div>
        </div>

        {/* Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Feature 1 */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 text-center">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
              <UsersIcon className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">{t('marketing.feature1.title')}</h3>
            <p className="text-sm text-gray-500">{t('marketing.feature1.description')}</p>
            {/* Optional sub-text */}
            <p className="text-xs text-gray-400 mt-3 flex items-center justify-center gap-1">
              <UserOutlineIcon className="h-3 w-3" /> {t('marketing.feature1.stats')}
            </p>
          </div>
          {/* Feature 2 */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 text-center">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
              <DocumentTextIcon className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">{t('marketing.feature2.title')}</h3>
            <p className="text-sm text-gray-500">{t('marketing.feature2.description')}</p>
            {/* Optional sub-text */}
            <p className="text-xs text-gray-400 mt-3 flex items-center justify-center gap-1">
              <CalendarDaysIcon className="h-3 w-3" /> {t('marketing.feature2.stats')}
            </p>
          </div>
          {/* Feature 3 */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 text-center">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
              <DevicePhoneMobileIcon className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">{t('marketing.feature3.title')}</h3>
            <p className="text-sm text-gray-500">{t('marketing.feature3.description')}</p>
            {/* Optional sub-text */}
            <p className="text-xs text-gray-400 mt-3 flex items-center justify-center gap-1">
              <StarIcon className="h-3 w-3" /> {t('marketing.feature3.stats')}
            </p>
          </div>
        </div>

        {/* Final CTA Section */}
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-1">{t('marketing.cta.title')}</h3>
            <p className="text-sm text-gray-500">{t('marketing.cta.description')}</p>
          </div>
          <div className="text-right ml-6 flex-shrink-0">
            <button className="bg-blue-600 text-white font-semibold py-2 px-5 rounded-md hover:bg-blue-700 transition text-sm mb-2">
              {t('marketing.cta.button')}
            </button>
            <p className="text-xs text-gray-500 flex items-center justify-end gap-1">
              <CreditCardIcon className="h-3 w-3" /> {t('marketing.cta.noCard')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderRegisterStep = () => {
    const StepIndicator = ({ step, currentStep }) => {
      const isActive = step === currentStep;
      const isCompleted = step < currentStep;
      return (
        <div
          className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${isActive ? 'border-blue-600 bg-blue-600 text-white' : isCompleted ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300 text-gray-400'}`}
        >
          {isCompleted ? <CheckIcon className="w-5 h-5" /> : step}
        </div>
      );
    };

    const StepLine = ({ completed }) => (
      <div className={`flex-1 h-0.5 ${completed ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
    );

    return (
      <form
        onSubmit={
          registerStep === 3
            ? handleRegister
            : (e) => {
                e.preventDefault();
                nextStep();
              }
        }
        className="space-y-5"
      >
        <h2 className="text-2xl font-semibold text-center text-gray-800 mb-2">
          {t('register.title')}
        </h2>
        <p className="text-center text-gray-500 mb-6 text-sm">{t('register.subtitle')}</p>

        {/* Tabs (Same as before) */}
        <div className="flex mb-6 bg-gray-100 rounded-md p-1">
          <button
            type="button"
            className={`flex-1 py-2 text-sm font-medium rounded-md transition ${tab === 'login' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:bg-gray-200'}`}
            onClick={() => {
              setTab('login');
              setError('');
              setSuccess('');
              setRegisterStep(1); /* Reset step */
            }}
          >
            {t('tabs.login')}
          </button>
          <button
            type="button"
            className={`flex-1 py-2 text-sm font-medium rounded-md transition ${tab === 'register' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:bg-gray-200'}`}
            onClick={() => {
              setTab('register');
              setError('');
              setSuccess('');
            }}
          >
            {t('tabs.register')}
          </button>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center mb-8 px-4">
          <StepIndicator step={1} currentStep={registerStep} />
          <StepLine completed={registerStep > 1} />
          <StepIndicator step={2} currentStep={registerStep} />
          <StepLine completed={registerStep > 2} />
          <StepIndicator step={3} currentStep={registerStep} />
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="bg-red-100 border border-red-200 text-red-700 px-4 py-2 rounded mb-4 text-sm text-center">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-100 border border-green-200 text-green-700 px-4 py-2 rounded mb-4 text-sm text-center">
            {success}
          </div>
        )}

        {registerStep === 1 && (
          <>
            <h3 className="text-lg font-medium text-center text-gray-700 mb-4">
              {t('register.steps.1')}
            </h3>
            {/* Full Name */}
            <div>
              <label
                htmlFor="fullName"
                className="block text-sm font-medium text-gray-700 mb-1 flex items-center"
              >
                {t('register.fullName.label')}{' '}
                <QuestionMarkCircleIcon className="h-4 w-4 text-gray-400 ml-1" />
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <UserOutlineIcon className="h-5 w-5" />
                </span>
                <input
                  id="fullName"
                  type="text"
                  placeholder={t('register.fullName.placeholder')}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-300 text-sm"
                />
              </div>
            </div>
            {/* Email */}
            <div>
              <label
                htmlFor="email-register"
                className="block text-sm font-medium text-gray-700 mb-1 flex items-center"
              >
                {t('register.email.label')}{' '}
                <QuestionMarkCircleIcon className="h-4 w-4 text-gray-400 ml-1" />
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <AtSymbolIcon className="h-5 w-5" />
                </span>
                <input
                  id="email-register"
                  type="email"
                  placeholder={t('register.email.placeholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-300 text-sm"
                />
              </div>
            </div>
            {/* Phone */}
            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-gray-700 mb-1 flex items-center"
              >
                {t('register.phone.label')}{' '}
                <span className="text-xs text-gray-400 ml-1">{t('register.phone.optional')}</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <PhoneIcon className="h-5 w-5" />
                </span>
                <input
                  id="phone"
                  type="tel"
                  placeholder={t('register.phone.placeholder')}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-300 text-sm"
                />
              </div>
            </div>
          </>
        )}

        {registerStep === 2 && (
          <>
            <h3 className="text-lg font-medium text-center text-gray-700 mb-4">
              {t('register.steps.2')}
            </h3>
            {/* Business Type */}
            <div>
              <label
                htmlFor="businessType"
                className="block text-sm font-medium text-gray-700 mb-1 flex items-center"
              >
                {t('register.businessType.label')}{' '}
                <span className="text-xs text-gray-400 ml-1">{t('register.phone.optional')}</span>{' '}
                <QuestionMarkCircleIcon className="h-4 w-4 text-gray-400 ml-1" />
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <BuildingOffice2Icon className="h-5 w-5" />
                </span>
                <input
                  id="businessType"
                  type="text"
                  placeholder={t('register.businessType.placeholder')}
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-300 text-sm"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500 flex items-start gap-1">
                <InformationCircleIcon className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                <span>{t('register.businessType.help')}</span>
              </p>
            </div>
            {/* VAT Number */}
            <div>
              <label htmlFor="vatNumber" className="block text-sm font-medium text-gray-700 mb-1">
                {t('register.vatNumber.label')}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <IdentificationIcon className="h-5 w-5" />
                </span>
                <input
                  id="vatNumber"
                  type="text"
                  placeholder={t('register.vatNumber.placeholder')}
                  value={vatNumber}
                  onChange={(e) => setVatNumber(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-300 text-sm"
                />
              </div>
            </div>
          </>
        )}

        {registerStep === 3 && (
          <>
            <h3 className="text-lg font-medium text-center text-gray-700 mb-4">
              {t('register.steps.3')}
            </h3>
            {/* Username */}
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-700 mb-1 flex items-center"
              >
                {t('register.username.label')}{' '}
                <QuestionMarkCircleIcon className="h-4 w-4 text-gray-400 ml-1" />
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <UserOutlineIcon className="h-5 w-5" />
                </span>
                <input
                  id="username"
                  type="text"
                  placeholder={t('register.username.placeholder')}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-300 text-sm"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">{t('register.username.help')}</p>
            </div>
            {/* Password */}
            <div>
              <label
                htmlFor="password-register"
                className="block text-sm font-medium text-gray-700 mb-1 flex items-center"
              >
                {t('register.password.label')}{' '}
                <QuestionMarkCircleIcon className="h-4 w-4 text-gray-400 ml-1" />
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <LockClosedIcon className="h-5 w-5" />
                </span>
                <input
                  id="password-register"
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t('register.password.placeholder')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-300 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">{t('register.password.help')}</p>
            </div>
            {/* Terms Checkbox */}
            <div className="flex items-center">
              <input
                id="acceptTerms"
                name="acceptTerms"
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="acceptTerms" className="ml-2 block text-sm text-gray-900">
                {t('register.terms.text')}{' '}
                <a
                  href="/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-blue-600 hover:underline"
                >
                  {t('register.terms.link')}
                </a>
              </label>
            </div>
          </>
        )}

        {/* Navigation Buttons */}
        <div
          className={`flex ${registerStep > 1 ? 'justify-between' : 'justify-end'} items-center pt-4`}
        >
          {registerStep > 1 && (
            <button
              type="button"
              onClick={prevStep}
              className="flex items-center gap-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md px-4 py-2 hover:bg-gray-50 transition"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              {t('register.buttons.back')}
            </button>
          )}
          {registerStep < 3 && (
            <button
              type="button" // Changed to type="button" to prevent form submission
              onClick={nextStep}
              className="flex items-center gap-1 text-sm font-medium text-white bg-blue-600 rounded-md px-4 py-2 hover:bg-blue-700 transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {t('register.buttons.next')}
              <ArrowRightIcon className="h-4 w-4" />
            </button>
          )}
          {registerStep === 3 && (
            <button
              type="submit"
              disabled={!acceptTerms || loading}
              className={`flex items-center gap-1 text-sm font-medium text-white rounded-md px-4 py-2 transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${!acceptTerms || loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
            >
              {loading ? t('register.buttons.completing') : t('register.buttons.complete')}
              {!loading && <CheckIcon className="h-4 w-4" />}
            </button>
          )}
        </div>

        {/* Link to switch tabs */}
        <div className="text-center mt-6 text-sm">
          <span className="text-gray-500">{t('register.hasAccount')}</span>{' '}
          <button
            type="button"
            className="font-medium text-blue-600 hover:underline"
            onClick={() => {
              setTab('login');
              setError('');
              setSuccess('');
              setRegisterStep(1);
            }}
          >
            {t('register.signInLink')}
          </button>
        </div>
      </form>
    );
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      <MarketingSection />

      <div className="w-full lg:w-2/5 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-8">
            {/* Render Login Form or Register Steps */}
            {tab === 'login' && (
              <>
                <div className="flex justify-center mb-4">
                  <UserCircleIcon className="h-16 w-16 text-gray-300" />
                </div>
                <h2 className="text-2xl font-semibold text-center text-gray-800 mb-2">
                  {t('title')}
                </h2>
                <p className="text-center text-gray-500 mb-6 text-sm">{t('subtitle')}</p>

                {/* Tabs */}
                <div className="flex mb-6 bg-gray-100 rounded-md p-1">
                  <button
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition ${tab === 'login' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:bg-gray-200'}`}
                    onClick={() => {
                      setTab('login');
                      setError('');
                      setSuccess('');
                    }}
                  >
                    {t('tabs.login')}
                  </button>
                  <button
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition ${tab === 'register' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:bg-gray-200'}`}
                    onClick={() => {
                      setTab('register');
                      setError('');
                      setSuccess('');
                      setRegisterStep(1);
                    }}
                  >
                    {t('tabs.register')}
                  </button>
                </div>

                {/* Error/Success Messages */}
                {error && (
                  <div className="bg-red-100 border border-red-200 text-red-700 px-4 py-2 rounded mb-4 text-sm text-center">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="bg-green-100 border border-green-200 text-green-700 px-4 py-2 rounded mb-4 text-sm text-center">
                    {success}
                  </div>
                )}

                {/* Login Form */}
                <form onSubmit={handleLogin} className="space-y-5">
                  <div>
                    <label
                      htmlFor="email-login"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      {t('email')}
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                        <UserOutlineIcon className="h-5 w-5" />
                      </span>
                      <input
                        id="email-login"
                        type="email"
                        placeholder={t('placeholders.email')}
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        required
                        autoComplete="username"
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-300 text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="password-login"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      {t('password')}
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                        <LockClosedIcon className="h-5 w-5" />
                      </span>
                      <input
                        id="password-login"
                        type={showPassword ? 'text' : 'password'}
                        placeholder={t('placeholders.password')}
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                        autoComplete="current-password"
                        className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-300 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? (
                          <EyeSlashIcon className="h-5 w-5" />
                        ) : (
                          <EyeIcon className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-blue-600 text-white font-semibold py-2.5 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition flex items-center justify-center gap-2 text-sm"
                    disabled={loading}
                  >
                    {loading ? t('buttons.loading') : t('buttons.signIn')}
                    {!loading && <ArrowRightIcon className="h-4 w-4" />}
                  </button>
                </form>

                {/* Password Recovery Link */}
                <div className="text-center mt-4">
                  <button
                    type="button"
                    onClick={() => setShowPasswordRecovery(true)}
                    className="text-sm text-blue-600 hover:text-blue-800 underline"
                  >
                    {t('forgotPassword')}
                  </button>
                </div>

                {/* Divider, Social, Demo buttons (same as before but maybe adjust spacing/styles if needed) */}
                <div className="flex items-center my-6">
                  <div className="flex-grow border-t border-gray-200"></div>
                  <span className="mx-3 text-gray-400 text-xs font-medium">
                    {t('social.divider')}
                  </span>
                  <div className="flex-grow border-t border-gray-200"></div>
                </div>
                <div className="space-y-3">
                  <button
                    onClick={() => handleSocial('google')}
                    className="w-full flex items-center justify-center gap-3 border border-gray-300 rounded-md py-2 px-4 hover:bg-gray-50 transition text-sm font-medium text-gray-700"
                    disabled={loading}
                  >
                    <img
                      src="https://www.svgrepo.com/show/475656/google-color.svg"
                      alt="Google"
                      className="h-5 w-5 object-contain"
                    />
                    {t('social.google')}
                  </button>
                  <button
                    onClick={() => handleSocial('apple')}
                    className="w-full flex items-center justify-center gap-3 border border-gray-300 rounded-md py-2 px-4 hover:bg-gray-50 transition text-sm font-medium text-gray-700"
                    disabled={loading}
                  >
                    <img
                      src="https://www.svgrepo.com/show/508841/apple.svg"
                      alt="Apple"
                      className="h-5 w-5 object-contain"
                    />
                    {t('social.apple')}
                  </button>
                </div>
                <button
                  onClick={handleDemo}
                  className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-md py-2 px-4 mt-4 hover:bg-gray-50 text-sm font-medium text-gray-700 transition"
                  disabled={loading}
                >
                  <UserOutlineIcon className="h-5 w-5" />
                  {t('buttons.demo')}
                </button>

                {/* Link to switch tabs */}
                <div className="text-center mt-6 text-sm">
                  <span className="text-gray-500">{t('noAccount')}</span>{' '}
                  <button
                    className="font-medium text-blue-600 hover:underline"
                    onClick={() => {
                      setTab('register');
                      setError('');
                      setSuccess('');
                      setRegisterStep(1);
                    }}
                  >
                    {t('createAccount')}
                  </button>
                </div>
              </>
            )}

            {tab === 'register' && renderRegisterStep()}
          </div>
        </div>
      </div>

      {/* Password Recovery Modal */}
      <PasswordRecovery
        isOpen={showPasswordRecovery}
        onClose={() => setShowPasswordRecovery(false)}
      />
    </div>
  );
}
