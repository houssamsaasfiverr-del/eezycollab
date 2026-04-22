import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Mail, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export default function ForgotPassword() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login`
      });
      if (resetError) throw resetError;
      setMessage('Reset link sent. Check your inbox.');
    } catch (err: unknown) {
      if (typeof err === 'object' && err && 'message' in err) {
        const message = String((err as { message?: string }).message || '').toLowerCase();
        if (message.includes('invalid') && message.includes('email')) {
          setError('Invalid email address');
        } else {
          setError('Could not send reset email');
        }
      } else {
        setError('Could not send reset email');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ec-forgot-page">
      <div className="ec-forgot-card">
        <button className="back" onClick={() => navigate('/login')}>
          <ArrowLeft size={15} /> Back
        </button>

        <Link to="/" className="brand">
          <Sparkles size={18} /> CollabFree
        </Link>

        <h1>Reset your password</h1>
        <p>Enter your account email and we will send a secure reset link.</p>

        {error && <div className="alert error">{error}</div>}
        {message && <div className="alert success">{message}</div>}

        <form onSubmit={handleSubmit}>
          <label>
            Email
            <div className="input-wrap">
              <Mail size={15} />
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

          <button type="submit" className="submit" disabled={loading}>
            {loading ? <Loader2 size={15} className="spin" /> : 'Send reset link'}
          </button>
        </form>
      </div>

      <style>{`
        .ec-forgot-page {
          min-height: 100vh;
          display: grid;
          place-items: center;
          background:
            radial-gradient(circle at 15% 20%, rgba(247, 125, 38, 0.28), transparent 34%),
            radial-gradient(circle at 80% 82%, rgba(224, 87, 42, 0.2), transparent 30%),
            #fff7ee;
          font-family: "Manrope", "Segoe UI", sans-serif;
        }

        .ec-forgot-card {
          width: min(460px, 92%);
          background: rgba(255, 255, 255, 0.96);
          border: 1px solid #ecdccf;
          border-radius: 20px;
          padding: 24px;
          box-shadow: 0 22px 40px rgba(182, 132, 90, 0.2);
        }

        .back {
          border: 1px solid #ecd9c6;
          border-radius: 9px;
          background: #fff;
          color: #6f5948;
          font-weight: 700;
          padding: 6px 10px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          margin-bottom: 14px;
        }

        .brand {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: #231a15;
          text-decoration: none;
          font-size: 20px;
          font-weight: 800;
          margin-bottom: 14px;
        }

        .brand svg { color: #f47322; }

        h1 {
          font-size: 30px;
          letter-spacing: -0.03em;
          margin-bottom: 8px;
        }

        p {
          color: #705f51;
          margin-bottom: 14px;
          line-height: 1.6;
        }

        .alert {
          border-radius: 10px;
          padding: 10px;
          font-size: 14px;
          font-weight: 700;
          margin-bottom: 10px;
        }

        .alert.error {
          border: 1px solid #efb7b7;
          background: #fff0f0;
          color: #b53434;
        }

        .alert.success {
          border: 1px solid #bae5c4;
          background: #edfdf1;
          color: #2a8550;
        }

        form {
          display: grid;
          gap: 12px;
        }

        label {
          display: grid;
          gap: 7px;
          color: #534437;
          font-size: 13px;
          font-weight: 700;
        }

        .input-wrap {
          border: 1px solid #e7d8ca;
          border-radius: 10px;
          background: #fffefc;
          display: grid;
          grid-template-columns: auto 1fr;
          align-items: center;
          gap: 8px;
          padding: 0 10px;
        }

        .input-wrap svg { color: #8a7162; }

        input {
          border: 0;
          outline: 0;
          background: transparent;
          color: #291f19;
          font-size: 14px;
          font-family: inherit;
          padding: 11px 0;
        }

        .submit {
          border: 0;
          border-radius: 10px;
          padding: 11px;
          color: #fff;
          font-size: 14px;
          font-weight: 800;
          background: linear-gradient(135deg, #f57e22, #dc5224);
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .spin { animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}