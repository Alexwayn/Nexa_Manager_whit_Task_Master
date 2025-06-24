import { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import {
  EnvelopeIcon,
  KeyIcon,
  CheckCircleIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
} from '@heroicons/react/24/outline';
import { supabase } from '@lib/supabaseClient';
import Logger from '@utils/Logger';
import { useTranslation } from 'react-i18next';

export default function PasswordRecovery({ isOpen, onClose }) {
  const { t } = useTranslation('login');
  const [step, setStep] = useState(1); // 1: Request Reset, 2: Check Email, 3: Reset Password
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Reset form when modal opens/closes
  const handleClose = () => {
    setStep(1);
    setEmail('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setSuccess('');
    setLoading(false);
    onClose();
  };

  // Request password reset
  const handleRequestReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      setStep(2);
      setSuccess(t('passwordRecoveryModal.successEmailSent'));
    } catch (err) {
      Logger.error('Password reset error:', err);
      setError(err.message || t('passwordRecoveryModal.errorSendingEmail'));
    } finally {
      setLoading(false);
    }
  };

  // Handle password reset (called from reset-password page)
  const handlePasswordReset = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setError(t('passwordRecoveryModal.errorPasswordsDontMatch'));
      return;
    }

    if (newPassword.length < 8) {
      setError(t('passwordRecoveryModal.errorPasswordTooShort'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      setSuccess(t('passwordRecoveryModal.successPasswordUpdated'));
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (err) {
      Logger.error('Password update error:', err);
      setError(err.message || t('passwordRecoveryModal.errorUpdatingPassword'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center justify-between mb-4">
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                    {step === 1
                      ? t('passwordRecoveryModal.titleStep1')
                      : step === 2
                        ? t('passwordRecoveryModal.titleStep2')
                        : t('passwordRecoveryModal.titleStep3')}
                  </Dialog.Title>
                  <button
                    onClick={handleClose}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                {/* Error/Success Messages */}
                {error && (
                  <div className="mb-4 p-3 rounded-md bg-red-100 border border-red-200">
                    <div className="flex">
                      <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-red-700">{error}</span>
                    </div>
                  </div>
                )}

                {success && (
                  <div className="mb-4 p-3 rounded-md bg-green-100 border border-green-200">
                    <div className="flex">
                      <CheckCircleIcon className="h-5 w-5 text-green-400 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-green-700">{success}</span>
                    </div>
                  </div>
                )}

                {/* Step 1: Request Reset */}
                {step === 1 && (
                  <form onSubmit={handleRequestReset} className="space-y-4">
                    <div className="text-center mb-6">
                      <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
                        <KeyIcon className="h-6 w-6 text-blue-600" />
                      </div>
                      <p className="text-sm text-gray-600">
                        {t('passwordRecoveryModal.step1Instruction')}
                      </p>
                    </div>

                    <div>
                      <label
                        htmlFor="reset-email"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        {t('passwordRecoveryModal.emailLabel')}
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          id="reset-email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          placeholder={t('passwordRecoveryModal.emailPlaceholder')}
                        />
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        type="button"
                        onClick={handleClose}
                        className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        {t('passwordRecoveryModal.cancel')}
                      </button>
                      <button
                        type="submit"
                        disabled={loading || !email}
                        className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading
                          ? t('passwordRecoveryModal.sending')
                          : t('passwordRecoveryModal.sendLink')}
                      </button>
                    </div>
                  </form>
                )}

                {/* Step 2: Check Email */}
                {step === 2 && (
                  <div className="text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                      <CheckCircleIcon className="h-6 w-6 text-green-600" />
                    </div>
                    <p className="text-sm text-gray-600 mb-6">
                      {t('passwordRecoveryModal.step2Instruction')}{' '}
                      <span className="font-medium text-gray-900">{email}</span>
                    </p>
                    <p className="text-xs text-gray-500 mb-6">
                      {t('passwordRecoveryModal.step2Spam')}
                    </p>
                    <button
                      onClick={handleClose}
                      className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      {t('passwordRecoveryModal.gotIt')}
                    </button>
                  </div>
                )}

                {/* Step 3: Reset Password (for reset-password page) */}
                {step === 3 && (
                  <form onSubmit={handlePasswordReset} className="space-y-4">
                    <div className="text-center mb-6">
                      <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
                        <LockClosedIcon className="h-6 w-6 text-blue-600" />
                      </div>
                      <p className="text-sm text-gray-600">
                        {t('passwordRecoveryModal.step3Instruction')}
                      </p>
                    </div>

                    <div>
                      <label
                        htmlFor="new-password"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        {t('passwordRecoveryModal.newPasswordLabel')}
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <LockClosedIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          id="new-password"
                          type={showPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          required
                          className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          placeholder={t('passwordRecoveryModal.newPasswordPlaceholder')}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                          {showPassword ? (
                            <EyeSlashIcon className="h-5 w-5 text-gray-500" />
                          ) : (
                            <EyeIcon className="h-5 w-5 text-gray-500" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="confirm-password"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        {t('passwordRecoveryModal.confirmPasswordLabel')}
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <LockClosedIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          id="confirm-password"
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          placeholder={t('passwordRecoveryModal.newPasswordPlaceholder')}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                          {showConfirmPassword ? (
                            <EyeSlashIcon className="h-5 w-5 text-gray-500" />
                          ) : (
                            <EyeIcon className="h-5 w-5 text-gray-500" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="flex gap-3 pt-4">
                      <button
                        type="button"
                        onClick={handleClose}
                        className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        {t('passwordRecoveryModal.cancel')}
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading
                          ? t('passwordRecoveryModal.updating')
                          : t('passwordRecoveryModal.updatePassword')}
                      </button>
                    </div>
                  </form>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

// Export a function to open reset password modal in step 3 for use on reset-password page
export function usePasswordRecovery() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1);

  const openModal = (initialStep = 1) => {
    setStep(initialStep);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setStep(1);
  };

  return {
    isOpen,
    openModal,
    closeModal,
    PasswordRecoveryModal: ({ ...props }) => (
      <PasswordRecovery isOpen={isOpen} onClose={closeModal} initialStep={step} {...props} />
    ),
  };
}
