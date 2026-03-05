// src/features/auth/pages/LoginPage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Flame, ArrowRight, ShieldCheck, Lock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { authApi } from '@/features/auth/api/auth.api';
import { useAuthStore } from '@/store/useAuthStore';

export const LoginPage = () => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<1 | 2>(1);
  const [isLoading, setIsLoading] = useState(false);

  // Step 1: Trigger OTP to Admin Email
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return toast.error("Please enter your admin email");
    
    setIsLoading(true);
    try {
      const response = await authApi.requestOtp(email);
      toast.success(response.message || `Secure OTP dispatched to ${email}`);
      setStep(2);
    } catch (error: any) {
      toast.error(error.response?.data?.error || error.message || "Failed to initiate login sequence.");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Finalize login with Password + OTP
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return toast.error("Please enter your password");
    if (!otp || otp.length < 6) return toast.error("Please enter a valid 6-digit OTP");
    
    setIsLoading(true);
    try {
      const response = await authApi.login(email, password, otp);
      
      // Store the admin data and token in Zustand
      login(response.admin, response.token);
      
      toast.success(response.message || "Authentication successful.");
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.error || error.message || "Authentication failed. Invalid credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center text-orange-600">
          <div className="bg-white p-4 rounded-full shadow-sm border border-orange-100">
            <Flame size={48} strokeWidth={2.5} className="text-orange-600" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Agni Shiksha
        </h2>
        <p className="mt-2 text-center text-sm font-medium text-orange-600 flex items-center justify-center gap-1.5">
          <ShieldCheck size={16} /> Secure Admin Portal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md animate-in fade-in duration-300">
        <div className="bg-white py-8 px-4 shadow-xl sm:rounded-xl sm:px-10 border border-gray-100">
          
          {step === 1 ? (
            <form className="space-y-6" onSubmit={handleRequestOtp}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Admin Email Address</label>
                <Input 
                  type="email" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@agnishiksha.com"
                  className="focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700 text-white" isLoading={isLoading}>
                Request Access Code <ArrowRight size={16} className="ml-2" />
              </Button>
            </form>
          ) : (
            <form className="space-y-6 animate-in slide-in-from-right-4 duration-300" onSubmit={handleAdminLogin}>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-gray-700">Account Details</label>
                  <button 
                    type="button" 
                    onClick={() => {
                      setStep(1);
                      setPassword('');
                      setOtp('');
                    }} 
                    className="text-xs text-orange-600 hover:text-orange-700 font-medium transition-colors"
                  >
                    Change Email
                  </button>
                </div>
                
                {/* Disabled Email Field for visual confirmation */}
                <Input 
                  type="email" 
                  disabled
                  value={email}
                  className="bg-gray-50 text-gray-500 mb-4"
                />

                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <Input 
                  type="password" 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="mb-4 focus:ring-orange-500 focus:border-orange-500"
                />

                <label className="block text-sm font-medium text-gray-700 mb-1">6-Digit Access Code (OTP)</label>
                <Input 
                  type="text" 
                  required 
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} // Numeric only
                  placeholder="123456"
                  className="text-center text-xl tracking-[0.5em] font-bold text-orange-700 h-12 focus:ring-orange-500 focus:border-orange-500"
                />
                <p className="mt-3 text-xs text-gray-500 text-center">
                  Check your inbox. Code expires in 5 minutes.
                </p>
              </div>

              <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700 text-white" isLoading={isLoading}>
                Verify & Authenticate <Lock size={16} className="ml-2" />
              </Button>
            </form>
          )}

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-white text-gray-400 uppercase font-semibold tracking-wider">
                  MFA Protected
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};