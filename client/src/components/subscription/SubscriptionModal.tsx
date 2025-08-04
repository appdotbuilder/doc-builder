
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { trpc } from '@/utils/trpc';
import type { User, UpdateUserInput } from '../../../../server/src/schema';

interface SubscriptionModalProps {
  user: User;
  onClose: () => void;
  onSubscribed: (user: User) => void;
}

export function SubscriptionModal({ user, onClose, onSubscribed }: SubscriptionModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | null>(null);

  const handleSubscribe = async () => {
    setIsLoading(true);
    try {
      // Create purchase record
      await trpc.createPurchase.mutate({
        user_id: user.id,
        purchase_type: 'subscription',
        amount: 9.95,
        currency: 'EUR'
      });

      // Update user subscription
      const updatedUserInput: UpdateUserInput = {
        id: user.id,
        subscription_type: 'premium',
        subscription_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      };

      const updatedUser = await trpc.updateUserSubscription.mutate(updatedUserInput);

      // Fallback updated user response
      const fallbackUpdatedUser: User = {
        ...user,
        subscription_type: 'premium',
        subscription_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        updated_at: new Date()
      };

      // Handle null case properly
      const finalUser = updatedUser && updatedUser.id ? updatedUser : fallbackUpdatedUser;
      onSubscribed(finalUser);
    } catch (error) {
      console.error('Subscription failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate trial days remaining
  const trialDaysRemaining = user.trial_ends_at 
    ? Math.max(0, Math.ceil((new Date(user.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            🚀 Upgrade to Premium
          </DialogTitle>
          <DialogDescription>
            Unlock all premium templates and features
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Status */}
          {trialDaysRemaining > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <span className="text-orange-600">🎁</span>
                <span className="font-medium text-orange-800">
                  {trialDaysRemaining} days left in your free trial
                </span>
              </div>
              <p className="text-sm text-orange-600 mt-1">
                Continue enjoying premium features by subscribing today!
              </p>
            </div>
          )}

          {/* Pricing Plans */}
          <div className="grid gap-6">
            {/* Premium Plan */}
            <div 
              className={`relative border-2 rounded-lg p-6 cursor-pointer transition-all ${
                selectedPlan === 'monthly' 
                  ? 'border-purple-500 bg-purple-50' 
                  : 'border-gray-200 hover:border-purple-300'
              }`}
              onClick={() => setSelectedPlan('monthly')}
            >
              <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-purple-600">
                Most Popular
              </Badge>
              
              <div className="text-center mb-4">
                <h3 className="text-xl font-bold">Premium Monthly</h3>
                <div className="text-3xl font-bold text-purple-600 mt-2">
                  €9.95<span className="text-base font-normal text-gray-600">/month</span>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2">
                  <span className="text-green-500">✅</span>
                  <span>Access to all premium templates</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-500">✅</span>
                  <span>Unlimited document creation</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-500">✅</span>
                  <span>PDF & Word export</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-500">✅</span>
                  <span>Priority customer support</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-500">✅</span>
                  <span>Advanced document editor</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-500">✅</span>
                  <span>Cloud storage & sync</span>
                </div>
              </div>

              {selectedPlan === 'monthly' && (
                <Button 
                  onClick={handleSubscribe}
                  disabled={isLoading}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  {isLoading ? 'Processing...' : 'Subscribe Now - €9.95/month'}
                </Button>
              )}
            </div>

            {/* Alternative: Pay per document */}
            <div className="border rounded-lg p-6 bg-gray-50">
              <div className="text-center mb-4">
                <h3 className="text-xl font-bold">Pay Per Document</h3>
                <div className="text-2xl font-bold text-gray-700 mt-2">
                  €1.99<span className="text-base font-normal text-gray-600">/document</span>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-green-500">✅</span>
                  <span>One-time purchase per template</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-500">✅</span>
                  <span>Lifetime access to purchased documents</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-yellow-500">⚠️</span>
                  <span>Only specific template access</span>
                </div>
              </div>

              <Button variant="outline" className="w-full" onClick={onClose}>
                Continue with Pay-Per-Document
              </Button>
            </div>
          </div>

          <Separator />

          {/* Footer */}
          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600">
              Cancel anytime • Secure payment • 30-day money-back guarantee
            </p>
            <div className="flex justify-center items-center gap-4 text-xs text-gray-500">
              <span>🔒 SSL Encrypted</span>
              <span>💳 Secure Payment</span>
              <span>🔄 Easy Cancellation</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
