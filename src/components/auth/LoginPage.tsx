import React, { useState } from 'react';
import { Lock, User, LogIn, AlertCircle } from 'lucide-react';
import { useAuth } from '../../store/useAuth';

export function LoginPage() {
  const { login, loading, error, setError } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[LoginPage] Soumission du formulaire');
    
    if (!username.trim() || !password.trim()) {
      console.log('[LoginPage] Champs vides');
      setError('Veuillez remplir tous les champs.');
      return;
    }
    
    console.log('[LoginPage] Appel de login avec:', { username });
    login(username, password);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      console.log('[LoginPage] Touche Entrée détectée');
      if (!loading) {
        handleSubmit(e as any);
      }
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: '#0A0A0A',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background gradient */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(255,255,255,0.04) 0%, transparent 60%)',
        pointerEvents: 'none',
      }} />

      {/* Login card */}
      <div
        className="glass"
        style={{
          width: '100%',
          maxWidth: 420,
          padding: '48px 40px',
          position: 'relative',
          zIndex: 1,
          animation: 'fadeUp 0.6s cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        {/* Logo & Title */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
          }}>
            <Lock size={24} color="white" />
          </div>
          <h1 style={{
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: 'white',
            marginBottom: 8,
          }}>
            MindVault
          </h1>
          <p style={{
            fontSize: 13,
            color: 'rgba(255,255,255,0.4)',
            letterSpacing: '0.04em',
          }}>
            Connectez-vous pour accéder à vos notes
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div
            className="animate-fade-up"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 10,
              padding: '12px 14px',
              marginBottom: 20,
              color: '#f87171',
              fontSize: 13,
            }}
          >
            <AlertCircle size={14} />
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Username field */}
          <div>
            <label style={{
              fontSize: 12,
              color: 'rgba(255,255,255,0.4)',
              marginBottom: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}>
              <User size={12} /> Identifiant
            </label>
            <input
              type="text"
              className="input-premium"
              placeholder="Entrez votre identifiant"
              value={username}
              onChange={e => { 
                setUsername(e.target.value); 
                setError(''); 
                console.log('[LoginPage] Identifiant changé:', e.target.value);
              }}
              onKeyDown={handleKeyDown}
              disabled={loading}
              style={{ fontSize: 14, padding: '12px 14px' }}
              autoComplete="username"
            />
          </div>

          {/* Password field */}
          <div>
            <label style={{
              fontSize: 12,
              color: 'rgba(255,255,255,0.4)',
              marginBottom: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}>
              <Lock size={12} /> Mot de passe
            </label>
            <input
              type="password"
              className="input-premium"
              placeholder="Entrez votre mot de passe"
              value={password}
              onChange={e => { 
                setPassword(e.target.value); 
                setError(''); 
                console.log('[LoginPage] Mot de passe changé (', e.target.value.length, 'caractères)');
              }}
              onKeyDown={handleKeyDown}
              disabled={loading}
              style={{ fontSize: 14, padding: '12px 14px' }}
              autoComplete="current-password"
            />
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{
              width: '100%',
              justifyContent: 'center',
              marginTop: 8,
              fontSize: 14,
              fontWeight: 600,
              height: 44,
              opacity: loading ? 0.6 : 1,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? (
              <span className="spinner" style={{ width: 14, height: 14 }} />
            ) : (
              <>
                <LogIn size={14} />
                Se connecter
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="divider" style={{ margin: '24px 0' }} />

        {/* Hint */}
        <div style={{
          fontSize: 11,
          color: 'rgba(255,255,255,0.2)',
          textAlign: 'center',
          lineHeight: 1.6,
        }}>
          Vos identifiants personnalisés vous ont été fournis.<br />
          <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: 10 }}>
            Ouvrez la console (F12) pour voir les logs de débogage
          </span>
        </div>
      </div>
    </div>
  );
}
