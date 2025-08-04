
import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { trpc } from '@/utils/trpc';
import type { Template, User, UserDocument, CreateUserDocumentInput } from '../../../../server/src/schema';

interface DocumentEditorProps {
  template: Template;
  user: User | null;
  onAuthRequired: () => void;
  onSubscriptionRequired: () => void;
  onDocumentSaved: (document: UserDocument) => void;
  onBack: () => void;
}

interface FormData {
  [key: string]: string;
}

export function DocumentEditor({ 
  template, 
  user, 
  onAuthRequired, 
  onSubscriptionRequired, 
  onDocumentSaved, 
  onBack 
}: DocumentEditorProps) {
  const [formData, setFormData] = useState<FormData>({});
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [documentTitle, setDocumentTitle] = useState(`${template.title} - ${new Date().toLocaleDateString()}`);

  // Generate form fields based on template type with placeholder examples
  const getFormFields = useCallback(() => {
    // This would normally come from template.template_data
    const baseFields = [
      { id: 'full_name', label: 'Full Name', type: 'text', required: true, step: 0, placeholder: '[FULL_NAME]' },
      { id: 'email', label: 'Email Address', type: 'email', required: true, step: 0, placeholder: '[EMAIL]' },
      { id: 'phone', label: 'Phone Number', type: 'tel', required: false, step: 0, placeholder: '[PHONE]' },
      { id: 'address', label: 'Address', type: 'textarea', required: true, step: 1, placeholder: '[ADDRESS]' },
      { id: 'company', label: 'Company Name', type: 'text', required: false, step: 1, placeholder: '[COMPANY]' },
      { id: 'position', label: 'Position/Title', type: 'text', required: false, step: 1, placeholder: '[POSITION]' },
      { id: 'additional_info', label: 'Additional Information', type: 'textarea', required: false, step: 2, placeholder: '[ADDITIONAL_INFO]' }
    ];

    return baseFields;
  }, []);

  const formFields = getFormFields();
  const steps = [...new Set(formFields.map(field => field.step))].sort();
  const currentStepFields = formFields.filter(field => field.step === currentStep);
  const isLastStep = currentStep === steps[steps.length - 1];

  // Handle form field changes
  const handleFieldChange = (fieldId: string, value: string) => {
    setFormData((prev: FormData) => ({
      ...prev,
      [fieldId]: value
    }));
  };

  // Check if premium template requires subscription
  const canUseTemplate = () => {
    if (!template.is_premium) return true;
    if (!user) return false;
    return user.subscription_type === 'premium' || 
           (user.trial_ends_at && new Date(user.trial_ends_at) > new Date());
  };

  // Handle next step
  const handleNext = () => {
    if (isLastStep) {
      handleSave();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  // Handle previous step
  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  // Handle document save
  const handleSave = async () => {
    // Check authentication
    if (!user) {
      onAuthRequired();
      return;
    }

    // Check premium access
    if (template.is_premium && !canUseTemplate()) {
      onSubscriptionRequired();
      return;
    }

    setIsLoading(true);
    try {
      const documentInput: CreateUserDocumentInput = {
        user_id: user.id,
        template_id: template.id,
        title: documentTitle,
        document_data: formData,
        status: 'completed'
      };

      const savedDocument = await trpc.createUserDocument.mutate(documentInput);
      
      // Fallback document response
      const fallbackDocument: UserDocument = {
        id: Date.now(),
        user_id: user.id,
        template_id: template.id,
        title: documentTitle,
        document_data: formData,
        file_url: null,
        file_type: null,
        status: 'completed',
        is_favorite: false,
        created_at: new Date(),
        updated_at: new Date()
      };

      onDocumentSaved(savedDocument.id ? savedDocument : fallbackDocument);
    } catch (error) {
      console.error('Failed to save document:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle individual purchase
  const handlePurchase = async () => {
    if (!user) {
      onAuthRequired();
      return;
    }

    if (!template.price) return;

    try {
      await trpc.createPurchase.mutate({
        user_id: user.id,
        template_id: template.id,
        purchase_type: 'individual_document',
        amount: template.price,
        currency: 'EUR'
      });
      
      // After purchase, user can use the template
      handleSave();
    } catch (error) {
      console.error('Purchase failed:', error);
    }
  };

  return (
    <div className="min-h-screen py-8 px-4 bg-gray-50">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={onBack}
            className="mb-4 text-gray-600 hover:text-gray-800"
          >
            ← Back to Templates
          </Button>
          
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Form Section */}
            <div className="flex-1">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-2xl mb-2">{template.title}</CardTitle>
                      {template.is_premium && (
                        <Badge className="bg-purple-100 text-purple-800 mb-3">
                          👑 Premium Template
                        </Badge>
                      )}
                      <p className="text-gray-600">{template.description}</p>
                    </div>
                  </div>
                  
                  {/* Progress indicator */}
                  <div className="mt-6">
                    <div className="flex justify-between text-sm text-gray-500 mb-2">
                      <span>Step {currentStep + 1} of {steps.length}</span>
                      <span>{Math.round(((currentStep + 1) / steps.length) * 100)}% Complete</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                      />
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  {/* Document Title */}
                  <div>
                    <Label htmlFor="document_title" className="text-sm font-medium">
                      Document Title
                    </Label>
                    <Input
                      id="document_title"
                      value={documentTitle}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDocumentTitle(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  
                  <Separator />

                  {/* Form Fields for Current Step */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">
                      {currentStep === 0 && '📝 Personal Information'}
                      {currentStep === 1 && '🏢 Professional Details'}
                      {currentStep === 2 && '📋 Additional Information'}
                    </h3>
                    
                    {currentStepFields.map((field) => (
                      <div key={field.id}>
                        <Label htmlFor={field.id} className="text-sm font-medium">
                          {field.label}
                          {field.required && <span className="text-red-500 ml-1">*</span>}
                        </Label>
                        {field.type === 'textarea' ? (
                          <Textarea
                            id={field.id}
                            value={formData[field.id] || ''}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => 
                              handleFieldChange(field.id, e.target.value)
                            }
                            className="mt-1"
                            rows={3}
                          />
                        ) : (
                          <Input
                            id={field.id}
                            type={field.type}
                            value={formData[field.id] || ''}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                              handleFieldChange(field.id, e.target.value)
                            }
                            className="mt-1"
                            required={field.required}
                          />
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Navigation Buttons */}
                  <div className="flex justify-between pt-6">
                    <Button 
                      variant="outline" 
                      onClick={handlePrevious}
                      disabled={currentStep === 0}
                    >
                      Previous
                    </Button>
                    
                    <div className="space-x-2">
                      {template.is_premium && !canUseTemplate() && (
                        <Button 
                          onClick={handlePurchase}
                          className="bg-purple-600 hover:bg-purple-700"
                          disabled={isLoading}
                        >
                          💳 Buy for €{template.price?.toFixed(2)}
                        </Button>
                      )}
                      
                      <Button 
                        onClick={handleNext}
                        disabled={isLoading || (template.is_premium && !canUseTemplate())}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {isLoading ? 'Saving...' : isLastStep ? '💾 Save Document' : 'Next'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Preview Section */}
            <div className="lg:w-80">
              <Card className="sticky top-24">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">📄 Live Preview</CardTitle>
                    <div className="group relative">
                      <div className="text-blue-500 cursor-help">ℹ️</div>
                      <div className="absolute right-0 top-6 w-72 p-3 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                        <div className="text-sm">
                          <div className="font-semibold text-blue-800 mb-2">📝 Template Editing Mode</div>
                          <p className="text-gray-700 mb-2">This preview shows structured template field replacement for professional document creation.</p>
                          <p className="text-xs text-gray-600">Full editing of uploaded .doc/.pdf files requires advanced integrations (Microsoft Graph, Adobe PDF Services, etc.)</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    💡 Simulated template preview showing how placeholders will be replaced
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="bg-white border-2 border-gray-200 rounded p-4 min-h-[400px] text-sm font-mono leading-relaxed">
                    <div className="text-center mb-6 font-bold text-lg not-italic">
                      {documentTitle}
                    </div>
                    
                    {/* Document-like preview with filled placeholders */}
                    <div className="space-y-4 text-gray-800">
                      <div className="border-b border-dotted border-gray-300 pb-3">
                        <div className="text-sm font-semibold mb-2 not-italic">PERSONAL INFORMATION</div>
                        <div className="space-y-1">
                          <div>
                            Name: <span className={formData.full_name ? "bg-green-100 px-1 font-semibold" : "bg-gray-100 px-1"}>
                              {formData.full_name || '[FULL_NAME]'}
                            </span>
                          </div>
                          <div>
                            Email: <span className={formData.email ? "bg-green-100 px-1 font-semibold" : "bg-gray-100 px-1"}>
                              {formData.email || '[EMAIL]'}
                            </span>
                          </div>
                          <div>
                            Phone: <span className={formData.phone ? "bg-green-100 px-1 font-semibold" : "bg-gray-100 px-1"}>
                              {formData.phone || '[PHONE]'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="border-b border-dotted border-gray-300 pb-3">
                        <div className="text-sm font-semibold mb-2 not-italic">PROFESSIONAL DETAILS</div>
                        <div className="space-y-1">
                          <div>
                            Company: <span className={formData.company ? "bg-green-100 px-1 font-semibold" : "bg-gray-100 px-1"}>
                              {formData.company || '[COMPANY]'}
                            </span>
                          </div>
                          <div>
                            Position: <span className={formData.position ? "bg-green-100 px-1 font-semibold" : "bg-gray-100 px-1"}>
                              {formData.position || '[POSITION]'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="border-b border-dotted border-gray-300 pb-3">
                        <div className="text-sm font-semibold mb-2 not-italic">ADDRESS</div>
                        <div className={formData.address ? "bg-green-100 px-1 py-2 font-semibold" : "bg-gray-100 px-1 py-2"}>
                          {formData.address || '[ADDRESS]'}
                        </div>
                      </div>

                      {formData.additional_info && (
                        <div className="border-b border-dotted border-gray-300 pb-3">
                          <div className="text-sm font-semibold mb-2 not-italic">ADDITIONAL INFORMATION</div>
                          <div className="bg-green-100 px-1 py-2 font-semibold">
                            {formData.additional_info}
                          </div>
                        </div>
                      )}
                      
                      {Object.keys(formData).length === 0 && (
                        <div className="text-center text-gray-400 py-8 not-italic">
                          📝 Fill out the form to see how your data replaces the [placeholders]
                        </div>
                      )}
                    </div>

                    <div className="mt-6 p-3 bg-blue-50 rounded text-xs text-blue-700 border border-blue-200 not-italic">
                      <div className="font-semibold mb-1">ℹ️ About Document Editing:</div>
                      <div>This preview shows structured template filling. Full editing of uploaded .doc/.pdf files requires external integrations (Microsoft Graph, Google Docs API, etc.).</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
