import React, { useState, useRef, useEffect } from 'react';
import {
  XMarkIcon,
  UserIcon,
  AtSymbolIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { useClients } from '@hooks/useClients';

const EmailRecipientInput = ({
  value = '',
  onChange,
  placeholder = 'Enter email addresses',
  error = null,
  disabled = false,
  allowMultiple = true,
  showSuggestions = true,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [recipients, setRecipients] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestionsList, setShowSuggestionsList] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);
  
  const { clients } = useClients();

  // Parse value into recipients array
  useEffect(() => {
    if (value) {
      const emails = value.split(',').map(email => email.trim()).filter(Boolean);
      const recipientObjects = emails.map(email => {
        const client = clients.find(c => c.email === email);
        return {
          email,
          name: client?.full_name || client?.company_name || '',
          isValid: validateEmail(email),
          isClient: !!client,
          clientId: client?.id,
        };
      });
      setRecipients(recipientObjects);
    } else {
      setRecipients([]);
    }
  }, [value]); // Remove clients dependency to prevent infinite re-renders

  // Generate suggestions based on input
  useEffect(() => {
    if (!showSuggestions || !inputValue.trim()) {
      setSuggestions([]);
      setShowSuggestionsList(false);
      return;
    }

    const query = inputValue.toLowerCase();
    const clientSuggestions = clients
      .filter(client => {
        const name = (client.full_name || client.company_name || '').toLowerCase();
        const email = (client.email || '').toLowerCase();
        return name.includes(query) || email.includes(query);
      })
      .map(client => ({
        email: client.email,
        name: client.full_name || client.company_name,
        type: 'client',
        clientId: client.id,
      }));

    // Add recent contacts (this would come from a service in a real app)
    const recentContacts = [
      // These would be loaded from recent email history
    ];

    setSuggestions([...clientSuggestions, ...recentContacts]);
    setShowSuggestionsList(clientSuggestions.length > 0);
    setSelectedSuggestionIndex(-1);
  }, [inputValue, showSuggestions]); // Remove clients dependency to prevent infinite re-renders

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',' || e.key === ';') {
      e.preventDefault();
      addRecipient(inputValue.trim());
    } else if (e.key === 'Backspace' && !inputValue && recipients.length > 0) {
      // Remove last recipient if input is empty
      removeRecipient(recipients.length - 1);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (showSuggestionsList && suggestions.length > 0) {
        setSelectedSuggestionIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (showSuggestionsList && suggestions.length > 0) {
        setSelectedSuggestionIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
      }
    } else if (e.key === 'Tab' && selectedSuggestionIndex >= 0) {
      e.preventDefault();
      selectSuggestion(suggestions[selectedSuggestionIndex]);
    }
  };

  const addRecipient = (email) => {
    if (!email) return;

    // Check if it's already added
    if (recipients.some(r => r.email === email)) {
      setInputValue('');
      return;
    }

    const client = clients.find(c => c.email === email);
    const newRecipient = {
      email,
      name: client?.full_name || client?.company_name || '',
      isValid: validateEmail(email),
      isClient: !!client,
      clientId: client?.id,
    };

    const newRecipients = allowMultiple 
      ? [...recipients, newRecipient]
      : [newRecipient];

    setRecipients(newRecipients);
    updateValue(newRecipients);
    setInputValue('');
    setShowSuggestionsList(false);
  };

  const removeRecipient = (index) => {
    const newRecipients = recipients.filter((_, i) => i !== index);
    setRecipients(newRecipients);
    updateValue(newRecipients);
  };

  const selectSuggestion = (suggestion) => {
    addRecipient(suggestion.email);
  };

  const updateValue = (newRecipients) => {
    const emailString = newRecipients.map(r => r.email).join(', ');
    onChange(emailString);
  };

  const handleInputBlur = () => {
    // Add current input as recipient if it's a valid email
    setTimeout(() => {
      if (inputValue.trim() && validateEmail(inputValue.trim())) {
        addRecipient(inputValue.trim());
      }
      setShowSuggestionsList(false);
    }, 200); // Delay to allow suggestion clicks
  };

  const handleInputFocus = () => {
    if (inputValue.trim() && suggestions.length > 0) {
      setShowSuggestionsList(true);
    }
  };

  return (
    <div className="relative">
      <div className={`
        flex flex-wrap items-center gap-2 p-2 border rounded-lg min-h-[42px] bg-white
        ${error ? 'border-red-300' : 'border-gray-300'}
        ${disabled ? 'bg-gray-50 cursor-not-allowed' : 'cursor-text'}
        focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500
      `}>
        {/* Recipient Tags */}
        {recipients.map((recipient, index) => (
          <div
            key={index}
            className={`
              flex items-center gap-1 px-2 py-1 rounded-md text-sm
              ${recipient.isValid 
                ? recipient.isClient 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-gray-100 text-gray-800'
                : 'bg-red-100 text-red-800'
              }
            `}
          >
            {recipient.isClient ? (
              <UserIcon className="h-3 w-3" />
            ) : (
              <AtSymbolIcon className="h-3 w-3" />
            )}
            <span className="max-w-[200px] truncate">
              {recipient.name ? `${recipient.name} <${recipient.email}>` : recipient.email}
            </span>
            {!recipient.isValid && (
              <ExclamationTriangleIcon className="h-3 w-3 text-red-600" />
            )}
            {!disabled && (
              <button
                onClick={() => removeRecipient(index)}
                className="ml-1 hover:bg-red-200 rounded-full p-0.5"
                type="button"
              >
                <XMarkIcon className="h-3 w-3" />
              </button>
            )}
          </div>
        ))}

        {/* Input Field */}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          onBlur={handleInputBlur}
          onFocus={handleInputFocus}
          placeholder={recipients.length === 0 ? placeholder : ''}
          disabled={disabled}
          className="flex-1 min-w-[120px] outline-none bg-transparent"
        />
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestionsList && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={`${suggestion.email}-${index}`}
              type="button"
              onClick={() => selectSuggestion(suggestion)}
              className={`
                w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2
                ${index === selectedSuggestionIndex ? 'bg-blue-50' : ''}
              `}
            >
              {suggestion.type === 'client' ? (
                <UserIcon className="h-4 w-4 text-blue-500" />
              ) : (
                <AtSymbolIcon className="h-4 w-4 text-gray-500" />
              )}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 truncate">
                  {suggestion.name || suggestion.email}
                </div>
                {suggestion.name && (
                  <div className="text-sm text-gray-500 truncate">
                    {suggestion.email}
                  </div>
                )}
              </div>
              {suggestion.type === 'client' && (
                <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                  Client
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-1 text-sm text-red-600 flex items-center gap-1">
          <ExclamationTriangleIcon className="h-4 w-4" />
          {error}
        </div>
      )}

      {/* Helper Text */}
      {!error && allowMultiple && (
        <div className="mt-1 text-xs text-gray-500">
          Separate multiple emails with commas or press Enter
        </div>
      )}
    </div>
  );
};

export default EmailRecipientInput;