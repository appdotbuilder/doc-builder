
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

  // Generate form fields based on template type
  const getFormFields = useCallback(() => {
    // This would normally come from template.template_data
    const baseFields = [
      { id: 'full_name', label: 'Full Name', type: 'text', required: true, step: 0 },
      { id: 'email', label: 'Email Address', type: 'email', required: true, step: 0 },
      { id: 'phone', label: 'Phone Number', type: 'tel', required: false, step: 0 },
      { id: 'address', label: 'Address', type: 'textarea', required: true, step: 1 },
      { id: 'company', label: 'Company Name', type: 'text', required: false, step: 1 },
      { id: 'position', label: 'Position/Title', type: 'text', required: false, step: 1 },
      { id: 'additional_info', label: 'Additional Information', type: 'textarea', required: false, step: 2 }
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
                  <CardTitle className="text-lg">📄 Live Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-white border-2 border-gray-200 rounded p-4 min-h-[400px] text-sm">
                    <div className="text-center mb-4 font-bold text-lg">
                      {documentTitle}
                    </div>
                    <div className="space-y-3 text-gray-700">
                      {Object.entries(formData).map(([key, value]) => {
                        const field = formFields.find(f => f.id === key);
                        if (!value || !field) return null;
                        return (
                          <div key={key} className="border-b pb-2">
                            <div className="font-medium text-gray-800">{field.label}:</div>
                            <div className="bg-yellow-100 px-2 py-1 rounded">
                              {value}
                            </div>
                          </div>
                        );
                      })}
                      
                      {Object.keys(formData).length === 0 && (
                        <div className="text-center text-gray-400 py-8">
                          Fill out the form to see your document preview
                        </div>
                      )}
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
