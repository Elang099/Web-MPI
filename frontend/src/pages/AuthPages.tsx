import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AUDIENCES, type AuthResponse } from '@fec/shared';
import { ArrowRight, KeyRound, Mail, UserPlus } from 'lucide-react';
import { api } from '@/services/api';
import { useAuth } from '@/stores/auth';
import { toast } from '@/stores/ui';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/Button';

export function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setSession = useAuth((s) => s.setSession);
  const navigate = useNavigate();

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.post<AuthResponse>('/auth/login', { identifier, password });
      setSession(res.accessToken, res.user);
      toast.success(`Welcome back, ${res.user.displayName}!`);
      navigate('/dashboard');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const quickFill = (email: string) => {
    setIdentifier(email);
    setPassword('Password123!');
  };

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to continue your English journey and keep your streak alive.">
      <form onSubmit={submit} className="space-y-4">
        {error && <div className="rounded-2xl border border-danger/40 bg-danger/10 p-3 text-sm text-danger">{error}</div>}
        <div>
          <label className="label" htmlFor="login-id">
            Email or Username
          </label>
          <input id="login-id" className="input" required value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="alex_learner or you@example.com" />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <label className="label" htmlFor="login-pw">
              Password
            </label>
            <Link to="/forgot-password" className="text-xs font-semibold text-cyan hover:underline">
              Forgot password?
            </Link>
          </div>
          <input id="login-pw" type="password" className="input" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
        </div>
        <Button type="submit" className="w-full" size="lg" loading={loading} icon={<ArrowRight className="h-4 w-4" />}>
          Log In
        </Button>
      </form>

      {/* Demo Quick-Fill Helper & Instant Guest Access */}
      <div className="mt-6 rounded-2xl border border-line bg-surface-2/50 p-3.5 space-y-3">
        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted">Demo Accounts (Password: Password123!)</p>
          <div className="flex flex-wrap gap-1.5">
            <button type="button" onClick={() => quickFill('student@futureenglish.test')} className="chip hover:border-cyan hover:text-cyan">
              Student
            </button>
            <button type="button" onClick={() => quickFill('teacher@futureenglish.test')} className="chip hover:border-cyan hover:text-cyan">
              Teacher
            </button>
            <button type="button" onClick={() => quickFill('admin@futureenglish.test')} className="chip hover:border-cyan hover:text-cyan">
              Admin
            </button>
          </div>
        </div>
        <div className="border-t border-line/50 pt-2.5">
          <button
            type="button"
            onClick={() => {
              setSession('demo-token', {
                id: 'demo-student-id',
                email: 'student@futureenglish.test',
                username: 'alex_learner',
                displayName: 'Alex Learner',
                role: 'STUDENT',
                createdAt: new Date().toISOString(),
                profile: {
                  bio: 'Passionate English learner exploring Future English Center.',
                  audience: 'GENERAL',
                  cefr: 'B1',
                  goal: 'Master English for global career',
                  careerField: 'Technology',
                  isPublic: true,
                },
                stats: {
                  xp: 1250,
                  level: 4,
                  streak: 7,
                  longestStreak: 12,
                  coins: 640,
                  lastActiveDay: new Date().toISOString().slice(0, 10),
                },
              });
              toast.success('Signed in as Alex Learner (Instant Demo)!');
              navigate('/dashboard');
            }}
            className="w-full rounded-xl bg-cyan/15 py-2 text-center text-xs font-bold text-cyan transition hover:bg-cyan/25"
          >
            ⚡ Masuk Cepat sebagai Demo Student (Instant Demo)
          </button>
        </div>
      </div>

      <p className="mt-6 text-center text-sm text-muted">
        New to FUTURE ENGLISH CENTER?{' '}
        <Link to="/register" className="font-bold text-cyan hover:underline">
          Create a free account
        </Link>
      </p>
    </AuthShell>
  );
}

export function RegisterPage() {
  const [form, setForm] = useState({ email: '', username: '', displayName: '', password: '', audience: 'GENERAL' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setSession = useAuth((s) => s.setSession);
  const navigate = useNavigate();

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.post<AuthResponse>('/auth/register', form);
      setSession(res.accessToken, res.user);
      toast.success('Account created! Let’s unlock your future.');
      navigate('/dashboard');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Create your account" subtitle="Master English through interactive lessons, AI coaching, and immersive games.">
      <form onSubmit={submit} className="space-y-4">
        {error && <div className="rounded-2xl border border-danger/40 bg-danger/10 p-3 text-sm text-danger">{error}</div>}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Full Name</label>
            <input className="input" required value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} placeholder="Alex Pratama" />
          </div>
          <div>
            <label className="label">Username</label>
            <input className="input" required value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="alex_2026" />
          </div>
        </div>
        <div>
          <label className="label">Email</label>
          <input type="email" className="input" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" />
        </div>
        <div>
          <label className="label">Learning Track</label>
          <select className="input" value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })}>
            {AUDIENCES.map((a) => (
              <option key={a} value={a}>
                {a === 'SMP' ? 'SMP (Junior High)' : a === 'SMA' ? 'SMA (Senior High)' : a === 'SMK' ? 'SMK (Vocational & Career)' : 'General English Learner'}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Password (8+ chars, letters & numbers)</label>
          <input type="password" className="input" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="At least 8 characters" />
        </div>
        <Button type="submit" className="w-full" size="lg" loading={loading} icon={<UserPlus className="h-4 w-4" />}>
          Create Free Account
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted">
        Already have an account?{' '}
        <Link to="/login" className="font-bold text-cyan hover:underline">
          Log in
        </Link>
      </p>
    </AuthShell>
  );
}

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ message: string; devResetUrl?: string } | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post<{ message: string; devResetUrl?: string }>('/auth/forgot-password', { email });
      setResult(res);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Reset your password" subtitle="Enter your account email and we will prepare a secure recovery link.">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label">Email Address</label>
          <input type="email" className="input" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        </div>
        <Button type="submit" className="w-full" loading={loading} icon={<Mail className="h-4 w-4" />}>
          Send Recovery Link
        </Button>
      </form>
      {result && (
        <div className="mt-4 rounded-2xl border border-cyan/40 bg-cyan/10 p-4 text-sm">
          <p>{result.message}</p>
          {result.devResetUrl && (
            <p className="mt-2 break-all text-xs">
              Dev preview link:{' '}
              <Link to={new URL(result.devResetUrl).pathname + new URL(result.devResetUrl).search} className="font-bold text-cyan underline">
                Open Password Reset Page
              </Link>
            </p>
          )}
        </div>
      )}
      <p className="mt-6 text-center text-sm text-muted">
        <Link to="/login" className="font-bold text-cyan hover:underline">
          ← Back to login
        </Link>
      </p>
    </AuthShell>
  );
}

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const token = params.get('token') ?? '';

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      toast.success('Password updated! You can now sign in.');
      navigate('/login');
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Choose a new password" subtitle="Use at least 8 characters with both letters and numbers.">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label">New Password</label>
          <input type="password" className="input" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <Button type="submit" className="w-full" loading={loading} icon={<KeyRound className="h-4 w-4" />}>
          Save New Password
        </Button>
      </form>
    </AuthShell>
  );
}

function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen place-items-center bg-bg bg-grid px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Logo to="/" />
        </div>
        <div className="panel p-6 sm:p-8 shadow-soft">
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="mt-1.5 text-sm text-muted">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
