
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import type { User } from '../../../../server/src/schema';

interface NavbarProps {
  isAuthenticated: boolean;
  user: User | null;
  onNavigate: (view: 'landing' | 'templates' | 'editor' | 'dashboard') => void;
  onLogin: () => void;
  onLogout: () => void;
}

export function Navbar({ isAuthenticated, user, onNavigate, onLogin, onLogout }: NavbarProps) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <button 
          onClick={() => onNavigate('landing')}
          className="flex items-center space-x-2 text-xl font-bold text-gray-800 hover:text-blue-600 transition-colors"
        >
          <span className="text-2xl">📄</span>
          <span>DocuCraft</span>
        </button>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center space-x-6">
          <button 
            onClick={() => onNavigate('templates')}
            className="text-gray-600 hover:text-gray-800 transition-colors"
          >
            Templates
          </button>
          <button className="text-gray-600 hover:text-gray-800 transition-colors">
            Pricing
          </button>
          <button className="text-gray-600 hover:text-gray-800 transition-colors">
            About
          </button>
        </div>

        {/* Auth Section */}
        <div className="flex items-center space-x-4">
          {isAuthenticated && user ? (
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={() => onNavigate('dashboard')}
                className="text-gray-600 hover:text-gray-800"
              >
                My Documents
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar_url || undefined} alt={user.name} />
                      <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex flex-col space-y-1 p-2">
                    <p className="text-sm font-medium leading-none">{user.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    <div className="mt-1">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        user.subscription_type === 'premium' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {user.subscription_type === 'premium' ? '👑 Premium' : '🆓 Free'}
                      </span>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onNavigate('dashboard')}>
                    My Documents
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onLogout} className="text-red-600">
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Button variant="ghost" onClick={onLogin}>
                Sign In
              </Button>
              <Button onClick={onLogin} className="bg-blue-600 hover:bg-blue-700">
                Get Started
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
