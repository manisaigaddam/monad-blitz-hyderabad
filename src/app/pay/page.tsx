'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
// import { ConnectButton } from '@rainbow-me/rainbowkit'; // Removed - using custom connect buttons
import { useAccount, useBalance, useSendTransaction, useWaitForTransactionReceipt, useConnect } from 'wagmi';
import { parseEther } from 'viem';
import { injected } from 'wagmi/connectors';

export default function PayPage() {
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({ address });
  const { connect, connectors, isPending: isConnecting } = useConnect();
  
  // Payment transaction state
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [txHash, setTxHash] = useState<string>('');

  // Extract payment data from URL params
  const paymentData = {
    to: searchParams.get('to') || '',
    amount: searchParams.get('amount') || '',
    token: searchParams.get('token') || 'MON',
    label: searchParams.get('label') || 'Payment Request',
    message: searchParams.get('message') || '',
    memo: searchParams.get('memo') || ''
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: sendTxData, sendTransaction, isPending: isSending, error: sendError } = useSendTransaction();
  
  const { isLoading: isWaitingForTx, isSuccess: isTxSuccess } = useWaitForTransactionReceipt({
    hash: sendTxData,
    query: {
      enabled: !!sendTxData,
    }
  });

  // Handle transaction success
  useEffect(() => {
    if (isTxSuccess && sendTxData) {
      setPaymentStatus('success');
      setTxHash(sendTxData);
    }
  }, [isTxSuccess, sendTxData]);

  // Handle transaction error
  useEffect(() => {
    if (sendError) {
      setPaymentStatus('error');
    }
  }, [sendError]);

  const handlePayment = async () => {
    if (!isConnected || !paymentData.to || !paymentData.amount) {
      alert('Please connect your wallet and ensure payment details are valid');
      return;
    }

    try {
      setPaymentStatus('pending');
      
      sendTransaction({
        to: paymentData.to as `0x${string}`,
        value: parseEther(paymentData.amount)
      });
    } catch (error) {
      console.error('Payment failed:', error);
      setPaymentStatus('error');
    }
  };

  const generateEthereumUri = () => {
    // Generate ethereum: URI (EIP-681 standard)
    const chainId = 10143; // Monad testnet
    const amountInWei = (parseFloat(paymentData.amount) * 1e18).toString();
    return `ethereum:${paymentData.to}@${chainId}?value=${amountInWei}`;
  };

  const generateQRCode = () => {
    // Return QR code URL for inline display
    const ethUri = generateEthereumUri();
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(ethUri)}`;
  };

  const [showQR, setShowQR] = useState(false);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!paymentData.to || !paymentData.amount) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-4">Invalid Payment Link</h1>
          <p className="text-gray-300">This payment link is missing required information.</p>
          <a href="/" className="text-purple-400 hover:text-purple-300 mt-4 inline-block">
            ← Back to Home
          </a>
        </div>
      </div>
    );
  }

  // Success state
  if (paymentStatus === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
            <div className="text-green-400 text-6xl mb-4">✅</div>
            <h1 className="text-2xl font-bold text-white mb-2">Payment Successful!</h1>
            <p className="text-gray-300 mb-6">
              Your payment of {paymentData.amount} {paymentData.token} has been sent successfully.
            </p>
            
            {txHash && (
              <div className="bg-white/5 rounded-lg p-4 mb-6 border border-white/10">
                <p className="text-sm text-gray-300 mb-2">Transaction Hash:</p>
                <p className="text-xs text-white font-mono break-all">{txHash}</p>
                <a
                  href={`https://testnet-explorer.monad.xyz/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-400 hover:text-purple-300 text-sm mt-2 inline-block"
                >
                  View on Explorer →
                </a>
              </div>
            )}
            
            <a
              href="/"
              className="bg-purple-500 hover:bg-purple-600 text-white py-3 px-6 rounded-lg transition-colors inline-block"
            >
              Back to Home
            </a>
          </div>
        </div>
      </div>
    );
  }

  const ethUri = generateEthereumUri();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <header className="p-6 flex justify-between items-center">
        <div className="text-white">
          <h1 className="text-3xl font-bold">MonadPay</h1>
          <p className="text-purple-200 text-sm">Complete your payment</p>
        </div>
        {isConnected ? (
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-white text-sm font-semibold">
                {balance ? `${parseFloat(balance.formatted).toFixed(3)} ${balance.symbol}` : 'Loading...'}
              </p>
              <p className="text-purple-200 text-xs font-mono">
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </p>
            </div>
            <div className="w-3 h-3 bg-green-400 rounded-full"></div>
          </div>
        ) : (
          <div className="flex space-x-2">
            {connectors.slice(0, 1).map((connector) => (
              <button
                key={connector.id}
                onClick={() => connect({ connector })}
                disabled={isConnecting}
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg transition-colors flex items-center"
              >
                {isConnecting ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Connecting...
                  </div>
                ) : (
                  <>
                    <span className="mr-2">🔗</span>
                    Connect
                  </>
                )}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Payment Card */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 mb-8">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">{paymentData.label}</h2>
              <p className="text-gray-300">{paymentData.message}</p>
            </div>

            {/* Payment Details */}
            <div className="bg-white/5 rounded-xl p-6 mb-6 border border-white/10">
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-300">Amount</span>
                <span className="text-3xl font-bold text-purple-400">{paymentData.amount} {paymentData.token}</span>
              </div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-300">To</span>
                <span className="text-white font-mono text-sm">{paymentData.to.slice(0, 6)}...{paymentData.to.slice(-4)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Network</span>
                <span className="text-white">Monad Testnet</span>
              </div>
            </div>

            {/* Wallet Connection & Payment */}
            {isConnected ? (
              <div className="space-y-4">
                {/* Wallet Info */}
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-400 font-semibold">Wallet Connected</p>
                      <p className="text-sm text-gray-300 font-mono">{address?.slice(0, 6)}...{address?.slice(-4)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-300">Balance</p>
                      <p className="text-white font-semibold">
                        {balance ? `${parseFloat(balance.formatted).toFixed(4)} ${balance.symbol}` : 'Loading...'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Payment Button */}
                <button
                  onClick={handlePayment}
                  disabled={isSending || isWaitingForTx || paymentStatus === 'pending'}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed text-white py-4 px-6 rounded-xl font-bold text-lg transition-all"
                >
                  {paymentStatus === 'pending' || isSending || isWaitingForTx ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      {isSending ? 'Sending...' : 'Confirming...'}
                    </div>
                  ) : (
                    `Pay ${paymentData.amount} ${paymentData.token}`
                  )}
                </button>

                {paymentStatus === 'error' && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                    <p className="text-red-400 font-semibold">Payment Failed</p>
                    <p className="text-sm text-gray-300">Please try again or check your wallet.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center">
                <p className="text-gray-300 mb-4">Connect your wallet to pay directly on this page</p>
                
                {/* Quick Connect Options */}
                <div className="space-y-3 mb-4">
                  {connectors.slice(0, 2).map((connector) => (
                    <button
                      key={connector.id}
                      onClick={() => connect({ connector })}
                      disabled={isConnecting}
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed text-white py-3 px-6 rounded-lg transition-colors flex items-center justify-center"
                    >
                      {isConnecting ? (
                        <div className="flex items-center">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Connecting...
                        </div>
                      ) : (
                        <>
                          <span className="mr-2">🔗</span>
                          Connect {connector.name}
                        </>
                      )}
                    </button>
                  ))}
                </div>
                
                {/* Show more connectors if available */}
                {connectors.length > 2 && (
                  <div className="pt-4 border-t border-white/10">
                    <p className="text-xs text-gray-400 mb-3">More wallet options:</p>
                    <div className="space-y-2">
                      {connectors.slice(2).map((connector) => (
                        <button
                          key={connector.id}
                          onClick={() => connect({ connector })}
                          disabled={isConnecting}
                          className="w-full bg-gray-600/20 hover:bg-gray-600/30 border border-gray-600/30 text-gray-300 py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
                        >
                          {isConnecting ? (
                            <div className="flex items-center">
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                              Connecting...
                            </div>
                          ) : (
                            <>
                              <span className="mr-2">🔗</span>
                              Connect {connector.name}
                            </>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Alternative Payment Methods */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 mb-8">
            <h3 className="text-xl font-semibold text-white mb-4 text-center">📱 Try Opening Wallet Apps</h3>
            <p className="text-sm text-gray-300 text-center mb-6">These will try to open your wallet apps without leaving this page</p>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <button
                onClick={() => {
                  // MetaMask deep link - try to open without leaving page
                  const amountInWei = (parseFloat(paymentData.amount) * 1e18).toString();
                  const metamaskUrl = `metamask://send?to=${paymentData.to}&value=${amountInWei}&chainId=10143`;
                  
                  // Try iframe method first
                  const iframe = document.createElement('iframe');
                  iframe.style.display = 'none';
                  iframe.src = metamaskUrl;
                  document.body.appendChild(iframe);
                  
                  setTimeout(() => {
                    document.body.removeChild(iframe);
                  }, 1000);
                  
                  // Try direct method as fallback
                  try {
                    window.location.href = metamaskUrl;
                  } catch (error) {
                    console.log('MetaMask deep link failed:', error);
                  }
                }}
                className="bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/30 text-orange-300 py-4 px-4 rounded-lg transition-colors flex flex-col items-center justify-center"
              >
                <span className="text-2xl mb-2">🦊</span>
                <span className="font-semibold">MetaMask</span>
              </button>
              <button
                onClick={() => {
                  // Rainbow deep link - try to open without leaving page
                  const amountInWei = (parseFloat(paymentData.amount) * 1e18).toString();
                  const rainbowUrl = `rainbow://send?to=${paymentData.to}&value=${amountInWei}&chainId=10143`;
                  
                  // Try iframe method first
                  const iframe = document.createElement('iframe');
                  iframe.style.display = 'none';
                  iframe.src = rainbowUrl;
                  document.body.appendChild(iframe);
                  
                  setTimeout(() => {
                    document.body.removeChild(iframe);
                  }, 1000);
                  
                  // Try direct method as fallback
                  try {
                    window.location.href = rainbowUrl;
                  } catch (error) {
                    console.log('Rainbow deep link failed:', error);
                  }
                }}
                className="bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-purple-300 py-4 px-4 rounded-lg transition-colors flex flex-col items-center justify-center"
              >
                <span className="text-2xl mb-2">🌈</span>
                <span className="font-semibold">Rainbow</span>
              </button>
              <button
                onClick={() => {
                  // Trust Wallet deep link - try to open without leaving page
                  const amountInWei = (parseFloat(paymentData.amount) * 1e18).toString();
                  const trustUrl = `trust://send?to=${paymentData.to}&value=${amountInWei}&chainId=10143`;
                  
                  // Try iframe method first
                  const iframe = document.createElement('iframe');
                  iframe.style.display = 'none';
                  iframe.src = trustUrl;
                  document.body.appendChild(iframe);
                  
                  setTimeout(() => {
                    document.body.removeChild(iframe);
                  }, 1000);
                  
                  // Try direct method as fallback
                  try {
                    window.location.href = trustUrl;
                  } catch (error) {
                    console.log('Trust Wallet deep link failed:', error);
                  }
                }}
                className="bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-300 py-4 px-4 rounded-lg transition-colors flex flex-col items-center justify-center"
              >
                <span className="text-2xl mb-2">🛡️</span>
                <span className="font-semibold">Trust</span>
              </button>
              <button
                onClick={() => {
                  // Generic ethereum: URI - try to open without leaving page
                  const ethUri = generateEthereumUri();
                  
                  // Try iframe method first
                  const iframe = document.createElement('iframe');
                  iframe.style.display = 'none';
                  iframe.src = ethUri;
                  document.body.appendChild(iframe);
                  
                  setTimeout(() => {
                    document.body.removeChild(iframe);
                  }, 1000);
                  
                  // Try direct method as fallback
                  try {
                    window.location.href = ethUri;
                  } catch (error) {
                    console.log('Generic wallet deep link failed:', error);
                  }
                }}
                className="bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 text-indigo-300 py-4 px-4 rounded-lg transition-colors flex flex-col items-center justify-center"
              >
                <span className="text-2xl mb-2">💼</span>
                <span className="font-semibold">Any Wallet</span>
              </button>
            </div>

            {/* QR Code for Mobile */}
            <div className="text-center">
              <p className="text-gray-300 text-sm mb-3">Or scan QR code with your wallet app</p>
              <button
                onClick={() => setShowQR(!showQR)}
                className="bg-white/5 hover:bg-white/10 border border-white/10 text-white py-3 px-6 rounded-lg transition-colors flex items-center justify-center mx-auto"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
                {showQR ? 'Hide QR Code' : 'Show QR Code'}
              </button>
              
              {/* QR Code Display */}
              {showQR && (
                <div className="mt-4 p-4 bg-white/5 rounded-lg border border-white/10">
                  <div className="flex justify-center mb-2">
                    <img 
                      src={generateQRCode()} 
                      alt="Payment QR Code" 
                      className="rounded-lg bg-white p-2"
                    />
                  </div>
                  <p className="text-xs text-gray-400 text-center mb-2">
                    Scan with any wallet that supports ethereum: URIs
                  </p>
                  <button
                    onClick={() => {
                      const ethUri = generateEthereumUri();
                      navigator.clipboard.writeText(ethUri);
                      alert('Ethereum URI copied to clipboard: ' + ethUri);
                    }}
                    className="text-xs text-purple-400 hover:text-purple-300"
                  >
                    📋 Copy Ethereum URI
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Back to Home */}
          <div className="text-center mt-8">
            <a
              href="/"
              className="text-purple-400 hover:text-purple-300 transition-colors"
            >
              ← Back to MonadPay
            </a>
          </div>
        </div>
      </main>
    </div>
  );
} 