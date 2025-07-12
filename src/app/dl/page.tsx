'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function DeepLinkRedirect() {
  const searchParams = useSearchParams();
  const [showFallback, setShowFallback] = useState(false);
  const [deepLink, setDeepLink] = useState('');

  useEffect(() => {
    // Extract parameters
    const to = searchParams.get('to');
    const amount = searchParams.get('amount');
    const wallet = searchParams.get('wallet') || 'ethereum';
    const chainId = searchParams.get('chainId') || '10143';
    const label = searchParams.get('label') || 'Payment Request';
    const message = searchParams.get('message') || '';

    if (!to || !amount) {
      window.location.href = '/';
      return;
    }

    const amountInWei = (parseFloat(amount) * 1e18).toString();

    // Generate the appropriate deep link based on wallet parameter
    let generatedDeepLink = '';
    
    switch (wallet) {
      case 'metamask':
        generatedDeepLink = `metamask://send?to=${to}&value=${amountInWei}&chainId=${chainId}`;
        break;
      case 'rainbow':
        generatedDeepLink = `rainbow://send?to=${to}&value=${amountInWei}&chainId=${chainId}`;
        break;
      case 'trust':
        generatedDeepLink = `trust://send?to=${to}&value=${amountInWei}&chainId=${chainId}`;
        break;
      case 'walletconnect':
        generatedDeepLink = `wc://send?to=${to}&value=${amountInWei}&chainId=${chainId}`;
        break;
      default:
        // Default to ethereum: URI (most universal)
        generatedDeepLink = `ethereum:${to}@${chainId}?value=${amountInWei}&label=${encodeURIComponent(label)}&message=${encodeURIComponent(message)}`;
    }

    setDeepLink(generatedDeepLink);

    // Try to open the wallet using multiple methods
    const tryOpenWallet = () => {
      // Method 1: Try creating a hidden iframe
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = generatedDeepLink;
      document.body.appendChild(iframe);
      
      // Clean up iframe after a short delay
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);

      // Method 2: Try direct window.location assignment
      try {
        window.location.href = generatedDeepLink;
      } catch (error) {
        console.log('Direct location assignment failed:', error);
      }

      // Method 3: Try opening in a new window (for some browsers)
      try {
        const newWindow = window.open(generatedDeepLink, '_blank');
        if (newWindow) {
          newWindow.close();
        }
      } catch (error) {
        console.log('New window method failed:', error);
      }
    };

    // Try to open wallet immediately
    tryOpenWallet();
    
    // Show fallback options after a short delay
    const fallbackTimer = setTimeout(() => {
      setShowFallback(true);
    }, 1500);

    // Clean up timer on unmount
    return () => clearTimeout(fallbackTimer);
  }, [searchParams]);

  const paymentData = {
    to: searchParams.get('to') || '',
    amount: searchParams.get('amount') || '',
    token: searchParams.get('token') || 'MON',
    label: searchParams.get('label') || 'Payment Request',
    message: searchParams.get('message') || ''
  };

  const goToWebPayment = () => {
    const fallbackParams = new URLSearchParams({
      to: paymentData.to,
      amount: paymentData.amount,
      token: paymentData.token,
      label: paymentData.label,
      message: paymentData.message
    });
    
    window.location.href = `/pay?${fallbackParams.toString()}`;
  };

  const tryWalletAgain = () => {
    // Try the wallet again using the same method
    if (deepLink) {
      // Method 1: Try creating a hidden iframe
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = deepLink;
      document.body.appendChild(iframe);
      
      // Clean up iframe after a short delay
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);

      // Method 2: Try direct window.location assignment
      try {
        window.location.href = deepLink;
      } catch (error) {
        console.log('Direct location assignment failed:', error);
      }
    }
  };

  if (showFallback) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          {/* Payment Info */}
          <div className="text-white mb-8">
            <h1 className="text-2xl font-bold mb-2">Payment Request</h1>
            <div className="text-3xl font-bold text-purple-400 mb-1">
              {paymentData.amount} {paymentData.token}
            </div>
            <div className="text-sm text-gray-300">
              {paymentData.label}
            </div>
          </div>

          {/* Wallet didn't open message */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 mb-6">
            <div className="text-yellow-400 text-4xl mb-3">⚠️</div>
            <h2 className="text-xl font-bold text-white mb-2">Wallet didn't open?</h2>
            <p className="text-gray-300 text-sm">
              No worries! Choose how you'd like to pay:
            </p>
          </div>

          {/* Options */}
          <div className="space-y-4">
            {/* Try Wallet Again */}
            <button
              onClick={tryWalletAgain}
              className="w-full bg-purple-500 hover:bg-purple-600 text-white p-4 rounded-xl transition-colors flex items-center justify-center"
            >
              <span className="text-2xl mr-3">📱</span>
              <div className="text-left">
                <div className="font-bold">Try Wallet App Again</div>
                <div className="text-sm text-purple-200">Retry opening your wallet</div>
              </div>
            </button>

            {/* Connect on Web */}
            <button
              onClick={goToWebPayment}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white p-4 rounded-xl transition-colors flex items-center justify-center"
            >
              <span className="text-2xl mr-3">🌐</span>
              <div className="text-left">
                <div className="font-bold">Pay on Web</div>
                <div className="text-sm text-blue-200">Connect wallet to this website</div>
              </div>
            </button>
          </div>

          {/* Back Link */}
          <div className="text-center mt-6">
            <a 
              href="/" 
              className="text-purple-400 hover:text-purple-300 text-sm"
            >
              ← Back to Home
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
      <div className="text-center text-white">
        <div className="w-12 h-12 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <h1 className="text-xl font-bold mb-2">Opening Wallet...</h1>
        <p className="text-sm text-gray-300 mb-2">Trying to open your wallet app</p>
        <p className="text-xs text-gray-400">
          If no wallet opens, we'll show you more options
        </p>
      </div>
    </div>
  );
} 