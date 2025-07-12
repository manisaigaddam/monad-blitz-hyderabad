'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useBalance } from 'wagmi';
import { useEffect, useState } from 'react';

interface PaymentData {
  to: string;
  amount: string;
  token: string;
  label: string;
  message: string;
  memo: string;
  webFallback?: string;
}

export default function Home() {
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({ address });
  const [mounted, setMounted] = useState(false);
  
  // Payment link form state
  const [paymentData, setPaymentData] = useState<PaymentData>({
    to: '',
    amount: '',
    token: 'MON',
    label: '',
    message: '',
    memo: '',
    webFallback: ''
  });
  
  const [generatedLink, setGeneratedLink] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const generatePaymentLink = () => {
    if (!isConnected || !paymentData.amount) {
      alert('Please connect your wallet and enter an amount');
      return;
    }

    // Use connected wallet address as recipient
    const recipientAddress = address;
    
    // Generate simple clickable link that tries wallet first, then falls back to web
    const baseUrl = window.location.origin;
    const params = new URLSearchParams({
      to: recipientAddress!,
      amount: paymentData.amount,
      token: paymentData.token,
      label: paymentData.label || 'Payment Request',
      message: paymentData.message || ''
    });

    // Main shareable link - tries wallet first, falls back to web payment
    const mainLink = `${baseUrl}/dl?${params.toString()}`;
    
    // Web fallback link for manual sharing
    const webFallback = `${baseUrl}/pay?${params.toString()}`;
    
    // Set the main link as primary
    setGeneratedLink(mainLink);
    
    // Store payment data
    setPaymentData({
      ...paymentData, 
      to: recipientAddress!, 
      webFallback
    });
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const generateQRCode = () => {
    // Generate direct ethereum: URI for QR code (opens wallet apps directly)
    if (!paymentData.to || !paymentData.amount) return '';
    
    const amountInWei = (parseFloat(paymentData.amount) * 1e18).toString();
    const ethereumUri = `ethereum:${paymentData.to}@10143?value=${amountInWei}&label=${encodeURIComponent(paymentData.label || 'Payment Request')}&message=${encodeURIComponent(paymentData.message || '')}`;
    
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(ethereumUri)}`;
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <header className="p-6 flex justify-between items-center">
        <div className="text-white flex items-center">
          <img src="/payd.jpg" alt="payd" className="w-12 h-12 rounded-lg mr-4" />
          <div>
            <h1 className="text-3xl font-bold">payd</h1>
            <p className="text-purple-200 text-sm">Lets get PAYD on monad</p>
          </div>
        </div>
        <ConnectButton />
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">
              Native{' '}
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                deep link payments
              </span>
              {' '}for Monad
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Create direct wallet links that open apps instantly. Pure WalletConnect-style deep links with QR codes.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Payment Link Creator */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
              <h3 className="text-2xl font-semibold text-white mb-6 flex items-center">
                <span className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </span>
                Create Payment Link
              </h3>

              <div className="space-y-4">
                {/* Recipient Address - Auto-filled from connected wallet */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Recipient Address (Your Wallet)
                  </label>
                  <div className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white flex items-center justify-between">
                    <span className="font-mono text-sm">
                      {isConnected ? address : 'Connect wallet to auto-fill'}
                    </span>
                    {isConnected && (
                      <span className="text-green-400 text-sm">✓ Connected</span>
                    )}
                  </div>
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Amount *
                  </label>
                  <div className="flex">
                    <input
                      type="number"
                      value={paymentData.amount}
                      onChange={(e) => setPaymentData({...paymentData, amount: e.target.value})}
                      placeholder="0.00"
                      className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-l-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <select
                      value={paymentData.token}
                      onChange={(e) => setPaymentData({...paymentData, token: e.target.value})}
                      className="px-4 py-3 bg-white/5 border border-white/10 border-l-0 rounded-r-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="MON">MON</option>
                      <option value="USDC">USDC</option>
                      <option value="USDT">USDT</option>
                    </select>
                  </div>
                </div>

                {/* Label */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Label (Optional)
                  </label>
                  <input
                    type="text"
                    value={paymentData.label}
                    onChange={(e) => setPaymentData({...paymentData, label: e.target.value})}
                    placeholder="Coffee payment"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Message (Optional)
                  </label>
                  <textarea
                    value={paymentData.message}
                    onChange={(e) => setPaymentData({...paymentData, message: e.target.value})}
                    placeholder="Thanks for the coffee!"
                    rows={3}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                {/* Generate Button */}
                {!isConnected ? (
                  <div className="text-center">
                    <p className="text-gray-400 text-sm mb-3">Connect your wallet to create payment links</p>
                    <ConnectButton />
                  </div>
                ) : (
                  <button
                    onClick={generatePaymentLink}
                    disabled={!paymentData.amount}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold py-3 px-6 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    Generate Payment Link
                  </button>
                )}
              </div>
            </div>

            {/* Generated Link & Preview */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
              <h3 className="text-2xl font-semibold text-white mb-6 flex items-center">
                <span className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </span>
                Your Payment Link
              </h3>

              {generatedLink ? (
                <div className="space-y-4">
                  {/* Primary Clickable Link */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Payment Link (Clickable & Shareable)
                    </label>
                    <div className="flex">
                      <input
                        type="text"
                        value={generatedLink}
                        readOnly
                        className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-l-lg text-white text-sm font-mono"
                      />
                      <button
                        onClick={copyToClipboard}
                        className="px-4 py-3 bg-purple-500 hover:bg-purple-600 border border-purple-500 rounded-r-lg text-white transition-colors"
                      >
                        {copied ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      🚀 Smart link: Tries to open wallet app first, then shows web payment page
                    </p>
                  </div>

                  {/* Web Fallback Link */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Web Payment Link (Backup)
                    </label>
                    <div className="flex">
                      <input
                        type="text"
                        value={paymentData.webFallback || ''}
                        readOnly
                        className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-l-lg text-white text-sm font-mono"
                      />
                      <button
                        onClick={() => {
                          if (paymentData.webFallback) {
                            navigator.clipboard.writeText(paymentData.webFallback);
                          }
                        }}
                        className="px-4 py-3 bg-blue-500 hover:bg-blue-600 border border-blue-500 rounded-r-lg text-white transition-colors"
                      >
                        Copy
                      </button>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      🌐 Direct web payment page with wallet connection
                    </p>
                  </div>



                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <button
                      onClick={() => {
                        const qrUrl = generateQRCode();
                        window.open(qrUrl, '_blank');
                      }}
                      className="bg-white/5 hover:bg-white/10 border border-white/10 text-white py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                      </svg>
                      QR Code
                    </button>
                    <button
                      onClick={() => {
                        const text = `Pay me ${paymentData.amount} ${paymentData.token} on Monad: ${generatedLink}`;
                        navigator.share?.({ text }) || navigator.clipboard.writeText(text);
                      }}
                      className="bg-white/5 hover:bg-white/10 border border-white/10 text-white py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                      </svg>
                      Share
                    </button>
                  </div>

                  {/* QR Code Display */}
                  <div className="bg-white/5 rounded-lg p-4 border border-white/10 mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-gray-300">📱 Scan to Pay</h4>
                      <span className="text-xs text-gray-400">Direct Wallet URI</span>
                    </div>
                    <div className="flex justify-center">
                      <img 
                        src={generateQRCode()} 
                        alt="Payment QR Code" 
                        className="rounded-lg bg-white p-2"
                      />
                    </div>
                    <p className="text-xs text-gray-400 text-center mt-2">
                      🚀 Direct wallet URI • Opens wallet apps immediately • No browser needed
                    </p>
                  </div>

                  {/* Preview */}
                  <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <h4 className="text-sm font-medium text-gray-300 mb-2">Preview</h4>
                    <div className="text-white">
                      <p className="font-semibold">{paymentData.label || 'Payment Request'}</p>
                      <p className="text-2xl font-bold text-purple-400">{paymentData.amount} {paymentData.token}</p>
                      <p className="text-sm text-gray-300">To: {paymentData.to.slice(0, 6)}...{paymentData.to.slice(-4)}</p>
                      {paymentData.message && <p className="text-sm text-gray-300 mt-2">{paymentData.message}</p>}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                  </div>
                  <p className="text-gray-400">Fill out the form to generate your payment link</p>
                </div>
              )}
            </div>
          </div>

          {/* Wallet Status */}
          {isConnected && (
            <div className="mt-8 bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4">Your Wallet</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <h4 className="text-sm font-medium text-gray-400 mb-1">Address</h4>
                  <p className="text-white font-mono text-sm break-all">{address}</p>
                </div>
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <h4 className="text-sm font-medium text-gray-400 mb-1">Balance</h4>
                  <p className="text-white font-semibold">
                    {balance ? `${parseFloat(balance.formatted).toFixed(4)} ${balance.symbol}` : 'Loading...'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="p-6 text-center text-gray-400 border-t border-white/10 mt-12">
        <p>&copy; 2024 MonadPay. The easiest way to request crypto payments.</p>
      </footer>
    </div>
  );
}
