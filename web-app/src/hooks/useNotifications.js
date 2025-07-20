import { useState, useEffect } from 'react';
import { supabase } from '@lib/supabaseClient';
import { useAuth, useUser } from '@clerk/clerk-react';
// import Logger from '@utils/Logger';

export const useNotifications = () => {
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    smsNotifications: false,
    promotionalEmails: true,
    weeklyDigest: true,
    monthlyReport: true,
    securityAlerts: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  // Load notification settings from profile
  const loadNotifications = async () => {
    if (!user?.id || !isLoaded) return;

    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('notification_settings')
        .eq('id', user.id)
        .single();

      if (error) {
        // Logger.error('Error loading notifications:', error);
        if (error.code !== 'PGRST116') {
          throw error;
        }
      } else if (data?.notification_settings) {
        try {
          // Handle both string and object formats
          if (typeof data.notification_settings === 'string') {
            const parsed = JSON.parse(data.notification_settings);
            setNotifications(parsed);
          } else {
            setNotifications(data.notification_settings);
          }
        } catch (parseError) {
          // Logger.error('Error parsing notification settings:', parseError);
          // Keep default settings on parse error
        }
      }
    } catch (error) {
      // Logger.error('Error in loadNotifications:', error);
      setError('Errore nel caricamento delle impostazioni di notifica');
    } finally {
      setIsLoading(false);
    }
  };

  // Save notification settings
  const saveNotifications = async () => {
    if (!user?.id || !isLoaded) return false;

    setIsSaving(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          notification_settings: notifications,
          updated_at: new Date(),
        })
        .eq('id', user.id);

      if (error) {
        // Logger.error('Error saving notifications:', error);
        throw error;
      }

      return true;
    } catch (error) {
      // Logger.error('Error in saveNotifications:', error);
      setError('Errore durante il salvataggio delle impostazioni di notifica');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // Handle notification change
  const handleNotificationChange = e => {
    const { name, checked } = e.target;
    setNotifications(prev => ({
      ...prev,
      [name]: checked,
    }));
  };

  // Reset to defaults
  const resetToDefaults = () => {
    setNotifications({
      emailNotifications: true,
      smsNotifications: false,
      promotionalEmails: true,
      weeklyDigest: true,
      monthlyReport: true,
      securityAlerts: true,
    });
  };

  // Load notifications on mount and user change
  useEffect(() => {
    if (user?.id && isLoaded) {
      loadNotifications();
    }
  }, [user?.id, isLoaded]);

  return {
    notifications,
    setNotifications,
    isLoading,
    isSaving,
    error,
    loadNotifications,
    saveNotifications,
    handleNotificationChange,
    resetToDefaults,
  };
};
