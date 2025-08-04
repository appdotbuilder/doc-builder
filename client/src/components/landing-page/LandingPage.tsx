
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { TemplateCategory } from '../../../../server/src/schema';

interface LandingPageProps {
  categories: TemplateCategory[];
  onCategorySelect: (category: TemplateCategory) => void;
}

export function LandingPage({ categories, onCategorySelect }: LandingPageProps) {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="py-20 px-4 text-center">
        <div className="container mx-auto max-w-4xl">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-800 mb-6">
            Create Professional 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600"> Documents</span>
            <br />in Minutes
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Choose from hundreds of professional templates, fill them out with our intuitive editor, 
            and download your completed documents instantly.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-6">
              🚀 Start Creating
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-6">
              ▶️ Watch Demo
            </Button>
          </div>
          
          {/* Trust indicators */}
          <div className="mt-12 flex flex-wrap justify-center items-center gap-8 text-gray-500 text-sm">
            <div className="flex items-center gap-2">
              <span>⭐</span>
              <span>4.9/5 rating</span>
            </div>
            <div className="flex items-center gap-2">
              <span>👥</span>
              <span>50K+ users</span>
            </div>
            <div className="flex items-center gap-2">
              <span>📄</span>
              <span>1M+ documents created</span>
            </div>
          </div>
        </div>
      </section>

      {/* Template Categories */}
      <section className="py-16 px-4 bg-white/50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              Choose Your Template Category
            </h2>
            <p className="text-gray-600 text-lg">
              Professional templates for every need
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {categories.map((category: TemplateCategory) => (
              <Card 
                key={category.id}
                className="hover:shadow-lg transition-all duration-300 cursor-pointer group border-2 hover:border-blue-200"
                onClick={() => onCategorySelect(category)}
              >
                <CardHeader className="text-center pb-4">
                  <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">
                    {category.icon_url}
                  </div>
                  <CardTitle className="text-xl group-hover:text-blue-600 transition-colors">
                    {category.name}
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    {category.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <Button 
                    variant="outline" 
                    className="w-full group-hover:bg-blue-50 group-hover:border-blue-300"
                  >
                    Explore Templates →
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              Why Choose DocuCraft?
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-semibold mb-2">Lightning Fast</h3>
              <p className="text-gray-600">Create professional documents in minutes, not hours</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">🎨</div>
              <h3 className="text-xl font-semibold mb-2">Beautiful Templates</h3>
              <p className="text-gray-600">Professionally designed templates for every industry</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">📱</div>
              <h3 className="text-xl font-semibold mb-2">Works Everywhere</h3>
              <p className="text-gray-600">Access from any device, edit in your browser</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-16 px-4 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            Start Free, Upgrade When Ready
          </h2>
          <p className="text-gray-600 mb-8">
            7-day free trial • No credit card required
          </p>
          
          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-2">Free Trial</h3>
              <div className="text-2xl font-bold text-blue-600 mb-4">7 Days Free</div>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>✅ Access to all templates</li>
                <li>✅ Unlimited documents</li>
                <li>✅ PDF & Word export</li>
              </ul>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md relative">
              <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-purple-600">
                Most Popular
              </Badge>
              <h3 className="text-lg font-semibold mb-2">Premium</h3>
              <div className="text-2xl font-bold text-purple-600 mb-4">€9.95/mo</div>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>✅ Everything in Free</li>
                <li>✅ Priority support</li>
                <li>✅ Advanced features</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
