'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin') {
      localStorage.setItem('admin_auth', 'true');
      router.push('/');
    } else {
      setError('Invalid password');
    }
  };

  return (
    <div className="min-h-screen bg-surface-secondary flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-surface rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="text-center mb-8">
          <div className="text-xl font-bold tracking-tight mb-1">
            Admin<span className="text-brand-600">Panel</span>
          </div>
          <p className="text-sm text-text-secondary">Sign in to manage your store</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(''); }}
            placeholder="Enter admin password"
            error={error}
          />
          <Button type="submit" fullWidth size="lg">
            Sign In
          </Button>
        </form>
        <p className="text-xs text-text-tertiary text-center mt-6">
          Default password: <code className="bg-gray-100 px-1.5 py-0.5 rounded">admin</code>
        </p>
      </div>
    </div>
  );
}
