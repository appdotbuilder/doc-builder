
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { trpc } from '@/utils/trpc';
import type { User, UserDocument } from '../../../../server/src/schema';

interface UserDashboardProps {
  user: User;
  currentDocument?: UserDocument | null;
}

export function UserDashboard({ user, currentDocument }: UserDashboardProps) {
  const [documents, setDocuments] = useState<UserDocument[]>([]);
  const [favorites, setFavorites] = useState<UserDocument[]>([]);
  const [trashedDocs, setTrashedDocs] = useState<UserDocument[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Load user documents
  const loadDocuments = useCallback(async () => {
    setIsLoading(true);
    try {
      // Load different document categories
      const [allDocs, favDocs, trashDocs] = await Promise.all([
        trpc.getUserDocuments.query({ 
          user_id: user.id, 
          status: 'completed' 
        }),
        trpc.getUserDocuments.query({ 
          user_id: user.id, 
          is_favorite: true 
        }),
        trpc.getUserDocuments.query({ 
          user_id: user.id, 
          status: 'trashed' 
        })
      ]);

      // Fallback documents for demonstration
      const fallbackDocuments: UserDocument[] = [
        {
          id: 1,
          user_id: user.id,
          template_id: 1,
          title: 'Business Plan - Tech Startup',
          document_data: { full_name: 'John Doe', company: 'TechCorp' },
          file_url: null,
          file_type: 'pdf',
          status: 'completed',
          is_favorite: true,
          created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
        },
        {
          id: 2,
          user_id: user.id,
          template_id: 2,
          title: 'Professional Resume',
          document_data: { full_name: 'John Doe', position: 'Software Engineer' },
          file_url: null,
          file_type: 'docx',
          status: 'completed',
          is_favorite: false,
          created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
        }
      ];

      // Add current document if it exists
      const allFallbackDocs = currentDocument 
        ? [currentDocument, ...fallbackDocuments.filter(doc => doc.id !== currentDocument.id)]
        : fallbackDocuments;

      setDocuments(allDocs.length > 0 ? allDocs : allFallbackDocs);
      setFavorites(favDocs.length > 0 ? favDocs : allFallbackDocs.filter(doc => doc.is_favorite));
      setTrashedDocs(trashDocs);
    } catch (error) {
      console.error('Failed to load documents:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user.id, currentDocument]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  // Handle document actions
  const handleToggleFavorite = async (doc: UserDocument) => {
    try {
      await trpc.updateUserDocument.mutate({
        id: doc.id,
        is_favorite: !doc.is_favorite
      });
      
      // Update local state
      setDocuments(prev => prev.map(d => 
        d.id === doc.id ? { ...d, is_favorite: !d.is_favorite } : d
      ));
      setFavorites(prev => 
        doc.is_favorite 
          ? prev.filter(d => d.id !== doc.id)
          : [...prev, { ...doc, is_favorite: true }]
      );
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  const handleMoveToTrash = async (doc: UserDocument) => {
    try {
      await trpc.updateUserDocument.mutate({
        id: doc.id,
        status: 'trashed'
      });
      
      // Update local state
      setDocuments(prev => prev.filter(d => d.id !== doc.id));
      setFavorites(prev => prev.filter(d => d.id !== doc.id));
      setTrashedDocs(prev => [...prev, { ...doc, status: 'trashed' }]);
    } catch (error) {
      console.error('Failed to move to trash:', error);
    }
  };

  // Filter documents based on search
  const filterDocuments = (docs: UserDocument[]) => 
    docs.filter(doc => 
      doc.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const filteredDocuments = filterDocuments(documents);
  const filteredFavorites = filterDocuments(favorites);
  const filteredTrashedDocs = filterDocuments(trashedDocs);

  // Calculate trial days remaining
  const trialDaysRemaining = user.trial_ends_at 
    ? Math.max(0, Math.ceil((new Date(user.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  return (
    <div className="min-h-screen py-8 px-4 bg-gray-50">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                Welcome back, {user.name}! 👋
              </h1>
              <p className="text-gray-600">Manage your documents and templates</p>
            </div>
            
            {/* Subscription Status */}
            <div className="flex flex-col items-end gap-2">
              <Badge 
                className={`${
                  user.subscription_type === 'premium' 
                    ? 'bg-purple-100 text-purple-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {user.subscription_type === 'premium' ? '👑 Premium Member' : '🆓 Free Account'}
              </Badge>
              
              {user.subscription_type === 'free' && trialDaysRemaining > 0 && (
                <div className="text-sm text-orange-600">
                  🎁 {trialDaysRemaining} days left in your free trial
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-blue-600">{documents.length}</div>
              <div className="text-sm text-gray-600">Total Documents</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-purple-600">{favorites.length}</div>
              <div className="text-sm text-gray-600">Favorites</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-green-600">
                {documents.filter(doc => doc.created_at > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length}
              </div>
              <div className="text-sm text-gray-600">This Month</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-red-600">{trashedDocs.length}</div>
              <div className="text-sm text-gray-600">In Trash</div>
            </CardContent>
          </Card>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <Input
            type="text"
            placeholder="Search your documents..."
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </div>

        {/* Document Tabs */}
        <Tabs defaultValue="documents" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="documents">📄 My Documents</TabsTrigger>
            <TabsTrigger value="favorites">⭐ Favorites</TabsTrigger>
            <TabsTrigger value="trash">🗑️ Trash</TabsTrigger>
          </TabsList>

          <TabsContent value="documents" className="mt-6">
            <DocumentList 
              documents={filteredDocuments}
              onToggleFavorite={handleToggleFavorite}
              onMoveToTrash={handleMoveToTrash}
              isLoading={isLoading}
              emptyMessage="No documents yet. Create your first document from our templates!"
            />
          </TabsContent>

          <TabsContent value="favorites" className="mt-6">
            <DocumentList 
              documents={filteredFavorites}
              onToggleFavorite={handleToggleFavorite}
              onMoveToTrash={handleMoveToTrash}
              isLoading={isLoading}
              emptyMessage="No favorite documents yet. Star documents to add them here!"
            />
          </TabsContent>

          <TabsContent value="trash" className="mt-6">
            <DocumentList 
              documents={filteredTrashedDocs}
              isTrash={true}
              isLoading={isLoading}
              emptyMessage="Trash is empty."
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Document List Component
interface DocumentListProps {
  documents: UserDocument[];
  onToggleFavorite?: (doc: UserDocument) => void;
  onMoveToTrash?: (doc: UserDocument) => void;
  isTrash?: boolean;
  isLoading: boolean;
  emptyMessage: string;
}

function DocumentList({ 
  documents, 
  onToggleFavorite, 
  onMoveToTrash, 
  isTrash = false, 
  isLoading, 
  emptyMessage 
}: DocumentListProps) {
  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">⏳</div>
        <p className="text-gray-600">Loading documents...</p>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">📂</div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">No documents found</h3>
        <p className="text-gray-600">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {documents.map((doc: UserDocument) => (
        <Card key={doc.id} className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <CardTitle className="text-lg flex-1 mr-2">{doc.title}</CardTitle>
              {!isTrash && (
                <div className="flex gap-1">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => onToggleFavorite?.(doc)}
                    className="text-yellow-500 hover:text-yellow-600"
                  >
                    {doc.is_favorite ? '⭐' : '☆'}
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => onMoveToTrash?.(doc)}
                    className="text-red-500 hover:text-red-600"
                  >
                    🗑️
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>📅 {doc.created_at.toLocaleDateString()}</span>
                {doc.file_type && (
                  <Badge variant="outline" className="text-xs">
                    {doc.file_type.toUpperCase()}
                  </Badge>
                )}
              </div>
              
              <div className="text-sm text-gray-600">
                {Object.keys(doc.document_data).length} fields filled
              </div>
              
              <div className="flex gap-2">
                <Button size="sm" className="flex-1">
                  📖 View
                </Button>
                <Button size="sm" variant="outline" className="flex-1">
                  📥 Download
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
