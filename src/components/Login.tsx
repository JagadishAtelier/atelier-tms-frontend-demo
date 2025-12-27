import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card';
import type { User } from '../types';

interface LoginProps {
  onLogin: (user: User) => void;
  users: User[];
}

export function Login({ onLogin, users }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const user = users.find((u) => u.email === email && u.isActive);
    
    if (user) {
      onLogin(user);
    } else {
      setError('Invalid email or password');
    }
  };

  // Quick login buttons for demo
  const quickLogin = (role: string) => {
    const user = users.find((u) => u.role === role && u.isActive);
    if (user) {
      onLogin(user);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-lg bg-blue-600">
            <span className="text-2xl text-white">AT</span>
          </div>
          <CardTitle className="text-blue-600">Atelier Technologies</CardTitle>
          <CardDescription>Task Management System</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@ateliertechnologies.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
            <Button type="submit" className="w-full">
              Sign In
            </Button>
          </form>

          <div className="mt-6 border-t pt-6">
            <p className="mb-3 text-center text-sm text-gray-500">Quick Demo Login:</p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => quickLogin('Super Admin')}
              >
              Admin
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => quickLogin('Employee')}
              >
                Employee
              </Button>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Developed by Atelier Technologies
            </p>
            <p className="text-xs text-gray-500">
              Empowering Businesses through Smart Software Solutions.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
