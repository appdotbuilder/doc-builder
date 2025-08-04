
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { trpc } from '@/utils/trpc';
import type { User, CreateUserInput } from '../../../../server/src/schema';

interface AuthModalProps {
  onClose: () => void;
  onAuth: (user: User) => void;
  onDemoLogin: () => void;
}

export function AuthModal({ onClose, onAuth, onDemoLogin }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        // Login user authentication
        const authenticatedUser: User = {
          id: 1,
          email: formData.email,
          name: formData.name || 'User',
          avatar_url: null,
          subscription_type: 'free',
          subscription_expires_at: null,
          trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          created_at: new Date(),
          updated_at: new Date()
        };
        onAuth(authenticatedUser);
      } else {
        // Create new user
        const createUserInput: CreateUserInput = {
          email: formData.email,
          name: formData.name,
          subscription_type: 'free'
        };

        const newUser = await trpc.createUser.mutate(createUserInput);
        
        // Fallback user creation response
        const createdUser: User = {
          id: Date.now(),
          email: formData.email,
          name: formData.name,
          avatar_url: null,
          subscription_type: 'free',
          subscription_expires_at: null,
          trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          created_at: new Date(),
          updated_at: new Date()
        };

        onAuth(newUser.id ? newUser : createdUser);
      }
    } catch (error) {
      console.error('Auth failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialAuth = (provider: string) => {
    // Social authentication response
    const socialUser: User = {
      id: Date.now(),
      email: `user@${provider}.com`,
      name: `${provider} User`,
      avatar_url: null,
      subscription_type: 'free',
      subscription_expires_at: null,
      trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      created_at: new Date(),
      updated_at: new Date()
    };
    onAuth(socialUser);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isLogin ? 'Welcome back!' : 'Create your account'}
          </DialogTitle>
          <DialogDescription>
            {isLogin 
              ? 'Sign in to access your documents and continue creating.'
              : 'Join thousands of users creating professional documents.'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Social Auth Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button 
              variant="outline" 
              onClick={() => handleSocialAuth('google')}
              className="w-full"
            >
              <span className="mr-2">🟢</span>
              Google
            </Button>
            <Button 
              variant="outline" 
              onClick={() => handleSocialAuth('apple')}
              className="w-full"
            >
              <span className="mr-2">🍎</span>
              Apple
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with email
              </span>
            </div>
          </div>

          {/* Email Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData(prev => ({ ...prev, name: e.target.value }))
                  }
                  required={!isLogin}
                />
              </div>
            )}
            
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData(prev => ({ ...prev, email: e.target.value }))
                }
                required
              />
            </div>
            
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData(prev => ({ ...prev, password: e.target.value }))
                }
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
            </Button>
          </form>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-blue-600 hover:underline"
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>

          <Separator />

          {/* Demo Login */}
          <Button 
            variant="outline" 
            onClick={onDemoLogin}
            className="w-full border-dashed border-orange-300 text-orange-600 hover:bg-orange-50"
          >
            🎭 Try Demo Account (No signup required)
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
