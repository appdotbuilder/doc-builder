
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { trpc } from '@/utils/trpc';
import type { TemplateCategory, Template } from '../../../../server/src/schema';

interface TemplateGalleryProps {
  category: TemplateCategory;
  onTemplateSelect: (template: Template) => void;
  onBack: () => void;
}

export function TemplateGallery({ category, onTemplateSelect, onBack }: TemplateGalleryProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Load templates for the selected category
  const loadTemplates = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await trpc.getTemplatesByCategory.query({
        category_id: category.id,
        limit: 20,
        offset: 0
      });

      // Fallback templates for demonstration
      const fallbackTemplates: Template[] = [
        {
          id: 1,
          title: 'Business Plan Template',
          description: 'Comprehensive business plan template for startups and established businesses',
          category_id: category.id,
          template_data: { sections: ['executive_summary', 'market_analysis', 'financial_projections'] },
          preview_url: null,
          is_premium: false,
          price: null,
          downloads_count: 1250,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 2,
          title: 'Professional Resume',
          description: 'Modern resume template with clean design',
          category_id: category.id,
          template_data: { sections: ['personal_info', 'experience', 'education', 'skills'] },
          preview_url: null,
          is_premium: true,
          price: 1.99,
          downloads_count: 3420,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 3,
          title: 'Invoice Template',
          description: 'Professional invoice template for freelancers and businesses',
          category_id: category.id,
          template_data: { sections: ['company_info', 'client_info', 'items', 'payment_terms'] },
          preview_url: null,
          is_premium: false,
          price: null,
          downloads_count: 890,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 4,
          title: 'Contract Agreement',
          description: 'Customizable contract template for various business agreements',
          category_id: category.id,
          template_data: { sections: ['parties', 'terms', 'conditions', 'signatures'] },
          preview_url: null,
          is_premium: true,
          price: 1.99,
          downloads_count: 567,
          created_at: new Date(),
          updated_at: new Date()
        }
      ];

      setTemplates(result.length > 0 ? result : fallbackTemplates);
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setIsLoading(false);
    }
  }, [category.id]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  // Filter templates based on search term
  const filteredTemplates = templates.filter((template: Template) =>
    template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (template.description && template.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={onBack}
            className="mb-4 text-gray-600 hover:text-gray-800"
          >
            ← Back to Categories
          </Button>
          
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">{category.icon_url}</span>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                {category.name} Templates
              </h1>
              <p className="text-gray-600">{category.description}</p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="max-w-md">
            <Input
              type="text"
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">⏳</div>
            <p className="text-gray-600">Loading templates...</p>
          </div>
        )}

        {/* Templates Grid */}
        {!isLoading && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template: Template) => (
              <Card 
                key={template.id}
                className="hover:shadow-lg transition-all duration-300 cursor-pointer group border hover:border-blue-200"
                onClick={() => onTemplateSelect(template)}
              >
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start mb-2">
                    <CardTitle className="text-lg group-hover:text-blue-600 transition-colors flex-1">
                      {template.title}
                    </CardTitle>
                    {template.is_premium && (
                      <Badge variant="secondary" className="bg-purple-100 text-purple-800 ml-2">
                        👑 Premium
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="text-gray-600">
                    {template.description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span>📥</span>
                      <span>{template.downloads_count.toLocaleString()} downloads</span>
                    </div>
                    {template.is_premium && template.price && (
                      <div className="text-lg font-semibold text-purple-600">
                        €{template.price.toFixed(2)}
                      </div>
                    )}
                  </div>
                  
                  <Button 
                    className="w-full group-hover:bg-blue-600 group-hover:text-white transition-colors"
                    variant={template.is_premium ? "default" : "outline"}
                  >
                    {template.is_premium ? '👑 Use Premium Template' : '🆓 Use Free Template'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredTemplates.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No templates found</h3>
            <p className="text-gray-600">
              {searchTerm 
                ? `No templates match "${searchTerm}". Try adjusting your search.`
                : 'No templates available in this category yet.'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
