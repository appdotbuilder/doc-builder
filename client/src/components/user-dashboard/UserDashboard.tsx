
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
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);

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

  // Handle file upload
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const validFiles = Array.from(files).filter(file => allowedTypes.includes(file.type));

    if (validFiles.length === 0) {
      alert('Please select valid PDF, DOC, or DOCX files.');
      return;
    }

    setIsUploading(true);
    try {
      // For now, simulate upload by creating document entries
      const newDocuments = validFiles.map((file): UserDocument => ({
        id: Date.now() + Math.random(),
        user_id: user.id,
        template_id: null,
        title: file.name,
        document_data: {},
        file_url: URL.createObjectURL(file), // Temporary local URL
        file_type: file.type.includes('pdf') ? 'pdf' : (file.type.includes('word') || file.name.endsWith('.docx')) ? 'docx' : 'doc',
        status: 'completed',
        is_favorite: false,
        created_at: new Date(),
        updated_at: new Date()
      }));

      setDocuments(prev => [...newDocuments, ...prev]);
      setUploadedFiles(prev => [...prev, ...validFiles]);
    } catch (error) {
      console.error('File upload failed:', error);
    } finally {
      setIsUploading(false);
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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="documents">📄 My Documents</TabsTrigger>
            <TabsTrigger value="upload">📤 Upload Files</TabsTrigger>
            <TabsTrigger value="favorites">⭐ Favorites</TabsTrigger>
            <TabsTrigger value="trash">🗑️ Trash</TabsTrigger>
          </TabsList>

          <TabsContent value="documents" className="mt-6">
            <DocumentList 
              documents={filteredDocuments}
              onToggleFavorite={handleToggleFavorite}
              onMoveToTrash={handleMoveToTrash}
              isLoading={isLoading}
              emptyMessage="No documents yet. Create your first document from our templates or upload existing files!"
            />
          </TabsContent>

          <TabsContent value="upload" className="mt-6">
            <FileUploadSection 
              onFileUpload={handleFileUpload}
              isUploading={isUploading}
              uploadedFiles={uploadedFiles}
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
                {doc.file_url ? (
                  <Button 
                    size="sm" 
                    className="flex-1"
                    onClick={() => {
                      if (doc.file_url) {
                        window.open(doc.file_url, '_blank');
                      }
                    }}
                  >
                    📖 View / Download
                  </Button>
                ) : (
                  <Button size="sm" className="flex-1">
                    📖 View
                  </Button>
                )}
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

// File Upload Section Component
interface FileUploadSectionProps {
  onFileUpload: (files: FileList | null) => void;
  isUploading: boolean;
  uploadedFiles: File[];
}

function FileUploadSection({ onFileUpload, isUploading, uploadedFiles }: FileUploadSectionProps) {
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onFileUpload(e.dataTransfer.files);
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📤 Upload Documents
            <Badge variant="outline" className="text-xs">
              PDF, DOC, DOCX
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div 
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <div className="space-y-4">
              <div className="text-4xl">📁</div>
              <div>
                <p className="text-lg font-medium text-gray-700 mb-2">
                  Drag and drop your files here
                </p>
                <p className="text-sm text-gray-500">
                  or click to browse your computer
                </p>
              </div>
              
              <input
                type="file"
                multiple
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => onFileUpload(e.target.files)}
                className="hidden"
                id="file-upload"
                disabled={isUploading}
              />
              
              <Button
                onClick={() => document.getElementById('file-upload')?.click()}
                disabled={isUploading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isUploading ? '⏳ Uploading...' : '📎 Choose Files'}
              </Button>
            </div>
          </div>

          {/* File Type Info */}
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start gap-3">
              <div className="text-blue-600 text-lg">ℹ️</div>
              <div className="text-sm text-blue-800">
                <div className="font-semibold mb-2">Current File Capabilities:</div>
                <ul className="space-y-1 text-xs">
                  <li>• <strong>✅ View & Download:</strong> Open uploaded files in browser for viewing and download</li>
                  <li>• <strong>✅ Template Creation:</strong> Use our structured template editor for professional documents</li>
                  <li>• <strong>⚠️ Limited Editing:</strong> Direct text/image editing within uploaded .pdf/.doc files requires advanced integrations</li>
                  <li>• <strong>📄 File Support:</strong> PDF, DOC, DOCX files up to 10MB each</li>
                  <li>• <strong>🔜 Coming Soon:</strong> Advanced in-browser editing with Microsoft Graph, Adobe PDF Services</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recently Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">📋 Recently Uploaded</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {uploadedFiles.slice(0, 5).map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="text-lg">
                      {file.type.includes('pdf') ? '📄' : '📝'}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{file.name}</div>
                      <div className="text-xs text-gray-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB • {file.type.includes('pdf') ? 'PDF' : 'DOC'}
                      </div>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-800 text-xs">
                    ✅ Uploaded
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Feature Roadmap */}
      <Card className="border-purple-200">
        <CardHeader>
          <CardTitle className="text-lg text-purple-800 flex items-center gap-2">
            🚀 Coming Soon: Advanced Editing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
              <span>Real-time collaborative editing</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
              <span>Advanced PDF annotation and form filling</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
              <span>Microsoft Word integration for .docx editing</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
              <span>Cloud storage sync (Google Drive, OneDrive)</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
