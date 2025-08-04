
import { useState, useEffect, useCallback } from 'react';
import { trpc } from '@/utils/trpc';
import type { TemplateCategory, Template, User, UserDocument } from '../../server/src/schema';

// Import feature components
import { LandingPage } from '@/components/landing-page/LandingPage';
import { TemplateGallery } from '@/components/template-gallery/TemplateGallery';
import { DocumentEditor } from '@/components/document-editor/DocumentEditor';
import { UserDashboard } from '@/components/user-dashboard/UserDashboard';
import { AuthModal } from '@/components/auth/AuthModal';
import { SubscriptionModal } from '@/components/subscription/SubscriptionModal';
import { Navbar } from '@/components/navigation/Navbar';

// Demo user for demonstration purposes
const demoUser: User = {
  id: 1,
  email: 'demo@example.com',
  name: 'Demo User',
  avatar_url: null,
  subscription_type: 'free',
  subscription_expires_at: null,
  trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
  created_at: new Date(),
  updated_at: new Date()
};

type AppView = 'landing' | 'templates' | 'editor' | 'dashboard';

function App() {
  const [currentView, setCurrentView] = useState<AppView>('landing');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  
  // Template-related state
  const [categories, setCategories] = useState<TemplateCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  
  // Document-related state
  const [currentDocument, setCurrentDocument] = useState<UserDocument | null>(null);

  // Load template categories on mount
  const loadCategories = useCallback(async () => {
    try {
      const result = await trpc.getTemplateCategories.query();
      // Fallback categories for demonstration
      const fallbackCategories: TemplateCategory[] = [
        {
          id: 1,
          name: 'Business',
          slug: 'business',
          description: 'Professional documents for business needs',
          icon_url: '📊',
          sort_order: 1,
          created_at: new Date()
        },
        {
          id: 2,
          name: 'Personal',
          slug: 'personal',
          description: 'Personal documents and forms',
          icon_url: '👤',
          sort_order: 2,
          created_at: new Date()
        },
        {
          id: 3,
          name: 'Real Estate',
          slug: 'real-estate',
          description: 'Property and real estate documents',
          icon_url: '🏠',
          sort_order: 3,
          created_at: new Date()
        }
      ];
      setCategories(result.length > 0 ? result : fallbackCategories);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // Handle category selection from landing page
  const handleCategorySelect = (category: TemplateCategory) => {
    setSelectedCategory(category);
    setCurrentView('templates');
  };

  // Handle template selection
  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template);
    setCurrentView('editor');
  };

  // Handle authentication requirement
  const handleAuthRequired = () => {
    setShowAuthModal(true);
  };

  // Handle login/register
  const handleAuth = (userData: User) => {
    setUser(userData);
    setIsAuthenticated(true);
    setShowAuthModal(false);
  };

  // Handle subscription requirement
  const handleSubscriptionRequired = () => {
    setShowSubscriptionModal(true);
  };

  // Handle navigation
  const handleNavigation = (view: AppView) => {
    if ((view === 'dashboard') && !isAuthenticated) {
      handleAuthRequired();
      return;
    }
    
    // For templates view, show all categories if none selected
    if (view === 'templates' && !selectedCategory && categories.length > 0) {
      // Auto-select first category or let user choose
      setSelectedCategory(null); // Let TemplateGallery handle this
    }
    
    setCurrentView(view);
  };

  // Demo login for testing purposes
  const handleDemoLogin = () => {
    setUser(demoUser);
    setIsAuthenticated(true);
    setShowAuthModal(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Navbar 
        isAuthenticated={isAuthenticated}
        user={user}
        onNavigate={handleNavigation}
        onLogin={() => setShowAuthModal(true)}
        onLogout={() => {
          setIsAuthenticated(false);
          setUser(null);
          setCurrentView('landing');
        }}
      />

      <main className="pt-16">
        {currentView === 'landing' && (
          <LandingPage 
            categories={categories}
            onCategorySelect={handleCategorySelect}
            onStartCreating={() => setCurrentView('templates')}
          />
        )}

        {currentView === 'templates' && (
          <TemplateGallery
            category={selectedCategory}
            categories={categories}
            onCategorySelect={handleCategorySelect}
            onTemplateSelect={handleTemplateSelect}
            onBack={() => setCurrentView('landing')}
          />
        )}

        {currentView === 'editor' && selectedTemplate && (
          <DocumentEditor
            template={selectedTemplate}
            user={user}
            onAuthRequired={handleAuthRequired}
            onSubscriptionRequired={handleSubscriptionRequired}
            onDocumentSaved={(document: UserDocument) => {
              setCurrentDocument(document);
              setCurrentView('dashboard');
            }}
            onBack={() => setCurrentView('templates')}
          />
        )}

        {currentView === 'dashboard' && isAuthenticated && user && (
          <UserDashboard
            user={user}
            currentDocument={currentDocument}
          />
        )}
      </main>

      {/* Modals */}
      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onAuth={handleAuth}
          onDemoLogin={handleDemoLogin}
        />
      )}

      {showSubscriptionModal && user && (
        <SubscriptionModal
          user={user}
          onClose={() => setShowSubscriptionModal(false)}
          onSubscribed={(updatedUser: User) => {
            setUser(updatedUser);
            setShowSubscriptionModal(false);
          }}
        />
      )}
    </div>
  );
}

export default App;
