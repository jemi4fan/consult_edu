import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Textarea from '../../components/ui/Textarea';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import ProgressBar from '../../components/ui/ProgressBar';
import Stepper from '../../components/wizard/Stepper';
import { useQuery, useMutation } from 'react-query';
import { applicationsAPI, documentsAPI, scholarshipsAPI, jobsAPI } from '../../services/api';
import toast from 'react-hot-toast';
import {
  Briefcase,
  GraduationCap,
  MapPin,
  Calendar,
  DollarSign,
  FileText,
  Upload,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Save,
  Send,
  Eye,
  Download,
  Trash2,
  Search,
  X,
  Clock,
  Play,
  RotateCcw,
  Plus,
  Rocket,
} from 'lucide-react';

const ApplicationWizard = () => {
  const { type, id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [currentStep, setCurrentStep] = useState(0);
  const [showRestartModal, setShowRestartModal] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [autoSaveTimer, setAutoSaveTimer] = useState(null);
  const [uploadedDocuments, setUploadedDocuments] = useState([]);
  
  const [formData, setFormData] = useState({
    applicationType: type,
    selectedJob: null,
    selectedScholarship: null,
    selectedCountry: null,
    selectedProgram: null,
    documents: [],
    personalInfo: {},
    additionalInfo: {},
    status: 'draft',
    progress: 0,
    currentStep: 0,
    totalSteps: type === 'job' ? 5 : 6,
  });

  // Job application steps
  const jobSteps = [
    { id: 'selection', title: 'Application Selection', description: 'Choose job type', icon: '🎯' },
    { id: 'country', title: 'Country Selection', description: 'Select target country', icon: '🌍' },
    { id: 'job', title: 'Job Selection', description: 'Select specific job', icon: '💼' },
    { id: 'documents', title: 'Documents & Details', description: 'Upload required documents', icon: '📄' },
    { id: 'summary', title: 'Summary & Submission', description: 'Review and submit', icon: '✅' },
  ];

  // Scholarship application steps
  const scholarshipSteps = [
    { id: 'selection', title: 'Application Selection', description: 'Choose scholarship type', icon: '🎯' },
    { id: 'country', title: 'Country Selection', description: 'Select target country', icon: '🌍' },
    { id: 'program', title: 'Program Selection', description: 'Choose program level', icon: '🎓' },
    { id: 'scholarship', title: 'Scholarship Selection', description: 'Select specific scholarship', icon: '🏆' },
    { id: 'documents', title: 'Documents & Details', description: 'Upload required documents', icon: '📄' },
    { id: 'summary', title: 'Summary & Submission', description: 'Review and submit', icon: '✅' },
  ];

  const steps = type === 'job' ? jobSteps : scholarshipSteps;

  // API Queries for dynamic filtering
  const { data: countriesData, isLoading: countriesLoading } = useQuery(
    ['countries', formData.applicationType],
    () => formData.applicationType === 'scholarship' 
      ? scholarshipsAPI.getCountries() 
      : jobsAPI.getCountries(),
    {
      enabled: !!formData.applicationType,
      select: (response) => response.data.data?.countries || []
    }
  );

  const { data: programsData, isLoading: programsLoading } = useQuery(
    ['programs', formData.selectedCountry?.name],
    () => scholarshipsAPI.getPrograms(formData.selectedCountry?.name),
    {
      enabled: !!formData.selectedCountry && formData.applicationType === 'scholarship',
      select: (response) => response.data.data?.programs || []
    }
  );

  const { data: scholarshipsData, isLoading: scholarshipsLoading } = useQuery(
    ['scholarships', formData.selectedCountry?.name, formData.selectedProgram?.id],
    () => scholarshipsAPI.getScholarships({
      country: formData.selectedCountry?.name,
      program: formData.selectedProgram?.id,
      limit: 50
    }),
    {
      enabled: !!formData.selectedCountry && !!formData.selectedProgram && formData.applicationType === 'scholarship',
      select: (response) => response.data.data?.scholarships || []
    }
  );

  const { data: jobsData, isLoading: jobsLoading } = useQuery(
    ['jobs', formData.selectedCountry?.name],
    () => jobsAPI.getJobs({
      country: formData.selectedCountry?.name,
      limit: 50
    }),
    {
      enabled: !!formData.selectedCountry && formData.applicationType === 'job',
      select: (response) => response.data.data?.jobs || []
    }
  );

  // Mutations
  const createApplicationMutation = useMutation(applicationsAPI.createApplication);
  const updateApplicationMutation = useMutation(applicationsAPI.updateApplication);
  const submitApplicationMutation = useMutation(applicationsAPI.submitApplication);
  const uploadDocumentMutation = useMutation(documentsAPI.uploadDocument);

  // All data now comes from API calls - no hardcoded mock data

  // Auto-save functionality
  useEffect(() => {
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer);
    }
    
    const timer = setTimeout(() => {
      autoSave();
    }, 60000); // Auto-save every 60 seconds
    
    setAutoSaveTimer(timer);
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [formData, currentStep]);

  // Load existing application if editing
  useEffect(() => {
    if (id) {
      loadExistingApplication(id);
    }
  }, [id]);

  // Update progress when step changes
  useEffect(() => {
    const progress = Math.round(((currentStep + 1) / steps.length) * 100);
    setFormData(prev => ({ 
      ...prev, 
      currentStep, 
      progress 
    }));
  }, [currentStep, steps.length]);

  const loadExistingApplication = async (applicationId) => {
    try {
      const response = await applicationsAPI.getApplication(applicationId);
      const application = response.data.data?.application;
      
      if (application) {
        setFormData({
          ...application,
          applicationType: application.type,
          currentStep: application.current_step || 0,
          progress: application.progress || 0
        });
        setCurrentStep(application.current_step || 0);
        setUploadedDocuments(application.documents || []);
      }
    } catch (error) {
      toast.error('Failed to load application');
      console.error('Error loading application:', error);
    }
  };

  const autoSave = async () => {
    try {
      const applicationData = {
        type: formData.applicationType === 'job' ? 'Job' : 'Scholarship',
        job_id: formData.selectedJob?.id || null,
        scholarship_id: formData.selectedScholarship?.id || null,
        status: 'Draft',
        current_step: currentStep,
        progress: Math.round(((currentStep + 1) / steps.length) * 100),
        passport_number: formData.additionalInfo.passportNumber || '',
        job_interest: formData.additionalInfo.jobInterest || '',
        application_data: {
          country: formData.selectedCountry,
          program: formData.selectedProgram,
          documents: uploadedDocuments.map(doc => doc.id),
          additional_info: formData.additionalInfo
        }
      };

      if (formData.id) {
        await updateApplicationMutation.mutateAsync({
          id: formData.id,
          data: applicationData
        });
      } else {
        const response = await createApplicationMutation.mutateAsync(applicationData);
        setFormData(prev => ({ ...prev, id: response.data.data?.application?.id }));
      }
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  };

  const handleNext = async () => {
    if (currentStep < steps.length - 1) {
      await autoSave(); // Save progress before moving to next step
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepClick = (stepIndex) => {
    // Only allow clicking on completed steps or current step
    if (stepIndex <= currentStep) {
      setCurrentStep(stepIndex);
    }
  };

  const handleSaveDraft = async () => {
    try {
      await autoSave();
      toast.success('Application saved successfully');
      navigate('/applications');
    } catch (error) {
      toast.error('Failed to save application');
    }
  };

  const handleSubmit = async () => {
    try {
      // Validate that we have the required selections
      if (!formData.selectedCountry) {
        toast.error('Please select a country');
        return;
      }

      if (formData.applicationType === 'scholarship' && !formData.selectedProgram) {
        toast.error('Please select a program');
        return;
      }

      if (formData.applicationType === 'scholarship' && !formData.selectedScholarship) {
        toast.error('Please select a scholarship');
        return;
      }

      if (formData.applicationType === 'job' && !formData.selectedJob) {
        toast.error('Please select a job');
        return;
      }

      const applicationData = {
        type: formData.applicationType === 'job' ? 'Job' : 'Scholarship',
        job_id: formData.selectedJob?.id || null,
        scholarship_id: formData.selectedScholarship?.id || null,
        status: 'Submitted',
        progress: 100,
        current_step: currentStep,
        submitted_at: new Date().toISOString(),
        passport_number: formData.additionalInfo.passportNumber || '',
        job_interest: formData.additionalInfo.jobInterest || '',
        application_data: {
          country: formData.selectedCountry,
          program: formData.selectedProgram,
          documents: uploadedDocuments.map(doc => doc.id),
          additional_info: formData.additionalInfo
        }
      };

      if (formData.id) {
        await submitApplicationMutation.mutateAsync({
          id: formData.id,
          data: applicationData
        });
      } else {
        await createApplicationMutation.mutateAsync(applicationData);
      }
      
      toast.success('Application submitted successfully!');
      navigate('/applications');
    } catch (error) {
      toast.error('Failed to submit application');
      console.error('Submission error:', error);
    }
  };

  const handleRestartApplication = () => {
    setFormData({
      applicationType: type,
      selectedJob: null,
      selectedScholarship: null,
      selectedCountry: null,
      selectedProgram: null,
      documents: [],
      personalInfo: {},
      additionalInfo: {},
      status: 'draft',
      progress: 0,
      currentStep: 0,
      totalSteps: type === 'job' ? 5 : 6,
    });
    setCurrentStep(0);
    setUploadedDocuments([]);
    setShowRestartModal(false);
    toast.success('Application restarted');
  };

  const handleDocumentUpload = async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'application_document');

      const response = await uploadDocumentMutation.mutateAsync(formData);
      const document = response.data.data?.document;

      if (document) {
        setUploadedDocuments(prev => [...prev, document]);
        setFormData(prev => ({
          ...prev,
          documents: [...prev.documents, document.id]
        }));
        toast.success('Document uploaded successfully');
      }
    } catch (error) {
      toast.error('Failed to upload document');
      console.error('Upload error:', error);
    }
  };

  const handleDocumentDelete = (documentId) => {
    setUploadedDocuments(prev => prev.filter(doc => doc.id !== documentId));
    setFormData(prev => ({
      ...prev,
      documents: prev.documents.filter(id => id !== documentId)
    }));
    toast.success('Document removed');
  };

  const renderStepContent = () => {
    const stepId = steps[currentStep].id;

    switch (stepId) {
      case 'selection':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Choose Application Type
              </h3>
              <p className="text-sm text-gray-600">
                Select the type of application you want to create
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card 
                className={`cursor-pointer transition-all ${
                  formData.applicationType === 'job' ? 'ring-2 ring-primary-500' : 'hover:shadow-md'
                }`}
                onClick={() => setFormData(prev => ({ ...prev, applicationType: 'job' }))}
              >
                <CardContent className="p-6 text-center">
                  <Briefcase className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                  <h4 className="font-medium text-gray-900">Job Application</h4>
                  <p className="text-sm text-gray-600 mt-2">
                    Apply for job opportunities around the world
                  </p>
                </CardContent>
              </Card>

              <Card 
                className={`cursor-pointer transition-all ${
                  formData.applicationType === 'scholarship' ? 'ring-2 ring-primary-500' : 'hover:shadow-md'
                }`}
                onClick={() => setFormData(prev => ({ ...prev, applicationType: 'scholarship' }))}
              >
                <CardContent className="p-6 text-center">
                  <GraduationCap className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                  <h4 className="font-medium text-gray-900">Scholarship Application</h4>
                  <p className="text-sm text-gray-600 mt-2">
                    Apply for scholarship opportunities
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 'country':
        const countries = countriesData || [];
        const filteredCountries = countries.filter(country =>
          country.name.toLowerCase().includes(countrySearch.toLowerCase())
        );

        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Select Target Country
              </h3>
              <p className="text-sm text-gray-600">
                Choose the country where you want to work or study
              </p>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search countries..."
                value={countrySearch}
                onChange={(e) => setCountrySearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {countriesLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                <p className="text-gray-500 mt-2">Loading countries...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCountries.map((country, index) => (
                  <Card
                    key={country.name}
                    className={`cursor-pointer transition-all ${
                      formData.selectedCountry?.name === country.name ? 'ring-2 ring-primary-500 bg-primary-50' : 'hover:shadow-md'
                    }`}
                    onClick={() => setFormData(prev => ({ 
                      ...prev, 
                      selectedCountry: country,
                      // Reset dependent selections when country changes
                      selectedProgram: null,
                      selectedScholarship: null,
                      selectedJob: null
                    }))}
                  >
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl mb-2">{country.flag}</div>
                      <h4 className="font-medium text-gray-900">{country.name}</h4>
                      {index < 3 && (
                        <Badge variant="secondary" className="mt-2 text-xs">
                          Top Opportunities Available
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {!countriesLoading && filteredCountries.length === 0 && countries.length > 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">No countries found matching your search.</p>
              </div>
            )}

            {!countriesLoading && countries.length === 0 && (
              <div className="text-center py-8">
                <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No opportunities available</h3>
                <p className="mt-1 text-sm text-gray-500">
                  There are no {formData.applicationType} opportunities available at the moment.
                </p>
              </div>
            )}
          </div>
        );

      case 'program':
        const programs = programsData || [];

        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Select Program Level
              </h3>
              <p className="text-sm text-gray-600">
                Choose the program level available in {formData.selectedCountry?.name}
              </p>
            </div>

            {programsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                <p className="text-gray-500 mt-2">Loading programs...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {programs.map((program) => (
                  <Card
                    key={program.id}
                    className={`cursor-pointer transition-all ${
                      formData.selectedProgram?.id === program.id ? 'ring-2 ring-primary-500 bg-primary-50' : 'hover:shadow-md'
                    }`}
                    onClick={() => setFormData(prev => ({ 
                      ...prev, 
                      selectedProgram: program,
                      // Reset scholarship selection when program changes
                      selectedScholarship: null
                    }))}
                  >
                    <CardContent className="p-6 text-center">
                      <GraduationCap className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                      <h4 className="font-medium text-gray-900">{program.name}</h4>
                      <p className="text-sm text-gray-600 mt-2">{program.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {!programsLoading && programs.length === 0 && (
              <div className="text-center py-8">
                <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No programs available</h3>
                <p className="mt-1 text-sm text-gray-500">
                  There are no scholarship programs available for {formData.selectedCountry?.name} at the moment.
                </p>
              </div>
            )}
          </div>
        );

      case 'scholarship':
        const scholarships = scholarshipsData || [];
        
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Select Scholarship
              </h3>
              <p className="text-sm text-gray-600">
                Choose the specific scholarship you want to apply for
              </p>
            </div>
            
            {scholarshipsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                <p className="text-gray-500 mt-2">Loading scholarships...</p>
              </div>
            ) : scholarships.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No scholarships available</h3>
                <p className="mt-1 text-sm text-gray-500">
                  No scholarships available for {formData.selectedProgram?.name} in {formData.selectedCountry?.name}.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {scholarships.map((scholarship) => (
                  <Card
                    key={scholarship.id}
                    className={`cursor-pointer transition-all ${
                      formData.selectedScholarship?.id === scholarship.id ? 'ring-2 ring-primary-500 bg-primary-50' : 'hover:shadow-md'
                    }`}
                    onClick={() => setFormData(prev => ({ ...prev, selectedScholarship: scholarship }))}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium text-gray-900">{scholarship.title}</h4>
                            {formData.selectedScholarship?.id === scholarship.id && (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            )}
                          </div>
                          <p className="text-sm text-gray-600">{scholarship.university}</p>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                            <span className="flex items-center">
                              <MapPin className="h-3 w-3 mr-1" />
                              {scholarship.country}
                            </span>
                            <span className="flex items-center">
                              <GraduationCap className="h-3 w-3 mr-1" />
                              {scholarship.program}
                            </span>
                            <span className="flex items-center">
                              <DollarSign className="h-3 w-3 mr-1" />
                              {scholarship.fee === 0 ? 'Free' : `$${scholarship.fee}`}
                            </span>
                          </div>
                        </div>
                        <div className="text-right flex flex-col space-y-2">
                          <Badge variant="outline" className="text-xs">
                            <Calendar className="h-3 w-3 mr-1" />
                            {new Date(scholarship.deadline).toLocaleDateString()}
                          </Badge>
                          <Button size="sm" variant="outline">
                            <Eye className="h-3 w-3 mr-1" />
                            Detail
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        );

      case 'job':
        const jobs = jobsData || [];
        
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Select Job
              </h3>
              <p className="text-sm text-gray-600">
                Choose the specific job you want to apply for in {formData.selectedCountry?.name}
              </p>
            </div>
            
            {jobsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                <p className="text-gray-500 mt-2">Loading jobs...</p>
              </div>
            ) : jobs.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No jobs available</h3>
                <p className="mt-1 text-sm text-gray-500">
                  No jobs available in {formData.selectedCountry?.name} at the moment.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {jobs.map((job) => (
                  <Card
                    key={job.id}
                    className={`cursor-pointer transition-all ${
                      formData.selectedJob?.id === job.id ? 'ring-2 ring-primary-500 bg-primary-50' : 'hover:shadow-md'
                    }`}
                    onClick={() => setFormData(prev => ({ ...prev, selectedJob: job }))}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium text-gray-900">{job.name}</h4>
                            {formData.selectedJob?.id === job.id && (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            )}
                          </div>
                          <p className="text-sm text-gray-600">{job.company?.name || job.company}</p>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                            <span className="flex items-center">
                              <MapPin className="h-3 w-3 mr-1" />
                              {job.country}
                            </span>
                            <span className="flex items-center">
                              <Briefcase className="h-3 w-3 mr-1" />
                              {job.job_type || 'Full-time'}
                            </span>
                            {job.salary_range && (
                              <span className="flex items-center">
                                <DollarSign className="h-3 w-3 mr-1" />
                                {job.salary_range}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right flex flex-col space-y-2">
                          <Badge variant="outline" className="text-xs">
                            <Calendar className="h-3 w-3 mr-1" />
                            {new Date(job.deadline).toLocaleDateString()}
                          </Badge>
                          <Button size="sm" variant="outline">
                            <Eye className="h-3 w-3 mr-1" />
                            Detail
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        );

      case 'documents':
        const getRequiredDocuments = () => {
          if (formData.applicationType === 'job') {
            return [
              { name: 'Resume/CV', required: true, uploaded: uploadedDocuments.some(doc => doc.type === 'resume') },
              { name: 'Cover Letter', required: true, uploaded: uploadedDocuments.some(doc => doc.type === 'cover_letter') },
              { name: 'ID/Passport Copy', required: true, uploaded: uploadedDocuments.some(doc => doc.type === 'id_passport') },
              { name: 'Recommendation Letters', required: false, uploaded: uploadedDocuments.some(doc => doc.type === 'recommendation') },
            ];
          } else {
            return [
              { name: 'Academic Transcript', required: true, uploaded: uploadedDocuments.some(doc => doc.type === 'transcript') },
              { name: 'Recommendation Letter', required: true, uploaded: uploadedDocuments.some(doc => doc.type === 'recommendation') },
              { name: 'Personal Statement', required: true, uploaded: uploadedDocuments.some(doc => doc.type === 'personal_statement') },
              { name: 'Passport Copy', required: true, uploaded: uploadedDocuments.some(doc => doc.type === 'passport') },
              { name: 'English Proficiency', required: false, uploaded: uploadedDocuments.some(doc => doc.type === 'english_proficiency') },
            ];
          }
        };

        const requiredDocs = getRequiredDocuments();

        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Documents & Additional Information
              </h3>
              <p className="text-sm text-gray-600">
                Upload required documents and provide additional information
              </p>
            </div>

            <div className="space-y-6">
              {/* Document Upload Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Required Documents
                </label>
                
                {/* Drop Zone */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-400 transition-colors">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-4">
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <span className="mt-2 block text-sm font-medium text-gray-900">
                        Drop files here or click to upload
                      </span>
                      <span className="mt-1 block text-sm text-gray-500">
                        PDF, DOC, DOCX, PNG, JPG (MAX. 10MB each)
                      </span>
                    </label>
                    <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      multiple
                      className="sr-only"
                      accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                      onChange={(e) => {
                        Array.from(e.target.files).forEach(file => {
                          handleDocumentUpload(file);
                        });
                      }}
                    />
                  </div>
                </div>

                {/* Document Checklist */}
                <div className="mt-6 space-y-3">
                  {requiredDocs.map((doc, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        {doc.uploaded ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                        )}
                        <div>
                          <span className="text-sm font-medium text-gray-900">{doc.name}</span>
                          {doc.required && (
                            <Badge variant="danger" className="ml-2 text-xs">Required</Badge>
                          )}
                        </div>
                      </div>
                      <Button size="sm" variant="outline">
                        <Upload className="h-4 w-4 mr-1" />
                        Upload
                      </Button>
                    </div>
                  ))}
                </div>

                {/* Uploaded Documents Preview */}
                {uploadedDocuments.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Uploaded Documents</h4>
                    <div className="space-y-2">
                      {uploadedDocuments.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <FileText className="h-4 w-4 text-gray-400" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">{doc.original_name}</p>
                              <p className="text-xs text-gray-500">
                                {new Date(doc.uploaded_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button size="sm" variant="outline">
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Download className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleDocumentDelete(doc.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Additional Information */}
              <div>
                <label htmlFor="additional-info" className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Information
                </label>
                <Textarea
                  id="additional-info"
                  rows={4}
                  placeholder="Provide any additional information that might be relevant to your application..."
                  value={formData.additionalInfo.notes || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    additionalInfo: { ...prev.additionalInfo, notes: e.target.value }
                  }))}
                />
              </div>

              {/* Job-specific fields */}
              {formData.applicationType === 'job' && (
                <div>
                  <label htmlFor="job-interest" className="block text-sm font-medium text-gray-700 mb-2">
                    Why are you interested in this position?
                  </label>
                  <Textarea
                    id="job-interest"
                    rows={3}
                    placeholder="Explain your interest in this position..."
                    value={formData.additionalInfo.jobInterest || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      additionalInfo: { ...prev.additionalInfo, jobInterest: e.target.value }
                    }))}
                  />
                </div>
              )}

              {/* Scholarship-specific fields */}
              {formData.applicationType === 'scholarship' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="major" className="block text-sm font-medium text-gray-700 mb-2">
                      Intended Major
                    </label>
                    <select
                      id="major"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                      value={formData.additionalInfo.major || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        additionalInfo: { ...prev.additionalInfo, major: e.target.value }
                      }))}
                    >
                      <option value="">Select major</option>
                      <option value="Computer Science">Computer Science</option>
                      <option value="Business Administration">Business Administration</option>
                      <option value="Engineering">Engineering</option>
                      <option value="Medicine">Medicine</option>
                      <option value="Law">Law</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="passport" className="block text-sm font-medium text-gray-700 mb-2">
                      Passport Number
                    </label>
                    <Input
                      id="passport"
                      placeholder="Enter passport number"
                      value={formData.additionalInfo.passportNumber || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        additionalInfo: { ...prev.additionalInfo, passportNumber: e.target.value }
                      }))}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 'summary':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Review Your Application
              </h3>
              <p className="text-sm text-gray-600">
                Please review all information before submitting your application
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Application Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Type:</span>
                    <span className="ml-2 text-gray-900 capitalize">
                      {formData.applicationType}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Country:</span>
                    <span className="ml-2 text-gray-900">
                      {formData.selectedCountry?.name}
                    </span>
                  </div>
                  {formData.selectedProgram && (
                    <div>
                      <span className="font-medium text-gray-700">Program:</span>
                      <span className="ml-2 text-gray-900">{formData.selectedProgram.name}</span>
                    </div>
                  )}
                  {formData.selectedScholarship && (
                    <div>
                      <span className="font-medium text-gray-700">Scholarship:</span>
                      <span className="ml-2 text-gray-900">{formData.selectedScholarship.name}</span>
                    </div>
                  )}
                  {formData.selectedJob && (
                    <div>
                      <span className="font-medium text-gray-700">Job:</span>
                      <span className="ml-2 text-gray-900">{formData.selectedJob.name}</span>
                    </div>
                  )}
                </div>
              </div>

              {formData.additionalInfo.notes && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Additional Information</h4>
                  <p className="text-sm text-gray-600">{formData.additionalInfo.notes}</p>
                </div>
              )}

              <div>
                <h4 className="font-medium text-gray-900 mb-3">Required Documents</h4>
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    <span>Resume/CV</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    <span>Academic Transcripts</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    <span>Cover Letter</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const canProceed = () => {
    const stepId = steps[currentStep].id;
    
    switch (stepId) {
      case 'selection':
        return formData.applicationType;
      case 'country':
        return formData.selectedCountry;
      case 'program':
        return formData.selectedProgram;
      case 'job':
        return formData.selectedJob;
      case 'scholarship':
        return formData.selectedScholarship;
      case 'documents':
        // Check if required documents are uploaded
        if (formData.applicationType === 'job') {
          const hasResume = uploadedDocuments.some(doc => doc.type === 'resume');
          const hasCoverLetter = uploadedDocuments.some(doc => doc.type === 'cover_letter');
          const hasIdPassport = uploadedDocuments.some(doc => doc.type === 'id_passport');
          return hasResume && hasCoverLetter && hasIdPassport;
        } else {
          const hasTranscript = uploadedDocuments.some(doc => doc.type === 'transcript');
          const hasRecommendation = uploadedDocuments.some(doc => doc.type === 'recommendation');
          const hasPersonalStatement = uploadedDocuments.some(doc => doc.type === 'personal_statement');
          const hasPassport = uploadedDocuments.some(doc => doc.type === 'passport');
          return hasTranscript && hasRecommendation && hasPersonalStatement && hasPassport;
        }
      case 'summary':
        return true;
      default:
        return false;
    }
  };

  const getValidationMessage = () => {
    const stepId = steps[currentStep].id;
    
    if (stepId === 'documents') {
      if (formData.applicationType === 'job') {
        const missingDocs = [];
        if (!uploadedDocuments.some(doc => doc.type === 'resume')) missingDocs.push('Resume/CV');
        if (!uploadedDocuments.some(doc => doc.type === 'cover_letter')) missingDocs.push('Cover Letter');
        if (!uploadedDocuments.some(doc => doc.type === 'id_passport')) missingDocs.push('ID/Passport Copy');
        
        if (missingDocs.length > 0) {
          return `Please upload required documents: ${missingDocs.join(', ')}`;
        }
      } else {
        const missingDocs = [];
        if (!uploadedDocuments.some(doc => doc.type === 'transcript')) missingDocs.push('Academic Transcript');
        if (!uploadedDocuments.some(doc => doc.type === 'recommendation')) missingDocs.push('Recommendation Letter');
        if (!uploadedDocuments.some(doc => doc.type === 'personal_statement')) missingDocs.push('Personal Statement');
        if (!uploadedDocuments.some(doc => doc.type === 'passport')) missingDocs.push('Passport Copy');
        
        if (missingDocs.length > 0) {
          return `Please upload required documents: ${missingDocs.join(', ')}`;
        }
      }
    }
    
    return null;
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {type === 'job' ? 'Job Application' : 'Scholarship Application'}
        </h1>
        <p className="text-gray-600 mt-2">
          Complete the steps below to submit your application
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
          <span>Application Progress</span>
          <span>{formData.progress}%</span>
        </div>
        <ProgressBar value={formData.progress} size="lg" />
        <p className="text-xs text-gray-500 mt-1 text-center">
          Step {currentStep + 1} of {steps.length}
        </p>
      </div>

      {/* Stepper */}
      <Stepper
        steps={steps}
        currentStep={currentStep}
        onStepClick={handleStepClick}
      />

      {/* Step Content */}
      <Card>
        <CardContent className="p-8">
          {renderStepContent()}
        </CardContent>
      </Card>

      {/* Validation Message */}
      {!canProceed() && getValidationMessage() && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
            <p className="text-sm text-yellow-800">{getValidationMessage()}</p>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 0}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>

        <div className="flex space-x-3">
          <Button variant="outline" onClick={handleSaveDraft}>
            <Save className="mr-2 h-4 w-4" />
            Save & Leave
          </Button>

          {currentStep < steps.length - 1 ? (
            <Button onClick={handleNext} disabled={!canProceed()}>
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={!canProceed()}>
              <Send className="mr-2 h-4 w-4" />
              Submit Application
            </Button>
          )}
        </div>
      </div>

      {/* Restart Modal */}
      <Modal
        isOpen={showRestartModal}
        onClose={() => setShowRestartModal(false)}
        title="Restart Application"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to restart this application? All your progress will be lost and cannot be recovered.
          </p>
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={() => setShowRestartModal(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleRestartApplication}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Restart Application
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ApplicationWizard;


