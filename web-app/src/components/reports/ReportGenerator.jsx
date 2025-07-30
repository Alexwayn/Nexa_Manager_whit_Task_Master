import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { reportingService } from '@/services/reportingService';

const ReportGenerator = ({ onSchedule }) => {
  const { t } = useTranslation();
  const [reportTypes, setReportTypes] = useState([]);
  const [formData, setFormData] = useState({
    type: '',
    startDate: '',
    endDate: '',
    format: 'PDF',
    name: ''
  });
  const [errors, setErrors] = useState({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [generatedReport, setGeneratedReport] = useState(null);
  const [lastGeneratedParams, setLastGeneratedParams] = useState(null);

  useEffect(() => {
    loadReportTypes();
  }, []);

  const loadReportTypes = async () => {
    try {
      const types = await reportingService.getReportTypes();
      setReportTypes(types);
    } catch (error) {
      console.error('Failed to load report types:', error);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.type) {
      newErrors.type = 'Seleziona un tipo di report';
    }
    if (!formData.startDate) {
      newErrors.startDate = 'Seleziona data inizio';
    }
    if (!formData.endDate) {
      newErrors.endDate = 'Seleziona data fine';
    }
    if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
      newErrors.dateRange = 'La data fine deve essere successiva alla data inizio';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsGenerating(true);
    setErrors({});
    setSuccessMessage('');

    try {
      const reportParams = {
        type: formData.type,
        startDate: formData.startDate,
        endDate: formData.endDate,
        format: formData.format,
        name: formData.name || `${reportTypes.find(t => t.value === formData.type)?.label || 'Report'} ${formData.startDate} - ${formData.endDate}`
      };

      const result = await reportingService.generateReport(reportParams);
      
      setSuccessMessage('Report generato con successo!');
      setGeneratedReport(result);
      setLastGeneratedParams(reportParams);
      
      // Reset form
      setFormData({
        type: '',
        startDate: '',
        endDate: '',
        format: 'PDF',
        name: ''
      });

      // Create download link if URL is provided
      if (result.downloadUrl) {
        const link = document.createElement('a');
        link.href = result.downloadUrl;
        link.download = `${result.name}.${formData.format.toLowerCase()}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

    } catch (error) {
      setErrors({ general: 'Errore nella generazione del report' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear related errors
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-6">Genera Nuovo Report</h2>
      
      {successMessage && (
          <div className="p-4 bg-green-100 border border-green-400 text-green-700 rounded-md">
            {successMessage}
            {generatedReport && (
              <div className="mt-2 space-x-2">
                <a
                  href={generatedReport.downloadUrl}
                  className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Scarica Report
                </a>
                {onSchedule && (
                   <button
                     type="button"
                     onClick={() => onSchedule(lastGeneratedParams)}
                     className="inline-block px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                   >
                     Programma Report
                   </button>
                 )}
              </div>
            )}
          </div>
        )}

      {errors.general && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {errors.general}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="reportName" className="block text-sm font-medium text-gray-700 mb-1">
            Nome Report (opzionale)
          </label>
          <input
            type="text"
            id="reportName"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Inserisci nome personalizzato"
          />
        </div>

        <div>
          <label htmlFor="reportType" className="block text-sm font-medium text-gray-700 mb-1">
            Tipo Report
          </label>
          <select
            id="reportType"
            value={formData.type}
            onChange={(e) => handleInputChange('type', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Seleziona tipo report</option>
            {reportTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          {errors.type && <p className="mt-1 text-sm text-red-600">{errors.type}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
              Data Inizio
            </label>
            <input
              type="date"
              id="startDate"
              value={formData.startDate}
              onChange={(e) => handleInputChange('startDate', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.startDate && <p className="text-red-500 text-sm mt-1">{errors.startDate}</p>}
          </div>

          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
              Data Fine
            </label>
            <input
              type="date"
              id="endDate"
              value={formData.endDate}
              onChange={(e) => handleInputChange('endDate', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.endDate && <p className="text-red-500 text-sm mt-1">{errors.endDate}</p>}
          </div>
        </div>

        {errors.dateRange && <p className="text-red-500 text-sm">{errors.dateRange}</p>}

        <div>
          <label htmlFor="reportFormat" className="block text-sm font-medium text-gray-700 mb-1">
            Formato
          </label>
          <select
            id="reportFormat"
            value={formData.format}
            onChange={(e) => handleInputChange('format', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="PDF">PDF</option>
            <option value="Excel">Excel</option>
            <option value="CSV">CSV</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={isGenerating}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? 'Generazione in corso...' : 'Genera Report'}
        </button>
      </form>
    </div>
  );
};

export default ReportGenerator;