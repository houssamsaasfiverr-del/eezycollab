import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, Loader2, Lock, Mail, Sparkles, User } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import '../styles/auth.css';

export default function SignUp() {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const initializeCredits = async (userId: string, userEmail: string, userName: string) => {
    const nextReset = new Date();
    nextReset.setDate(nextReset.getDate() + 30);

    const { error } = await supabase.from('user_credits').upsert({
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
      billing_period: 'monthly',
      next_reset_date: nextReset.toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    if (error) throw error;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name
          }
        }
      });

      if (signUpError || !data.user) throw signUpError || new Error('Sign up failed');

      // If email verification is enabled, Supabase may not return an active session yet.
      // In that case, avoid protected inserts now and let first login initialize credits.
      if (!data.session) {
        setSuccessMessage('Account created. Please verify your email from your inbox, then sign in.');
        return;
      }

      try {
        await initializeCredits(data.user.id, email, name);
      } catch (initError) {
        // Non-blocking: login flow also bootstraps credits if missing.
        console.warn('Could not initialize credits during signup:', initError);
      }

      navigate('/dashboard');
    } catch (err: unknown) {
      if (typeof err === 'object' && err && 'message' in err && String((err as { message?: string }).message).includes('already registered')) {
        setError('Email already in use');
      } else {
        setError('Could not create account');
      }
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

        <h1>Create account</h1>
        <p>Use your email and password to start building campaigns faster.</p>

        {error && <div className="ec-auth-error">{error}</div>}
        {successMessage && <div className="ec-auth-success">{successMessage}</div>}

        <form onSubmit={handleSubmit}>
          <label>
            Full name
            <div className="input-wrap">
              <User size={16} />
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="John Doe"
                required
                disabled={loading}
              />
            </div>
          </label>

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
                placeholder="At least 6 characters"
                minLength={6}
                required
                disabled={loading}
              />
              <button type="button" onClick={() => setShowPassword((prev) => !prev)}>
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </label>

          <button className="ec-submit" type="submit" disabled={loading}>
            {loading ? <Loader2 size={16} className="spin" /> : 'Create account'}
            {!loading && <ArrowRight size={15} />}
          </button>
        </form>

        <p className="ec-auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}