import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  Search,
  Download,
  Upload,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Globe,
  Plus,
  Trash2,
  Edit3,
  FileText,
  BarChart3,
} from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import {
  validateTranslations,
  getMissingTranslations,
  getAvailableLanguages,
  switchLanguage,
} from '../../utils/translationUtils';
import {
  auditTranslations,
  auditLanguage,
  validateTranslationQuality,
} from '../../utils/translationAudit';
import toast from 'react-hot-toast';

const TranslationManagement = () => {
  const { t, i18n } = useTranslation(['settings', 'common']);

  // State management
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [selectedNamespace, setSelectedNamespace] = useState('common');
  const [searchTerm, setSearchTerm] = useState('');
  const [translations, setTranslations] = useState({});
  const [availableLanguages, setAvailableLanguages] = useState([]);
  const [availableNamespaces, setAvailableNamespaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [coverageStats, setCoverageStats] = useState({});
  const [missingTranslations, setMissingTranslations] = useState({});
  const [editingKey, setEditingKey] = useState(null);
  const [editingValue, setEditingValue] = useState('');
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [auditReport, setAuditReport] = useState(null);
  const [qualityReport, setQualityReport] = useState(null);
  const [isAuditing, setIsAuditing] = useState(false);

  // Available namespaces from i18n config
  const namespaces = [
    'common',
    'calendar',
    'navigation',
    'forms',
    'buttons',
    'receipts',
    'inventory',
    'documentation',
    'dashboard',
    'invoices',
    'clients',
    'quotes',
    'reports',
    'settings',
    'analytics',
    'transactions',
    'documents',
    'email',
    'scan',
    'voice',
  ];

  // Initialize component
  useEffect(() => {
    loadAvailableLanguages();
    setAvailableNamespaces(namespaces);
  }, []);

  // Load translations when language or namespace changes
  useEffect(() => {
    if (selectedLanguage && selectedNamespace) {
      loadTranslations();
      generateCoverageStats();
    }
  }, [selectedLanguage, selectedNamespace]);

  const loadAvailableLanguages = () => {
    const languages = getAvailableLanguages();
    setAvailableLanguages(languages.length > 0 ? languages : ['en', 'it']);
  };

  const loadTranslations = async () => {
    setLoading(true);
    try {
      // Load namespace for selected language
      await i18n.loadNamespaces(selectedNamespace);

      // Get translations from i18n store
      const nsData = i18n.store.data[selectedLanguage]?.[selectedNamespace] || {};
      setTranslations(nsData);
    } catch (error) {
      console.error('Error loading translations:', error);
      toast.error('Failed to load translations');
    } finally {
      setLoading(false);
    }
  };

  const generateCoverageStats = async () => {
    try {
      const missing = getMissingTranslations(selectedLanguage, 'en');
      setMissingTranslations(missing);

      // Calculate coverage stats for each namespace
      const stats = {};
      for (const namespace of namespaces) {
        const baseKeys = Object.keys(i18n.store.data.en?.[namespace] || {});
        const targetKeys = Object.keys(i18n.store.data[selectedLanguage]?.[namespace] || {});
        const missingCount = baseKeys.filter(key => !targetKeys.includes(key)).length;

        stats[namespace] = {
          total: baseKeys.length,
          translated: targetKeys.length,
          missing: missingCount,
          coverage:
            baseKeys.length > 0 ? ((targetKeys.length / baseKeys.length) * 100).toFixed(1) : 100,
        };
      }
      setCoverageStats(stats);
    } catch (error) {
      console.error('Error generating coverage stats:', error);
    }
  };

  const handleSaveTranslation = async (key, value) => {
    try {
      // Update local state
      const updatedTranslations = { ...translations, [key]: value };
      setTranslations(updatedTranslations);

      // Update i18n store
      i18n.addResourceBundle(selectedLanguage, selectedNamespace, updatedTranslations, true, true);

      // TODO: Save to backend/file system
      // This would typically involve an API call to save the translation
      console.log(`Saving translation: ${selectedLanguage}.${selectedNamespace}.${key} = ${value}`);

      toast.success(t('settings:translationManagement.translationSaved'));
      setEditingKey(null);
      setEditingValue('');
    } catch (error) {
      console.error('Error saving translation:', error);
      toast.error(t('settings:translationManagement.translationSaveError'));
    }
  };

  const handleAddTranslation = async () => {
    if (!newKey || !newValue) {
      toast.error(t('settings:translationManagement.keyValueRequired'));
      return;
    }

    if (translations[newKey]) {
      toast.error(t('settings:translationManagement.keyAlreadyExists'));
      return;
    }

    await handleSaveTranslation(newKey, newValue);
    setNewKey('');
    setNewValue('');
    setShowAddForm(false);
  };

  const handleDeleteTranslation = async key => {
    if (confirm(t('settings:translationManagement.confirmDelete', { key }))) {
      try {
        const updatedTranslations = { ...translations };
        delete updatedTranslations[key];
        setTranslations(updatedTranslations);

        // Update i18n store
        i18n.addResourceBundle(
          selectedLanguage,
          selectedNamespace,
          updatedTranslations,
          true,
          true,
        );

        toast.success(t('settings:translationManagement.translationDeleted'));
      } catch (error) {
        console.error('Error deleting translation:', error);
        toast.error(t('settings:translationManagement.translationDeleteError'));
      }
    }
  };

  const handleExportTranslations = () => {
    try {
      const exportData = {
        language: selectedLanguage,
        namespace: selectedNamespace,
        translations: translations,
        exportedAt: new Date().toISOString(),
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedLanguage}-${selectedNamespace}.json`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success(t('settings:translationManagement.exportSuccess'));
    } catch (error) {
      console.error('Error exporting translations:', error);
      toast.error(t('settings:translationManagement.exportError'));
    }
  };

  const handleImportTranslations = event => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async e => {
      try {
        const importData = JSON.parse(e.target.result);

        if (importData.translations) {
          setTranslations(importData.translations);
          i18n.addResourceBundle(
            selectedLanguage,
            selectedNamespace,
            importData.translations,
            true,
            true,
          );
          toast.success(t('settings:translationManagement.importSuccess'));
        } else {
          toast.error(t('settings:translationManagement.invalidImportFile'));
        }
      } catch (error) {
        console.error('Error importing translations:', error);
        toast.error(t('settings:translationManagement.importError'));
      }
    };
    reader.readAsText(file);
  };

  const handleRunFullAudit = async () => {
    setIsAuditing(true);
    try {
      const report = await auditTranslations('en');
      setAuditReport(report);
      toast.success(t('settings:translationManagement.auditComplete'));
    } catch (error) {
      console.error('Error running audit:', error);
      toast.error(t('settings:translationManagement.auditError'));
    } finally {
      setIsAuditing(false);
    }
  };

  const handleValidateQuality = async () => {
    try {
      const report = validateTranslationQuality(selectedNamespace, selectedLanguage);
      setQualityReport(report);
      toast.success(t('settings:translationManagement.qualityValidationComplete'));
    } catch (error) {
      console.error('Error validating quality:', error);
      toast.error(t('settings:translationManagement.qualityValidationError'));
    }
  };

  const handleFixIssue = async issue => {
    if (issue.type === 'empty') {
      setEditingKey(issue.key);
      setEditingValue('');
    }
    // Additional fix handlers could be added here
  };

  // Filter translations based on search
  const filteredTranslations = Object.entries(translations).filter(
    ([key, value]) =>
      key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      value.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight flex items-center gap-2'>
            <Globe className='h-6 w-6' />
            {t('settings:translationManagement.title')}
          </h2>
          <p className='text-muted-foreground'>{t('settings:translationManagement.description')}</p>
        </div>
        <div className='flex items-center gap-2'>
          <Button onClick={generateCoverageStats} variant='outline' size='sm'>
            <RefreshCw className='h-4 w-4 mr-2' />
            {t('common:refresh')}
          </Button>
        </div>
      </div>

      <Tabs defaultValue='editor' className='space-y-4'>
        <TabsList>
          <TabsTrigger value='editor' className='flex items-center gap-2'>
            <Edit3 className='h-4 w-4' />
            {t('settings:translationManagement.editor')}
          </TabsTrigger>
          <TabsTrigger value='coverage' className='flex items-center gap-2'>
            <BarChart3 className='h-4 w-4' />
            {t('settings:translationManagement.coverage')}
          </TabsTrigger>
          <TabsTrigger value='missing' className='flex items-center gap-2'>
            <AlertTriangle className='h-4 w-4' />
            {t('settings:translationManagement.missing')}
          </TabsTrigger>
          <TabsTrigger value='audit' className='flex items-center gap-2'>
            <CheckCircle className='h-4 w-4' />
            {t('settings:translationManagement.audit')}
          </TabsTrigger>
          <TabsTrigger value='quality' className='flex items-center gap-2'>
            <FileText className='h-4 w-4' />
            {t('settings:translationManagement.quality')}
          </TabsTrigger>
        </TabsList>

        {/* Editor Tab */}
        <TabsContent value='editor' className='space-y-4'>
          {/* Controls */}
          <Card>
            <CardHeader>
              <CardTitle className='text-lg'>
                {t('settings:translationManagement.editorControls')}
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              {/* Language and Namespace Selection */}
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
                <div className='space-y-2'>
                  <label className='text-sm font-medium'>
                    {t('settings:translationManagement.language')}
                  </label>
                  <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableLanguages.map(lang => (
                        <SelectItem key={lang} value={lang}>
                          {lang.toUpperCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className='space-y-2'>
                  <label className='text-sm font-medium'>
                    {t('settings:translationManagement.namespace')}
                  </label>
                  <Select value={selectedNamespace} onValueChange={setSelectedNamespace}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {namespaces.map(ns => (
                        <SelectItem key={ns} value={ns}>
                          {ns}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className='space-y-2'>
                  <label className='text-sm font-medium'>
                    {t('settings:translationManagement.search')}
                  </label>
                  <div className='relative'>
                    <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground' />
                    <Input
                      placeholder={t('settings:translationManagement.searchPlaceholder')}
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className='pl-10'
                    />
                  </div>
                </div>

                <div className='space-y-2'>
                  <label className='text-sm font-medium'>
                    {t('settings:translationManagement.actions')}
                  </label>
                  <div className='flex gap-2'>
                    <Button onClick={handleExportTranslations} variant='outline' size='sm'>
                      <Download className='h-4 w-4' />
                    </Button>
                    <label className='cursor-pointer'>
                      <Button variant='outline' size='sm' asChild>
                        <span>
                          <Upload className='h-4 w-4' />
                        </span>
                      </Button>
                      <input
                        type='file'
                        accept='.json'
                        onChange={handleImportTranslations}
                        className='hidden'
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Add New Translation */}
              <div className='border-t pt-4'>
                {!showAddForm ? (
                  <Button onClick={() => setShowAddForm(true)} variant='outline' className='w-full'>
                    <Plus className='h-4 w-4 mr-2' />
                    {t('settings:translationManagement.addTranslation')}
                  </Button>
                ) : (
                  <div className='space-y-3 p-4 border rounded-lg'>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                      <Input
                        placeholder={t('settings:translationManagement.keyPlaceholder')}
                        value={newKey}
                        onChange={e => setNewKey(e.target.value)}
                      />
                      <Input
                        placeholder={t('settings:translationManagement.valuePlaceholder')}
                        value={newValue}
                        onChange={e => setNewValue(e.target.value)}
                      />
                    </div>
                    <div className='flex gap-2'>
                      <Button onClick={handleAddTranslation} size='sm'>
                        <Save className='h-4 w-4 mr-2' />
                        {t('common:save')}
                      </Button>
                      <Button
                        onClick={() => {
                          setShowAddForm(false);
                          setNewKey('');
                          setNewValue('');
                        }}
                        variant='outline'
                        size='sm'
                      >
                        {t('common:cancel')}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Translation List */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center justify-between'>
                <span>
                  {t('settings:translationManagement.translations')}({filteredTranslations.length})
                </span>
                <Badge variant='outline'>
                  {selectedLanguage}.{selectedNamespace}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className='flex items-center justify-center py-8'>
                  <RefreshCw className='h-6 w-6 animate-spin' />
                  <span className='ml-2'>{t('common:loading')}</span>
                </div>
              ) : filteredTranslations.length === 0 ? (
                <div className='text-center py-8 text-muted-foreground'>
                  {searchTerm
                    ? t('settings:translationManagement.noSearchResults')
                    : t('settings:translationManagement.noTranslations')}
                </div>
              ) : (
                <div className='space-y-2'>
                  {filteredTranslations.map(([key, value]) => (
                    <div
                      key={key}
                      className='flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50'
                    >
                      <div className='flex-1 min-w-0'>
                        <div className='font-mono text-sm text-muted-foreground'>{key}</div>
                        {editingKey === key ? (
                          <Textarea
                            value={editingValue}
                            onChange={e => setEditingValue(e.target.value)}
                            className='mt-1'
                            rows={2}
                          />
                        ) : (
                          <div className='text-sm mt-1 break-words'>{value}</div>
                        )}
                      </div>
                      <div className='flex items-center gap-1'>
                        {editingKey === key ? (
                          <>
                            <Button
                              onClick={() => handleSaveTranslation(key, editingValue)}
                              size='sm'
                              variant='outline'
                            >
                              <Save className='h-4 w-4' />
                            </Button>
                            <Button
                              onClick={() => {
                                setEditingKey(null);
                                setEditingValue('');
                              }}
                              size='sm'
                              variant='outline'
                            >
                              {t('common:cancel')}
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              onClick={() => {
                                setEditingKey(key);
                                setEditingValue(value);
                              }}
                              size='sm'
                              variant='outline'
                            >
                              <Edit3 className='h-4 w-4' />
                            </Button>
                            <Button
                              onClick={() => handleDeleteTranslation(key)}
                              size='sm'
                              variant='outline'
                              className='text-destructive hover:text-destructive'
                            >
                              <Trash2 className='h-4 w-4' />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Coverage Tab */}
        <TabsContent value='coverage' className='space-y-4'>
          <div className='grid gap-4'>
            {namespaces.map(namespace => {
              const stats = coverageStats[namespace];
              if (!stats) return null;

              return (
                <Card key={namespace}>
                  <CardHeader className='pb-3'>
                    <div className='flex items-center justify-between'>
                      <CardTitle className='text-lg'>{namespace}</CardTitle>
                      <Badge
                        variant={
                          stats.coverage >= 95
                            ? 'default'
                            : stats.coverage >= 80
                              ? 'secondary'
                              : 'destructive'
                        }
                      >
                        {stats.coverage}%
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className='space-y-3'>
                      <Progress value={parseFloat(stats.coverage)} className='h-2' />
                      <div className='flex justify-between text-sm text-muted-foreground'>
                        <span>
                          {t('settings:translationManagement.translated')}: {stats.translated}
                        </span>
                        <span>
                          {t('settings:translationManagement.missing')}: {stats.missing}
                        </span>
                        <span>
                          {t('settings:translationManagement.total')}: {stats.total}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Missing Translations Tab */}
        <TabsContent value='missing' className='space-y-4'>
          {Object.keys(missingTranslations).length === 0 ? (
            <Card>
              <CardContent className='flex flex-col items-center justify-center py-8'>
                <CheckCircle className='h-12 w-12 text-green-500 mb-4' />
                <h3 className='text-lg font-medium mb-2'>
                  {t('settings:translationManagement.allTranslationsComplete')}
                </h3>
                <p className='text-muted-foreground text-center'>
                  {t('settings:translationManagement.noMissingTranslations')}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className='space-y-4'>
              {Object.entries(missingTranslations).map(([namespace, keys]) => (
                <Card key={namespace}>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2'>
                      <AlertTriangle className='h-5 w-5 text-orange-500' />
                      {namespace}
                      <Badge variant='secondary'>{Object.keys(keys).length} missing</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='grid gap-2'>
                      {Object.entries(keys).map(([key, value]) => (
                        <div
                          key={key}
                          className='flex items-center justify-between p-2 border rounded'
                        >
                          <div className='flex-1 min-w-0'>
                            <div className='font-mono text-sm'>{key}</div>
                            <div className='text-xs text-muted-foreground truncate'>{value}</div>
                          </div>
                          <Button
                            onClick={() => {
                              setSelectedNamespace(namespace);
                              setNewKey(key);
                              setNewValue(value);
                              setShowAddForm(true);
                            }}
                            size='sm'
                            variant='outline'
                          >
                            {t('settings:translationManagement.addMissing')}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Audit Tab */}
        <TabsContent value='audit' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <CheckCircle className='h-5 w-5' />
                {t('settings:translationManagement.auditTitle')}
              </CardTitle>
              <CardDescription>
                {t('settings:translationManagement.auditDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <Button
                onClick={handleRunFullAudit}
                disabled={isAuditing}
                className='w-full sm:w-auto'
              >
                {isAuditing ? (
                  <>
                    <RefreshCw className='h-4 w-4 mr-2 animate-spin' />
                    {t('settings:translationManagement.auditRunning')}
                  </>
                ) : (
                  <>
                    <CheckCircle className='h-4 w-4 mr-2' />
                    {t('settings:translationManagement.runFullAudit')}
                  </>
                )}
              </Button>

              {auditReport && (
                <div className='space-y-4'>
                  {/* Audit Summary */}
                  <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                    <Card>
                      <CardContent className='p-4'>
                        <div className='text-2xl font-bold text-green-600'>
                          {auditReport.summary?.totalKeys || 0}
                        </div>
                        <div className='text-sm text-muted-foreground'>
                          {t('settings:translationManagement.totalKeys')}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className='p-4'>
                        <div className='text-2xl font-bold text-orange-600'>
                          {auditReport.summary?.issues?.length || 0}
                        </div>
                        <div className='text-sm text-muted-foreground'>
                          {t('settings:translationManagement.totalIssues')}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className='p-4'>
                        <div className='text-2xl font-bold text-blue-600'>
                          {auditReport.summary?.coverage || '0%'}
                        </div>
                        <div className='text-sm text-muted-foreground'>
                          {t('settings:translationManagement.overallCoverage')}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Issues by Language */}
                  {auditReport.languages &&
                    Object.entries(auditReport.languages).map(([lang, langReport]) => (
                      <Card key={lang}>
                        <CardHeader>
                          <CardTitle className='flex items-center gap-2'>
                            <Globe className='h-5 w-5' />
                            {lang.toUpperCase()}
                            <Badge
                              variant={langReport.issues?.length > 0 ? 'destructive' : 'default'}
                            >
                              {langReport.issues?.length || 0} issues
                            </Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {langReport.issues && langReport.issues.length > 0 ? (
                            <div className='space-y-2'>
                              {langReport.issues.map((issue, index) => (
                                <div
                                  key={index}
                                  className='flex items-center justify-between p-3 border rounded-lg'
                                >
                                  <div className='flex-1'>
                                    <div className='flex items-center gap-2'>
                                      <Badge variant='outline' className='text-xs'>
                                        {issue.type}
                                      </Badge>
                                      <span className='font-mono text-sm'>
                                        {issue.namespace}.{issue.key}
                                      </span>
                                    </div>
                                    <div className='text-sm text-muted-foreground mt-1'>
                                      {issue.description}
                                    </div>
                                  </div>
                                  <Button
                                    onClick={() => handleFixIssue(issue)}
                                    size='sm'
                                    variant='outline'
                                  >
                                    {t('settings:translationManagement.fix')}
                                  </Button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className='text-center py-4 text-muted-foreground'>
                              <CheckCircle className='h-8 w-8 mx-auto mb-2 text-green-500' />
                              {t('settings:translationManagement.noIssuesFound')}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}

                  {/* Recommendations */}
                  {auditReport.recommendations && auditReport.recommendations.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className='flex items-center gap-2'>
                          <AlertTriangle className='h-5 w-5 text-orange-500' />
                          {t('settings:translationManagement.recommendations')}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className='space-y-2'>
                          {auditReport.recommendations.map((rec, index) => (
                            <Alert key={index}>
                              <AlertTriangle className='h-4 w-4' />
                              <AlertDescription>{rec}</AlertDescription>
                            </Alert>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quality Tab */}
        <TabsContent value='quality' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <FileText className='h-5 w-5' />
                {t('settings:translationManagement.qualityValidation')}
              </CardTitle>
              <CardDescription>
                {t('settings:translationManagement.qualityDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='flex flex-col sm:flex-row gap-2'>
                <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                  <SelectTrigger className='w-full sm:w-auto'>
                    <SelectValue placeholder={t('settings:translationManagement.selectLanguage')} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableLanguages.map(lang => (
                      <SelectItem key={lang} value={lang}>
                        {lang.toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedNamespace} onValueChange={setSelectedNamespace}>
                  <SelectTrigger className='w-full sm:w-auto'>
                    <SelectValue
                      placeholder={t('settings:translationManagement.selectNamespace')}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {namespaces.map(ns => (
                      <SelectItem key={ns} value={ns}>
                        {ns}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleValidateQuality} className='w-full sm:w-auto'>
                  <FileText className='h-4 w-4 mr-2' />
                  {t('settings:translationManagement.validateQuality')}
                </Button>
              </div>

              {qualityReport && (
                <div className='space-y-4'>
                  {/* Quality Summary */}
                  <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
                    <Card>
                      <CardContent className='p-4'>
                        <div className='text-2xl font-bold text-blue-600'>
                          {qualityReport.summary?.totalChecked || 0}
                        </div>
                        <div className='text-sm text-muted-foreground'>
                          {t('settings:translationManagement.keysChecked')}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className='p-4'>
                        <div className='text-2xl font-bold text-green-600'>
                          {qualityReport.summary?.passed || 0}
                        </div>
                        <div className='text-sm text-muted-foreground'>
                          {t('settings:translationManagement.qualityPassed')}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className='p-4'>
                        <div className='text-2xl font-bold text-red-600'>
                          {qualityReport.summary?.failed || 0}
                        </div>
                        <div className='text-sm text-muted-foreground'>
                          {t('settings:translationManagement.qualityFailed')}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className='p-4'>
                        <div className='text-2xl font-bold text-orange-600'>
                          {qualityReport.summary?.warnings || 0}
                        </div>
                        <div className='text-sm text-muted-foreground'>
                          {t('settings:translationManagement.qualityWarnings')}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Quality Issues */}
                  {qualityReport.issues && qualityReport.issues.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className='flex items-center gap-2'>
                          <AlertTriangle className='h-5 w-5 text-red-500' />
                          {t('settings:translationManagement.qualityIssues')}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className='space-y-3'>
                          {qualityReport.issues.map((issue, index) => (
                            <div
                              key={index}
                              className='flex items-start justify-between p-3 border rounded-lg'
                            >
                              <div className='flex-1'>
                                <div className='flex items-center gap-2 mb-2'>
                                  <Badge
                                    variant={
                                      issue.severity === 'error' ? 'destructive' : 'secondary'
                                    }
                                    className='text-xs'
                                  >
                                    {issue.severity}
                                  </Badge>
                                  <Badge variant='outline' className='text-xs'>
                                    {issue.type}
                                  </Badge>
                                  <span className='font-mono text-sm'>{issue.key}</span>
                                </div>
                                <div className='text-sm text-muted-foreground'>
                                  {issue.description}
                                </div>
                                {issue.expected && (
                                  <div className='text-xs text-muted-foreground mt-1'>
                                    Expected: {issue.expected}
                                  </div>
                                )}
                                {issue.actual && (
                                  <div className='text-xs text-muted-foreground'>
                                    Actual: {issue.actual}
                                  </div>
                                )}
                              </div>
                              <Button
                                onClick={() => handleFixIssue(issue)}
                                size='sm'
                                variant='outline'
                              >
                                {t('settings:translationManagement.fix')}
                              </Button>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Quality Warnings */}
                  {qualityReport.warnings && qualityReport.warnings.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className='flex items-center gap-2'>
                          <AlertTriangle className='h-5 w-5 text-orange-500' />
                          {t('settings:translationManagement.qualityWarnings')}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className='space-y-2'>
                          {qualityReport.warnings.map((warning, index) => (
                            <Alert key={index}>
                              <AlertTriangle className='h-4 w-4' />
                              <AlertDescription>
                                <span className='font-mono text-sm'>{warning.key}</span>:{' '}
                                {warning.message}
                              </AlertDescription>
                            </Alert>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Quality Suggestions */}
                  {qualityReport.suggestions && qualityReport.suggestions.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className='flex items-center gap-2'>
                          <CheckCircle className='h-5 w-5 text-blue-500' />
                          {t('settings:translationManagement.qualitySuggestions')}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className='space-y-2'>
                          {qualityReport.suggestions.map((suggestion, index) => (
                            <div key={index} className='p-3 bg-blue-50 dark:bg-blue-950 rounded-lg'>
                              <div className='text-sm'>{suggestion}</div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TranslationManagement;
