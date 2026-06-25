'use client';
'use no memo';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Loader2, Play, Eye, EyeOff, User } from 'lucide-react';
import { toast } from 'sonner';
import { validateEmail, validatePassword, validateName, validatePasswordMatch } from '@/lib/validation';

// Componente SVG para o logo do Google
const GoogleLogo = ({ className = "" }: { className?: string }) => (
  <svg className={className} width="20" height="20" viewBox="0 0 24 24">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

// Componente SVG para o logo da Apple
const AppleLogo = ({ className = "" }: { className?: string }) => (
  <svg className={className} width="20" height="20" viewBox="0 0 24 24">
    <path
      d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"
      fill="currentColor"
    />
  </svg>
);

export default function LoginPage() {
  const router = useRouter();
  const [isSignup, setIsSignup] = useState(false);

  // Estados para login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Estados para cadastro
  const [name, setName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      toast.error(emailValidation.error);
      return;
    }

    if (!password) {
      toast.error('Por favor, preencha a senha.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      // Salvar sessão simulada no localStorage
      localStorage.setItem('sb-session', JSON.stringify({ email, name: email.split('@')[0] }));
      localStorage.setItem('userBasicInfo', JSON.stringify({ name: email.split('@')[0], email }));
      toast.success('Login realizado com sucesso! Bem-vindo ao WEBFLIX.');
      router.push('/');
    }, 1500);
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();

    const nameValidation = validateName(name);
    if (!nameValidation.isValid) {
      toast.error(nameValidation.error);
      return;
    }

    const emailValidation = validateEmail(signupEmail);
    if (!emailValidation.isValid) {
      toast.error(emailValidation.error);
      return;
    }

    if (!signupPassword) {
      toast.error('Por favor, crie uma senha.');
      return;
    }

    if (signupPassword.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    const matchValidation = validatePasswordMatch(signupPassword, confirmPassword);
    if (!matchValidation.isValid) {
      toast.error(matchValidation.error);
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      // Salvar sessão e dados do usuário
      localStorage.setItem('sb-session', JSON.stringify({ email: signupEmail, name }));
      localStorage.setItem('userBasicInfo', JSON.stringify({ name, email: signupEmail }));
      toast.success('Conta criada com sucesso!');
      router.push('/signup/preferences');
    }, 1500);
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-[#121212]">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src="/assets/background-login.webp"
          alt=""
          className="w-full h-full object-cover opacity-60"
        />
        {/* Gradiente com a cor da home (#121212) */}
        <div className="absolute inset-0 bg-linear-to-b from-[rgba(18,18,18,0.5)] to-[rgba(18,18,18,0.85)]" />
      </div>

      {/* Login/Signup Card */}
      <div className="relative z-10 w-full max-w-md px-6 mt-12 mb-12">
        <div
          className="rounded-[20px] p-8 shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
          style={{
            backdropFilter: 'blur(10px)',
            background: 'rgba(18, 18, 18, 0.7)',
            border: '1px solid rgba(255, 255, 255, 0.05)'
          }}
        >
          {/* Brand Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-[#1DB954] flex items-center justify-center shadow-lg shadow-[#1DB954]/20">
                <Play className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-white fill-white" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tighter leading-none">
                <span className="text-white">WEB</span>
                <span className="text-white">FLIX</span>
              </h1>
            </div>
          </div>

          {/* Toggle entre Login e Cadastro */}
          <div className="flex gap-2 mb-6 p-1 bg-white/5 rounded-xl">
            <button
              type="button"
              onClick={() => setIsSignup(false)}
              className={`flex-1 py-2.5 rounded-lg font-semibold transition-all ${!isSignup
                  ? 'bg-white text-black'
                  : 'text-gray-400 hover:text-white'
                }`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => setIsSignup(true)}
              className={`flex-1 py-2.5 rounded-lg font-semibold transition-all ${isSignup
                  ? 'bg-white text-black'
                  : 'text-gray-400 hover:text-white'
                }`}
            >
              Criar conta
            </button>
          </div>

          {/* Formulário de Login */}
          {!isSignup && (
            <form onSubmit={handleLogin} className="space-y-5">
              {/* Email Input */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest ml-1">E-mail</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none group-focus-within:text-white transition-colors text-gray-500">
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder:text-gray-500 focus:outline-none focus:border-white/50 focus:ring-1 focus:ring-white/30 transition-all"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Senha</label>
                  <button type="button" className="text-xs text-gray-400 hover:text-white hover:underline font-medium">Esqueceu?</button>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none group-focus-within:text-white transition-colors text-gray-500">
                    <Lock size={18} />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder:text-gray-500 focus:outline-none focus:border-white/50 focus:ring-1 focus:ring-white/30 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Sign In Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-white hover:bg-gray-100 disabled:bg-white/50 disabled:cursor-not-allowed text-black font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all transform active:scale-[0.98]"
              >
                {isLoading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  'Entrar agora'
                )}
              </button>
            </form>
          )}

          {/* Formulário de Cadastro */}
          {isSignup && (
            <form onSubmit={handleSignup} className="space-y-5">
              {/* Nome */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest ml-1">
                  Nome de usuario
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none group-focus-within:text-white transition-colors text-gray-500">
                    <User size={18} />
                  </div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder:text-gray-500 focus:outline-none focus:border-white/50 focus:ring-1 focus:ring-white/30 transition-all"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest ml-1">
                  Email
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none group-focus-within:text-white transition-colors text-gray-500">
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder:text-gray-500 focus:outline-none focus:border-white/50 focus:ring-1 focus:ring-white/30 transition-all"
                  />
                </div>
              </div>

              {/* Senha */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest ml-1">
                  Crie uma senha
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none group-focus-within:text-white transition-colors text-gray-500">
                    <Lock size={18} />
                  </div>
                  <input
                    type={showSignupPassword ? "text" : "password"}
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder:text-gray-500 focus:outline-none focus:border-white/50 focus:ring-1 focus:ring-white/30 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignupPassword(!showSignupPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-white transition-colors"
                  >
                    {showSignupPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Confirmar Senha */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest ml-1">
                  Confirme senha
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none group-focus-within:text-white transition-colors text-gray-500">
                    <Lock size={18} />
                  </div>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder:text-gray-500 focus:outline-none focus:border-white/50 focus:ring-1 focus:ring-white/30 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-white transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Botão de Cadastro */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-white hover:bg-gray-100 disabled:bg-white/50 disabled:cursor-not-allowed text-black font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all transform active:scale-[0.98]"
              >
                {isLoading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  'Criar conta'
                )}
              </button>
            </form>
          )}

          {/* Social Login - apenas no modo login */}
          {!isSignup && (
            <div className="mt-8 text-center space-y-4">
              <div className="mt-6 space-y-3">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-700" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-[#1f1f1f] text-gray-500">Ou entre com</span>
                  </div>
                </div>

              <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => toast.error('Login social não disponível.')} className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-white/10 hover:bg-white/20 rounded-xl border border-white/10 transition-all">
                    <GoogleLogo className="w-5 h-5 text-white" />
                    <span className="text-white text-sm font-medium">Google</span>
                  </button>
                  <button type="button" onClick={() => toast.error('Login social não disponível.')} className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-white/10 hover:bg-white/20 rounded-xl border border-white/10 transition-all">
                    <AppleLogo className="w-5 h-5 text-white" />
                    <span className="text-white text-sm font-medium">Apple</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer abaixo do formulário */}
        <div className="mt-6 text-center">
          <p className="text-xs mb-2" style={{ color: '#888' }}>
            © 2025 WEBFLIX Entertainment Inc.
          </p>
          <div className="flex items-center justify-center gap-2 text-xs">
            <a href="#" className="transition-colors hover:opacity-80 hover:underline" style={{ color: '#888' }}>
              Privacidade
            </a>
            <span style={{ color: '#888' }}>•</span>
            <a href="#" className="transition-colors hover:opacity-80 hover:underline" style={{ color: '#888' }}>
              Termos de Uso
            </a>
            <span style={{ color: '#888' }}>•</span>
            <a href="#" className="transition-colors hover:opacity-80 hover:underline" style={{ color: '#888' }}>
              Contato
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}