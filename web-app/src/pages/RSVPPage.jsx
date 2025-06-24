import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { EventInvitationService } from '@lib/eventInvitationService.js';
import { useTranslation } from 'react-i18next';

/**
 * RSVP Page - Standalone page for external users to respond to event invitations
 * Accessed via secure token link: /rsvp/:token
 */
const RSVPPage = () => {
  const { t, i18n } = useTranslation('rsvp');
  const { token } = useParams();
  const [searchParams] = useSearchParams();
  const preselectedResponse = searchParams.get('response');

  const [loading, setLoading] = useState(true);
  const [invitation, setInvitation] = useState(null);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Form state
  const [rsvpResponse, setRsvpResponse] = useState(preselectedResponse || 'pending');
  const [guestCount, setGuestCount] = useState(1);
  const [responseMessage, setResponseMessage] = useState('');
  const [dietaryRestrictions, setDietaryRestrictions] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');

  useEffect(() => {
    loadInvitationDetails();
  }, [token]);

  const loadInvitationDetails = async () => {
    try {
      setLoading(true);
      const result = await EventInvitationService.getRSVPDetails(token);

      if (result.success) {
        setInvitation(result.invitation);

        // Pre-fill form if already responded
        if (result.invitation.rsvp_status !== 'pending') {
          setRsvpResponse(result.invitation.rsvp_status);
          setGuestCount(result.invitation.guest_count || 1);
          setResponseMessage(result.invitation.rsvp_response_message || '');
          setDietaryRestrictions(result.invitation.dietary_restrictions || '');
          setSpecialRequests(result.invitation.special_requests || '');
        }
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(t('error.loadError'));
      console.error('Error loading invitation:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRSVP = async (e) => {
    e.preventDefault();

    if (rsvpResponse === 'pending') {
      alert(t('form.alerts.selectResponse'));
      return;
    }

    try {
      setSubmitting(true);

      const rsvpData = {
        message: responseMessage.trim(),
        guest_count: parseInt(guestCount) || 1,
        dietary_restrictions: dietaryRestrictions.trim(),
        special_requests: specialRequests.trim(),
      };

      const result = await EventInvitationService.handleRSVP(token, rsvpResponse, rsvpData);

      if (result.success) {
        setSubmitted(true);
        setInvitation(result.invitation);
      } else {
        alert(t('form.alerts.submitError', { error: result.error }));
      }
    } catch (err) {
      console.error('Error submitting RSVP:', err);
      alert(t('form.alerts.genericSubmitError'));
    } finally {
      setSubmitting(false);
    }
  };

  const formatEventDate = (dateString) => {
    return new Date(dateString).toLocaleDateString(i18n.language, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatEventTime = (event) => {
    if (event.all_day) return t('form.details.allDay');

    const startTime = event.start_time || '09:00';
    const endTime = event.end_time || '10:00';
    return `${startTime} - ${endTime}`;
  };

  const getResponseStatusText = (status) => {
    const statusMap = {
      accepted: { text: t('form.yourResponse.accepted'), color: 'text-green-600', icon: '✓' },
      declined: { text: t('form.yourResponse.declined'), color: 'text-red-600', icon: '✗' },
      maybe: { text: t('form.yourResponse.maybeResponse'), color: 'text-yellow-600', icon: '?' },
      pending: { text: t('form.yourResponse.pending'), color: 'text-gray-600', icon: '⏳' },
    };
    return statusMap[status] || statusMap.pending;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('loader.loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{t('error.title')}</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <p className="text-sm text-gray-500">{t('error.description')}</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    const statusInfo = getResponseStatusText(rsvpResponse);

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
          <div className={`text-6xl mb-4 ${statusInfo.color}`}>{statusInfo.icon}</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{t('submitted.title')}</h1>
          <p className={`text-lg font-semibold mb-4 ${statusInfo.color}`}>{statusInfo.text}</p>
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">{invitation.events.title}</h3>
            <p className="text-gray-600">{formatEventDate(invitation.events.start_date)}</p>
            <p className="text-gray-600">{formatEventTime(invitation.events)}</p>
          </div>
          <p className="text-gray-600 text-sm">{t('submitted.organizerNotified')}</p>
          {rsvpResponse === 'accepted' && (
            <div className="mt-4 p-4 bg-green-50 rounded-lg">
              <p className="text-green-800 text-sm">{t('submitted.seeYou')}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  const event = invitation.events;
  const currentStatus = getResponseStatusText(invitation.rsvp_status);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
          <div className="bg-blue-600 text-white p-6 text-center">
            <h1 className="text-3xl font-bold">{t('form.header.title')}</h1>
            <p className="mt-2 opacity-90">{t('form.header.subtitle')}</p>
          </div>

          {/* Event Details */}
          <div className="p-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{event.title}</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">📅</span>
                    <div>
                      <p className="font-semibold text-gray-900">{t('form.details.date')}</p>
                      <p className="text-gray-600">{formatEventDate(event.start_date)}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">🕐</span>
                    <div>
                      <p className="font-semibold text-gray-900">{t('form.details.time')}</p>
                      <p className="text-gray-600">{formatEventTime(event)}</p>
                    </div>
                  </div>
                </div>

                {event.location && (
                  <div className="bg-gray-50 rounded-lg p-4 md:col-span-2">
                    <div className="flex items-center mb-2">
                      <span className="text-2xl mr-3">📍</span>
                      <div>
                        <p className="font-semibold text-gray-900">{t('form.details.location')}</p>
                        <p className="text-gray-600">{event.location}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {event.description && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg text-left">
                  <p className="font-semibold text-gray-900 mb-2">
                    {t('form.details.description')}
                  </p>
                  <p className="text-gray-600">{event.description}</p>
                </div>
              )}

              {invitation.invitation_message && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg text-left">
                  <p className="font-semibold text-gray-900 mb-2">
                    {t('form.details.personalMessage')}
                  </p>
                  <p className="text-gray-700">{invitation.invitation_message}</p>
                </div>
              )}
            </div>

            {/* Current Status */}
            {invitation.rsvp_status !== 'pending' && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg text-center">
                <p className="text-gray-600 mb-2">{t('form.status.current')}</p>
                <p className={`text-lg font-semibold ${currentStatus.color}`}>
                  {currentStatus.icon} {currentStatus.text}
                </p>
                {invitation.rsvp_responded_at && (
                  <p className="text-sm text-gray-500 mt-2">
                    {t('form.status.respondedOn', {
                      date: new Date(invitation.rsvp_responded_at).toLocaleDateString(
                        i18n.language,
                      ),
                    })}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* RSVP Form */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">
            {invitation.rsvp_status === 'pending'
              ? t('form.yourResponse.title')
              : t('form.yourResponse.updateTitle')}
          </h3>

          <form onSubmit={handleSubmitRSVP} className="space-y-6">
            {/* RSVP Response */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                {t('form.yourResponse.label')}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setRsvpResponse('accepted')}
                  className={`p-4 rounded-lg border-2 text-center transition-all ${
                    rsvpResponse === 'accepted'
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 hover:border-green-300'
                  }`}
                >
                  <div className="text-2xl mb-2">✓</div>
                  <div className="font-semibold">{t('form.yourResponse.accept')}</div>
                </button>

                <button
                  type="button"
                  onClick={() => setRsvpResponse('maybe')}
                  className={`p-4 rounded-lg border-2 text-center transition-all ${
                    rsvpResponse === 'maybe'
                      ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                      : 'border-gray-200 hover:border-yellow-300'
                  }`}
                >
                  <div className="text-2xl mb-2">?</div>
                  <div className="font-semibold">{t('form.yourResponse.maybe')}</div>
                </button>

                <button
                  type="button"
                  onClick={() => setRsvpResponse('declined')}
                  className={`p-4 rounded-lg border-2 text-center transition-all ${
                    rsvpResponse === 'declined'
                      ? 'border-red-500 bg-red-50 text-red-700'
                      : 'border-gray-200 hover:border-red-300'
                  }`}
                >
                  <div className="text-2xl mb-2">✗</div>
                  <div className="font-semibold">{t('form.yourResponse.decline')}</div>
                </button>
              </div>
            </div>

            {/* Guest Count (only if accepting) */}
            {rsvpResponse === 'accepted' && (
              <div>
                <label
                  htmlFor="guestCount"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  {t('form.guests.label')}
                </label>
                <select
                  id="guestCount"
                  value={guestCount}
                  onChange={(e) => setGuestCount(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                    <option key={num} value={num}>
                      {num} {num === 1 ? 'persona' : 'persone'}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Response Message */}
            <div>
              <label
                htmlFor="responseMessage"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                {t('form.message.label')}
              </label>
              <textarea
                id="responseMessage"
                value={responseMessage}
                onChange={(e) => setResponseMessage(e.target.value)}
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={t('form.message.placeholder')}
              />
            </div>

            {/* Additional Info (only if accepting) */}
            {rsvpResponse === 'accepted' && (
              <>
                <div>
                  <label
                    htmlFor="dietaryRestrictions"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    {t('form.dietary.label')}
                  </label>
                  <input
                    type="text"
                    id="dietaryRestrictions"
                    value={dietaryRestrictions}
                    onChange={(e) => setDietaryRestrictions(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t('form.dietary.placeholder')}
                  />
                </div>

                <div>
                  <label
                    htmlFor="specialRequests"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    {t('form.specialRequests.label')}
                  </label>
                  <input
                    type="text"
                    id="specialRequests"
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t('form.specialRequests.placeholder')}
                  />
                </div>
              </>
            )}

            {/* Submit Button */}
            <div className="text-center">
              <button
                type="submit"
                disabled={submitting || rsvpResponse === 'pending'}
                className={`px-8 py-3 rounded-lg font-semibold text-white transition-all ${
                  submitting || rsvpResponse === 'pending'
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-200'
                }`}
              >
                {submitting
                  ? t('loader.loading')
                  : invitation.rsvp_status === 'pending'
                    ? t('form.submitButton.submit')
                    : t('form.submitButton.update')}
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-500 text-sm">
          <p>{t('form.footer.text')}</p>
        </div>
      </div>
    </div>
  );
};

export default RSVPPage;
