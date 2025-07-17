import { useState, useEffect } from 'react';
import { supabase } from '@lib/supabaseClient';
import { useAuth, useUser } from '@clerk/clerk-react';
// import Logger from '@utils/Logger';

export const useProfile = () => {
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    companyName: '',
    position: '',
    address: '',
    bio: '',
    avatar: '/assets/profile.jpg',
    vatNumber: '',
    taxCode: '',
    legalAddress: '',
    businessPhone: '',
    businessEmail: '',
    website: '',
    companyLogo: '/assets/company-logo.png',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  // Fetch user profile data
  const fetchProfile = async () => {
    if (!user?.id || !isLoaded) return;

    setIsLoading(true);
    setError(null);

    try {
      // Logger.info('Recupero profilo per utente ID:', user.id);

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        // Logger.error('Error fetching profile:', error);

        // Create default profile if it doesn't exist
        if (error.code === 'PGRST116') {
          // Logger.info('Profilo non trovato, creazione di un profilo base...');
          await createDefaultProfile();
        } else {
          throw error;
        }
      } else if (data) {
        // Logger.info('Profilo recuperato:', data);
        updateProfileData(data);
      }
    } catch (error) {
      // Logger.error('Error in profile fetch:', error);
      setError('Errore nel caricamento del profilo');
    } finally {
      setIsLoading(false);
    }
  };

  // Create default profile
  const createDefaultProfile = async () => {
    if (!user?.id || !isLoaded) return;

    const defaultProfile = {
      id: user.id,
      username: user.primaryEmailAddress?.emailAddress,
      full_name: '',
      email: user.primaryEmailAddress?.emailAddress,
      notification_settings: {
        emailNotifications: true,
        smsNotifications: false,
        promotionalEmails: true,
        weeklyDigest: true,
        monthlyReport: true,
        securityAlerts: true,
      },
      created_at: new Date(),
      updated_at: new Date(),
    };

    try {
      const { error: insertError } = await supabase.from('profiles').insert([defaultProfile]);

      if (insertError) {
        // Logger.error('Errore nella creazione del profilo base:', insertError);
        throw insertError;
      } else {
        // Logger.info('Profilo base creato con successo');
        setProfileData(prev => ({
          ...prev,
          email: user.primaryEmailAddress?.emailAddress || '',
        }));
      }
    } catch (error) {
      // Logger.error('Error creating default profile:', error);
      throw error;
    }
  };

  // Update profile data from database response
  const updateProfileData = data => {
    setProfileData({
      firstName: data.first_name || '',
      lastName: data.last_name || '',
      email: user.primaryEmailAddress?.emailAddress || '',
      phone: data.phone || '',
      companyName: data.company_name || '',
      position: data.position || '',
      address: data.address || '',
      bio: data.bio || '',
      avatar: data.avatar_url || '/assets/profile.jpg',
      vatNumber: data.vat_number || '',
      taxCode: data.tax_code || '',
      legalAddress: data.legal_address || '',
      businessPhone: data.business_phone || '',
      businessEmail: data.business_email || '',
      website: data.website || '',
      companyLogo: data.company_logo_url || '/assets/company-logo.png',
    });
  };

  // Save profile data
  const saveProfile = async (additionalData = {}) => {
    if (!user?.id || !isLoaded) return false;

    setIsSaving(true);
    setError(null);

    try {
      // Logger.info('Salvando il profilo per utente ID:', user.id);

      const profileUpdate = {
        id: user.id,
        first_name: profileData.firstName,
        last_name: profileData.lastName,
        phone: profileData.phone,
        company_name: profileData.companyName,
        position: profileData.position,
        address: profileData.address,
        bio: profileData.bio,
        avatar_url: profileData.avatar,
        vat_number: profileData.vatNumber,
        tax_code: profileData.taxCode,
        legal_address: profileData.legalAddress,
        business_phone: profileData.businessPhone,
        business_email: profileData.businessEmail,
        website: profileData.website,
        company_logo_url: profileData.companyLogo,
        updated_at: new Date(),
        ...additionalData,
      };

      // Logger.info('Dati da salvare:', profileUpdate);

      // Check if profile exists
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        // Logger.error('Errore durante la verifica del profilo esistente:', checkError);
        throw checkError;
      }

      let error;
      let operation = '';

      if (existingProfile) {
        // Update existing profile
        operation = 'update';
        // Logger.info('Aggiornamento del profilo esistente');
        const { error: updateError } = await supabase
          .from('profiles')
          .update(profileUpdate)
          .eq('id', user.id);
        error = updateError;
      } else {
        // Insert new profile
        operation = 'insert';
        // Logger.info('Creazione di un nuovo profilo');
        const { error: insertError } = await supabase.from('profiles').insert([profileUpdate]);
        error = insertError;
      }

      if (error) {
        // Logger.error(
        //   `Errore durante ${operation === 'update' ? "l'aggiornamento" : "l'inserimento"} del profilo:`,
        //   error,
        // );
        throw error;
      }

      return true;
    } catch (error) {
      // Logger.error('Error saving profile:', error);

      let errorMessage = 'Errore durante il salvataggio del profilo.';
      if (error.message) {
        if (error.message.includes('violates foreign key constraint')) {
          errorMessage =
            'Errore di riferimento con il profilo utente. Potrebbe essere necessario rieffettuare il login.';
        } else if (error.message.includes('permission denied')) {
          errorMessage = "Permesso negato. Non hai l'autorizzazione per modificare questo profilo.";
        } else {
          errorMessage += ' ' + error.message;
        }
      }

      setError(errorMessage);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // Update profile field
  const updateProfileField = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle form change
  const handleProfileChange = e => {
    const { name, value } = e.target;
    updateProfileField(name, value);
  };

  // Load profile on mount and user change
  useEffect(() => {
    if (user?.id && isLoaded) {
      fetchProfile();
    }
  }, [user?.id, isLoaded]);

  return {
    profileData,
    setProfileData,
    isLoading,
    isSaving,
    error,
    fetchProfile,
    saveProfile,
    updateProfileField,
    handleProfileChange,
  };
};
