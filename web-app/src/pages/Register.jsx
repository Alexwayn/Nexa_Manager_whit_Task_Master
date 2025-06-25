import { useEffect } from 'react';
import { SignUp, useAuth } from '@clerk/clerk-react';
import { Navigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ErrorBoundary from '@components/common/ErrorBoundary';
import {
  ChartBarIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
  CloudIcon,
  CurrencyEuroIcon,
  UserGroupIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import nexaLogo from '@assets/logo_nexa_footer.png';

const Register = () => {
  const { isSignedIn } = useAuth();
  const location = useLocation();
  const { t } = useTranslation();

  useEffect(() => {
    document.title = 'NexaManager - Registrazione';
  }, []);

  if (isSignedIn) {
    return <Navigate to={location.state?.from || '/dashboard'} replace />;
  }

  // Professional features list
  const features = [
    {
      icon: ChartBarIcon,
      title: 'Analytics Avanzate',
      description: 'Dashboard real-time e insights predittivi'
    },
    {
      icon: DocumentTextIcon,
      title: 'Gestione Documenti',
      description: 'OCR intelligente e archiviazione cloud sicura'
    },
    {
      icon: ShieldCheckIcon,
      title: 'Sicurezza Enterprise',
      description: 'Crittografia end-to-end e backup automatici'
    },
    {
      icon: CloudIcon,
      title: 'Cloud-Native',
      description: 'Accesso ovunque, sincronizzazione istantanea'
    },
    {
      icon: CurrencyEuroIcon,
      title: 'Conformità Fiscale',
      description: 'Sempre aggiornato con le normative UE'
    },
    {
      icon: UserGroupIcon,
      title: 'Multi-Utente',
      description: 'Collaborazione team con controlli granulari'
    }
  ];

  // Pricing plans
  const plans = [
    { users: '1-5 utenti', price: '€29/mese' },
    { users: '6-20 utenti', price: '€79/mese' },
    { users: '20+ utenti', price: 'Contattaci' }
  ];

  const stats = [
    { value: '10K+', label: 'Aziende Attive' },
    { value: '99.9%', label: 'Uptime' },
    { value: '24/7', label: 'Supporto' },
    { value: 'GDPR', label: 'Compliant' }
  ];

  return (
    <ErrorBoundary>
      <div className='min-h-screen flex'>
        {/* Left Section - Professional Dark Theme - Desktop Only */}
        <div className='hidden lg:flex lg:w-1/2 bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 relative overflow-hidden'>
          {/* Subtle geometric patterns */}
          <div className='absolute inset-0'>
            <div className='absolute top-0 left-0 w-full h-full opacity-10'>
              <div className='absolute top-20 left-20 w-72 h-72 bg-blue-500 rounded-full filter blur-3xl'></div>
              <div className='absolute bottom-20 right-20 w-96 h-96 bg-purple-500 rounded-full filter blur-3xl'></div>
            </div>
          </div>

          {/* Content */}
          <div className='relative z-10 flex flex-col justify-between p-12 w-full'>
            {/* Header */}
            <div>
              <div className='flex items-center mb-12'>
                <img src={nexaLogo} alt='NexaManager' className='h-10' />
              </div>
              
              <h1 className='text-4xl font-light text-white mb-4'>
                NexaManager Gestione Aziendale
                <span className='block text-5xl font-semibold mt-2'>Intelligente</span>
              </h1>
              
              <p className='text-blue-100 text-lg font-light leading-relaxed max-w-md'>
                La piattaforma all-in-one per digitalizzare e ottimizzare ogni aspetto del tuo business.
              </p>
            </div>

            {/* Features Grid - Compact Professional */}
            <div className='my-8'>
              <div className='grid grid-cols-2 gap-4'>
                {features.map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <div key={index} className='group'>
                      <div className='flex items-start space-x-3'>
                        <div className='flex-shrink-0'>
                          <div className='w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center group-hover:bg-white/20 transition-colors'>
                            <Icon className='w-5 h-5 text-white' />
                          </div>
                        </div>
                        <div>
                          <h3 className='text-white font-medium text-sm mb-1'>{feature.title}</h3>
                          <p className='text-blue-100/70 text-xs leading-relaxed'>{feature.description}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Stats Bar */}
            <div className='grid grid-cols-4 gap-4 py-6 border-t border-white/10'>
              {stats.map((stat, index) => (
                <div key={index} className='text-center'>
                  <div className='text-2xl font-semibold text-white'>{stat.value}</div>
                  <div className='text-xs text-blue-100/70 mt-1'>{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Testimonial - Professional Style */}
            <div className='mt-8'>
              <blockquote className='relative'>
                <svg className='absolute -top-2 -left-2 w-8 h-8 text-white/10' fill='currentColor' viewBox='0 0 32 32'>
                  <path d='M9.352 4C4.456 7.456 1 13.12 1 19.36c0 5.088 3.072 8.064 6.624 8.064 3.36 0 5.856-2.688 5.856-5.856 0-3.168-2.208-5.472-5.088-5.472-.576 0-1.344.096-1.536.192.48-3.264 3.552-7.104 6.624-9.024L9.352 4zm16.512 0c-4.8 3.456-8.256 9.12-8.256 15.36 0 5.088 3.072 8.064 6.624 8.064 3.264 0 5.856-2.688 5.856-5.856 0-3.168-2.304-5.472-5.184-5.472-.576 0-1.248.096-1.44.192.48-3.264 3.456-7.104 6.528-9.024L25.864 4z' />
                </svg>
                <p className='text-white/90 text-sm italic leading-relaxed pl-6'>
                  NexaManager ha rivoluzionato la gestione della nostra azienda. 
                  L'automazione dei processi ci ha fatto risparmiare oltre 20 ore a settimana.
                </p>
                <footer className='mt-3 pl-6'>
                  <p className='text-white font-medium text-sm'>Alessandro Rossi</p>
                  <p className='text-blue-100/70 text-xs'>CEO, TechSolutions Milano</p>
                </footer>
              </blockquote>
            </div>
          </div>
        </div>

        {/* Right Section - Clean Registration Form */}
        <div className='flex-1 flex items-center justify-center p-8 bg-gray-50'>
          <div className='w-full max-w-md'>
            {/* Mobile Logo */}
            <div className='lg:hidden mb-8 text-center'>
              <img src={nexaLogo} alt='NexaManager' className='h-12 mx-auto mb-4' />
              <h2 className='text-2xl font-semibold text-gray-900'>Crea il tuo account</h2>
            </div>

            {/* Desktop Header - Centered */}
            <div className='hidden lg:block mb-8 text-center'>
              <h2 className='text-2xl font-semibold text-gray-900 mb-3'>Crea il tuo account</h2>
              <p className='text-gray-600 text-center'>
                Inizia la tua prova gratuita di 30 giorni
              </p>
            </div>

            {/* Clerk SignUp Component */}
            <SignUp
              appearance={{
                elements: {
                  rootBox: 'w-full',
                  card: 'bg-white rounded-xl shadow-sm border border-gray-200 p-6',
                  headerTitle: 'hidden',
                  headerSubtitle: 'hidden',
                  logoBox: 'mb-3 flex justify-center',
                  logoImage: 'h-10 w-auto',
                  socialButtonsBlockButton: 
                    'border border-gray-300 hover:bg-gray-50 transition-colors duration-200 py-3',
                  formButtonPrimary: 
                    'bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-200 py-3',
                  formFieldInput: 
                    'border-gray-300 focus:border-blue-500 focus:ring-blue-500 py-3',
                  footerActionLink: 
                    'text-blue-600 hover:text-blue-700 font-medium',
                  identityPreviewEditButton:
                    'text-blue-600 hover:text-blue-700',
                  formFieldLabel: 'text-gray-700 font-medium mb-2',
                  dividerLine: 'bg-gray-200',
                  dividerText: 'text-gray-500 bg-white px-4 text-sm',
                  form: 'space-y-4',
                  formFieldRow: 'space-y-1',
                },
                layout: {
                  socialButtonsPlacement: 'top',
                  socialButtonsVariant: 'blockButton',
                  logoPlacement: 'inside',
                },
              }}
              redirectUrl='/dashboard'
              signInUrl='/login'
            />

            {/* Benefits */}
            <div className='mt-6 space-y-2'>
              <div className='flex items-center text-sm text-gray-600'>
                <CheckIcon className='w-4 h-4 text-green-500 mr-2 flex-shrink-0' />
                <span>Nessuna carta di credito richiesta</span>
              </div>
              <div className='flex items-center text-sm text-gray-600'>
                <CheckIcon className='w-4 h-4 text-green-500 mr-2 flex-shrink-0' />
                <span>30 giorni di prova gratuita completa</span>
              </div>
              <div className='flex items-center text-sm text-gray-600'>
                <CheckIcon className='w-4 h-4 text-green-500 mr-2 flex-shrink-0' />
                <span>Cancella in qualsiasi momento</span>
              </div>
            </div>

            {/* Trust Badges */}
            <div className='mt-8 pt-6 border-t border-gray-200'>
              <div className='flex items-center justify-center space-x-6 text-xs text-gray-500'>
                <div className='flex items-center'>
                  <ShieldCheckIcon className='w-4 h-4 mr-1' />
                  <span>SSL Sicuro</span>
                </div>
                <div className='flex items-center'>
                  <span>GDPR Compliant</span>
                </div>
                <div className='flex items-center'>
                  <span>ISO 27001</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default Register; 