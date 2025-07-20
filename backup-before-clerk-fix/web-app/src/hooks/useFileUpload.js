import { useState } from 'react';
import { supabase } from '@lib/supabaseClient';
import { useAuthBypass as useAuth, useUserBypass as useUser } from '@hooks/useClerkBypass';
// import Logger from '@utils/Logger';

export const useFileUpload = () => {
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);

  // Generic file upload function
  const uploadFile = async (file, options = {}) => {
    const {
      bucket = 'avatars',
      folder = '',
      maxSize = 2 * 1024 * 1024, // 2MB default
      allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml'],
      onSuccess,
      onError,
    } = options;

    if (!user?.id) {
      const errorMsg = 'Utente non autenticato';
      setError(errorMsg);
      if (onError) onError(new Error(errorMsg));
      return null;
    }

    if (!file) {
      const errorMsg = 'Nessun file selezionato';
      setError(errorMsg);
      if (onError) onError(new Error(errorMsg));
      return null;
    }

    // Validate file type
    if (!allowedTypes.includes(file.type)) {
      const errorMsg = `Tipo di file non supportato. Tipi consentiti: ${allowedTypes.join(', ')}`;
      setError(errorMsg);
      if (onError) onError(new Error(errorMsg));
      return null;
    }

    // Validate file size
    if (file.size > maxSize) {
      const errorMsg = `File troppo grande. Dimensione massima: ${Math.round(maxSize / 1024 / 1024)}MB`;
      setError(errorMsg);
      if (onError) onError(new Error(errorMsg));
      return null;
    }

    setIsUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}_${Date.now()}.${fileExt}`;
      const filePath = folder ? `${folder}/${fileName}` : fileName;

      // Logger.info(`Uploading file to ${bucket}/${filePath}`);

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        // Logger.error('Upload error:', uploadError);
        throw uploadError;
      }

      // Logger.info('File uploaded successfully:', uploadData);

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from(bucket).getPublicUrl(filePath);

      // Logger.info('Public URL:', publicUrl);

      const result = {
        path: filePath,
        publicUrl,
        fileName,
        size: file.size,
        type: file.type,
      };

      if (onSuccess) {
        await onSuccess(result);
      }

      setUploadProgress(100);
      return result;
    } catch (error) {
      // Logger.error('Error uploading file:', error);
      const errorMsg =
        'Errore durante il caricamento del file: ' +
        (error.message || error.error_description || 'Controlla la console per dettagli');
      setError(errorMsg);
      if (onError) onError(error);
      return null;
    } finally {
      setIsUploading(false);
      // Reset progress after a delay
      setTimeout(() => setUploadProgress(0), 2000);
    }
  };

  // Upload avatar
  const uploadAvatar = async file => {
    return uploadFile(file, {
      bucket: 'avatars',
      folder: 'profile',
      onSuccess: async result => {
        // Update profile with new avatar URL
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ avatar_url: result.publicUrl })
          .eq('id', user.id);

        if (updateError) {
          // Logger.error('Error updating avatar in profile:', updateError);
          throw updateError;
        }

        // Note: Clerk handles user data differently - avatar updates would go through Clerk API

        // Logger.info('Avatar updated successfully');
      },
    });
  };

  // Upload company logo
  const uploadCompanyLogo = async file => {
    return uploadFile(file, {
      bucket: 'company-logos',
      folder: 'logos',
      onSuccess: async result => {
        // Update profile with new company logo URL
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ company_logo_url: result.publicUrl })
          .eq('id', user.id);

        if (updateError) {
          // Logger.error('Error updating company logo in profile:', updateError);
          throw updateError;
        }

        // Logger.info('Company logo updated successfully');
      },
    });
  };

  // Remove file from storage
  const removeFile = async (path, bucket = 'avatars') => {
    if (!path) return false;

    try {
      const { error } = await supabase.storage.from(bucket).remove([path]);

      if (error) {
        // Logger.error('Error removing file:', error);
        throw error;
      }

      return true;
    } catch (error) {
      // Logger.error('Error in removeFile:', error);
      setError('Errore durante la rimozione del file');
      return false;
    }
  };

  // Clear error
  const clearError = () => {
    setError(null);
  };

  return {
    isUploading,
    uploadProgress,
    error,
    uploadFile,
    uploadAvatar,
    uploadCompanyLogo,
    removeFile,
    clearError,
  };
};
