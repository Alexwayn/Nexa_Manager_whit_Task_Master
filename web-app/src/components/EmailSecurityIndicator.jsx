import React from 'react';
import { Shield, Lock, AlertTriangle, CheckCircle, XCircle, Eye } from 'lucide-react';

const EmailSecurityIndicator = ({ email, securityAnalysis, compact = false }) => {
  const getSecurityLevel = () => {
    if (!securityAnalysis) return 'unknown';
    
    const riskScore = securityAnalysis.riskScore || 0;
    if (riskScore >= 7) return 'high-risk';
    if (riskScore >= 4) return 'medium-risk';
    if (riskScore >= 1) return 'low-risk';
    return 'secure';
  };

  const getSecurityColor = (level) => {
    switch (level) {
      case 'high-risk': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium-risk': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low-risk': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'secure': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getSecurityIcon = (level) => {
    switch (level) {
      case 'high-risk': return <XCircle className="w-4 h-4" />;
      case 'medium-risk': return <AlertTriangle className="w-4 h-4" />;
      case 'low-risk': return <Eye className="w-4 h-4" />;
      case 'secure': return <CheckCircle className="w-4 h-4" />;
      default: return <Shield className="w-4 h-4" />;
    }
  };

  const securityLevel = getSecurityLevel();
  const colorClasses = getSecurityColor(securityLevel);
  const icon = getSecurityIcon(securityLevel);

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        {/* Encryption indicator */}
        {email?.content?.encrypted && (
          <div className="flex items-center">
            <Lock className="w-3 h-3 text-blue-600" title="Encrypted content" />
          </div>
        )}
        
        {/* Security status */}
        <div className={`flex items-center px-1 py-0.5 rounded text-xs ${colorClasses}`} title={`Security level: ${securityLevel}`}>
          {icon}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Main security indicator */}
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${colorClasses}`}>
        {icon}
        <div className="flex-1">
          <div className="font-medium text-sm capitalize">
            {securityLevel.replace('-', ' ')} Email
          </div>
          {securityAnalysis && (
            <div className="text-xs opacity-75">
              Risk Score: {securityAnalysis.riskScore}/10
            </div>
          )}
        </div>
      </div>

      {/* Security features */}
      <div className="flex flex-wrap gap-2">
        {email?.content?.encrypted && (
          <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
            <Lock className="w-3 h-3" />
            Encrypted
          </div>
        )}
        
        {email?.isConfidential && (
          <div className="flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-700 rounded text-xs">
            <Eye className="w-3 h-3" />
            Confidential
          </div>
        )}
        
        {securityAnalysis?.isSpam && (
          <div className="flex items-center gap-1 px-2 py-1 bg-red-50 text-red-700 rounded text-xs">
            <AlertTriangle className="w-3 h-3" />
            Spam Detected
          </div>
        )}
        
        {securityAnalysis?.isPhishing && (
          <div className="flex items-center gap-1 px-2 py-1 bg-orange-50 text-orange-700 rounded text-xs">
            <AlertTriangle className="w-3 h-3" />
            Phishing Risk
          </div>
        )}
      </div>

      {/* Security recommendations */}
      {securityAnalysis?.recommendations && securityAnalysis.recommendations.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-yellow-600" />
            <span className="text-sm font-medium text-yellow-800">Security Recommendations</span>
          </div>
          <ul className="text-xs text-yellow-700 space-y-1">
            {securityAnalysis.recommendations.map((recommendation, index) => (
              <li key={index} className="flex items-start gap-1">
                <span className="text-yellow-600">•</span>
                {recommendation}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Detailed security analysis */}
      {securityAnalysis && !compact && (
        <details className="bg-gray-50 rounded-lg">
          <summary className="px-3 py-2 cursor-pointer text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg">
            View Security Analysis Details
          </summary>
          <div className="px-3 pb-3 text-xs text-gray-600 space-y-2">
            {securityAnalysis.spamIndicators && securityAnalysis.spamIndicators.length > 0 && (
              <div>
                <strong>Spam Indicators:</strong>
                <ul className="ml-4 mt-1">
                  {securityAnalysis.spamIndicators.map((indicator, index) => (
                    <li key={index}>• {indicator}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {securityAnalysis.phishingIndicators && securityAnalysis.phishingIndicators.length > 0 && (
              <div>
                <strong>Phishing Indicators:</strong>
                <ul className="ml-4 mt-1">
                  {securityAnalysis.phishingIndicators.map((indicator, index) => (
                    <li key={index}>• {indicator}</li>
                  ))}
                </ul>
              </div>
            )}
            
            <div>
              <strong>Analysis Date:</strong> {new Date(securityAnalysis.analyzedAt).toLocaleString()}
            </div>
          </div>
        </details>
      )}
    </div>
  );
};

export default EmailSecurityIndicator;