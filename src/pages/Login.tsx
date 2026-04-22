import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, Loader2, Mail, Lock, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import '../styles/auth.css';

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const ensureCredits = async (userId: string, userEmail: string, userName: string) => {
    const { data: existing, error: findError } = await supabase
      .from('user_credits')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (findError) throw findError;

    if (!existing) {
      const nextReset = new Date();
      nextReset.setDate(nextReset.getDate() + 30);
      const { error: insertError } = await supabase.from('user_credits').insert({
        user_id: userId,
        email: userEmail,
        display_name: userName,
        plan: 'free',
        credits: 30,
        credits_remaining: 30,
        max_credits: 30,
        total_credits: 30,
        daily_credits_used: 0,
        daily_limit: 5,
        last_daily_reset_date: new Date().toISOString().split('T')[0],
        next_reset_date: nextReset.toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      if (insertError) throw insertError;
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError || !data.user) throw signInError || new Error('Login failed');

      const metadata = data.user.user_metadata || {};
      const displayName =
        (typeof metadata.full_name === 'string' && metadata.full_name) ||
        (typeof metadata.name === 'string' && metadata.name) ||
        '';

      await ensureCredits(data.user.id, email, displayName);
      navigate('/dashboard');
    } catch {
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ec-auth-page">
      <div className="ec-auth-art" aria-hidden="true" />

      <div className="ec-auth-card">
        <Link to="/" className="ec-auth-brand">
          <Sparkles size={19} />
          CollabFree
        </Link>

        <h1>Welcome back</h1>
        <p>Sign in with your email and password to manage campaigns.</p>

        {error && <div className="ec-auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <label>
            Email
            <div className="input-wrap">
              <Mail size={16} />
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@brand.com"
                required
                disabled={loading}
              />
            </div>
          </label>

          <label>
            Password
            <div className="input-wrap">
              <Lock size={16} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
              />
              <button type="button" onClick={() => setShowPassword((prev) => !prev)}>
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </label>

          <div className="ec-auth-links">
            <Link to="/forgot-password">Forgot password?</Link>
          </div>

          <button className="ec-submit" type="submit" disabled={loading}>
            {loading ? <Loader2 size={16} className="spin" /> : 'Sign In'}
            {!loading && <ArrowRight size={15} />}
          </button>
        </form>

        <p className="ec-auth-footer">
          New to CollabFree? <Link to="/signup">Create account</Link>
        </p>
      </div>
    </div>
  );
}