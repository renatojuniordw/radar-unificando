import Link from 'next/link';
import Container from '@mui/material/Container';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { createExtensionToken } from '@/lib/core/extension/extension-token';
import { LINKS } from '@/lib/core/constants';
import { TokenBox } from './token-box';
import {
  ArrowLeft,
  KeyRound,
  Puzzle,
  Sparkles,
  ShieldCheck,
  HelpCircle,
  ExternalLink,
  UserCheck,
  Zap,
  ChevronDown,
} from 'lucide-react';

/** Só permite redirecionar para o redirect padrão do launchWebAuthFlow (evita open redirect). */
function isSafeRedirectUri(uri: string): boolean {
  try {
    const url = new URL(uri);
    return url.protocol === 'https:' && url.hostname.endsWith('.chromiumapp.org');
  } catch {
    return false;
  }
}

export default async function ConectarExtensaoPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect_uri?: string }>;
}) {
  const session = await auth();
  const { redirect_uri } = await searchParams;

  if (!session?.user?.id) {
    const back = redirect_uri
      ? `/extensao/conectar?redirect_uri=${encodeURIComponent(redirect_uri)}`
      : '/extensao/conectar';
    redirect(`/login?callbackUrl=${encodeURIComponent(back)}`);
  }

  const rawToken = await createExtensionToken(session.user.id);

  // Fluxo automático via launchWebAuthFlow: entrega o token no redirect da extensão.
  if (redirect_uri && isSafeRedirectUri(redirect_uri)) {
    const separator = redirect_uri.includes('?') ? '&' : '?';
    redirect(`${redirect_uri}${separator}token=${encodeURIComponent(rawToken)}`);
  }

  const userDisplayName = session.user.name || session.user.email || 'Usuário Radar';

  return (
    <div className="bg-[#020617] min-h-screen text-[#f8fafc] py-8 sm:py-12 relative overflow-hidden">
      {/* Background Radar Conic Animation Effect */}
      <div
        className="hero-radar absolute -inset-[200px] pointer-events-none opacity-20"
        style={{
          background:
            'conic-gradient(from 0deg, transparent 0%, #ccff00 20%, transparent 40%)',
        }}
      />

      <Container maxWidth="md" className="relative z-10">
        {/* Navigation Breadcrumb */}
        <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
          <Link
            href="/extensao"
            data-testid="extensao-back-link"
            className="inline-flex items-center gap-2 text-[#94a3b8] hover:text-[#ccff00] text-xs font-mono font-black uppercase tracking-wider no-underline transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span>Voltar à Extensão</span>
          </Link>

          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#0f172a] border border-[#334155] text-xs font-mono text-[#cbd5e1]">
            <UserCheck className="w-3.5 h-3.5 text-[#ccff00]" />
            <span>Conta:</span>
            <strong className="text-[#ffffff] font-bold">{userDisplayName}</strong>
          </div>
        </div>

        {/* Hero Banner Header */}
        <div className="mb-8">
          <div className="badge-neon mb-4 inline-block">
            ⚡ AUTENTICAÇÃO E CONEXÃO
          </div>
          <h1 className="font-black text-3xl sm:text-5xl uppercase tracking-tight text-[#ffffff] leading-none mb-4">
            Conectar <span className="text-[#ccff00]">Extensão Chrome</span>
          </h1>
          <p className="text-[#f8fafc] text-sm sm:text-base max-w-2xl leading-relaxed font-medium">
            Clique no ícone da extensão para conectar automaticamente sua conta do Radar Unificando e analisar vagas no Gupy, LinkedIn e InHire em tempo real com seu score ATS.
          </p>
        </div>

        {/* Main Token Display Box Component */}
        <TokenBox token={rawToken} />

        {/* 3-Step Onboarding Visual Section */}
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <Zap className="w-5 h-5 text-[#ccff00]" />
            <h2 className="font-black text-lg sm:text-xl uppercase tracking-tight text-[#ffffff]">
              Como Conectar em 3 Passos Simples
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Step 1 */}
            <div className="card-brutalist p-5 relative flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-xs font-black bg-[#ccff00] text-[#020617] px-2 py-0.5 border border-[#020617]">
                    PASSO 01
                  </span>
                  <Puzzle className="w-5 h-5 text-[#020617]" />
                </div>
                <h3 className="font-black text-sm uppercase tracking-wider text-[#020617] mb-2">
                  Abra a Extensão
                </h3>
                <p className="text-xs text-[#334155] font-mono leading-relaxed font-semibold">
                  Clique no ícone do Radar Unificando na barra do Chrome para abrir o painel lateral.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="card-brutalist p-5 relative flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-xs font-black bg-[#ccff00] text-[#020617] px-2 py-0.5 border border-[#020617]">
                    PASSO 02
                  </span>
                  <KeyRound className="w-5 h-5 text-[#020617]" />
                </div>
                <h3 className="font-black text-sm uppercase tracking-wider text-[#020617] mb-2">
                  Faça Login
                </h3>
                <p className="text-xs text-[#334155] font-mono leading-relaxed font-semibold">
                  A extensão abre esta página automaticamente e conecta com sua conta já logada, sem precisar copiar nada.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="card-brutalist p-5 relative flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-xs font-black bg-[#ccff00] text-[#020617] px-2 py-0.5 border border-[#020617]">
                    PASSO 03
                  </span>
                  <Sparkles className="w-5 h-5 text-[#020617]" />
                </div>
                <h3 className="font-black text-sm uppercase tracking-wider text-[#020617] mb-2">
                  Pronto!
                </h3>
                <p className="text-xs text-[#334155] font-mono leading-relaxed font-semibold">
                  Seu score ATS e histórico já ficam sincronizados ao vivo no painel lateral.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Troubleshooting / FAQ Accordion */}
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <HelpCircle className="w-5 h-5 text-[#ccff00]" />
            <h2 className="font-black text-lg sm:text-xl uppercase tracking-tight text-[#ffffff]">
              Dúvidas Frequentes sobre a Conexão
            </h2>
          </div>

          <div className="space-y-3">
            <details className="faq-item group" data-testid="extensao-faq-item-1">
              <summary className="font-mono text-xs sm:text-sm">
                <span>Onde encontro o ícone da extensão no Chrome?</span>
                <ChevronDown className="faq-arrow" size={20} />
              </summary>
              <div className="faq-content">
                Após instalar, clique no ícone de peça de quebra-cabeça (<span className="text-[#ccff00]">🧩 Extensões</span>) no canto superior direito do Chrome e fixe o Radar Unificando na sua barra de ferramentas para fácil acesso.
              </div>
            </details>

            <details className="faq-item group" data-testid="extensao-faq-item-2">
              <summary className="font-mono text-xs sm:text-sm">
                <span>Preciso gerar um novo token cada vez que abrir o navegador?</span>
                <ChevronDown className="faq-arrow" size={20} />
              </summary>
              <div className="faq-content">
                Não! Uma vez conectado, o token fica salvo com segurança no armazenamento local criptografado da extensão. Você só precisará colar o token novamente caso desinstale ou limpe os dados da extensão.
              </div>
            </details>

            <details className="faq-item group" data-testid="extensao-faq-item-3">
              <summary className="font-mono text-xs sm:text-sm">
                <span>A conexão automática falhou, o que fazer?</span>
                <ChevronDown className="faq-arrow" size={20} />
              </summary>
              <div className="faq-content">
                Confirme que você está logado no Radar Unificando e clique novamente no ícone da extensão. Caso continue falhando, recarregue esta página para gerar uma nova chave de sessão limpa.
              </div>
            </details>
          </div>
        </div>

        {/* Footer Support Banner */}
        <div className="bg-[#0f172a] border-2 border-[#ccff00] p-6 shadow-[6px_6px_0px_#000] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-[#ccff00] shrink-0" />
            <div>
              <h4 className="font-black text-sm uppercase tracking-wide text-[#ffffff]">
                Ainda não instalou a extensão Chrome?
              </h4>
              <p className="text-xs text-[#cbd5e1] font-mono">
                Baixe grátis pela Chrome Web Store e volte aqui para colar seu token.
              </p>
            </div>
          </div>

          <div className="flex shrink-0 flex-col sm:flex-row gap-3">
            <a
              href={LINKS.chromeStore}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="extensao-store-link"
              className="btn-neon shrink-0 no-underline px-5 py-2.5 text-xs font-mono font-black uppercase tracking-wider inline-flex items-center justify-center gap-2"
            >
              <span>Instalar na Chrome Web Store</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <Link
              href="/extensao"
              data-testid="extensao-guide-link"
              className="btn-dark shrink-0 no-underline px-5 py-2.5 text-xs font-mono font-black uppercase tracking-wider inline-flex items-center justify-center gap-2"
            >
              <span>Ver Guia</span>
            </Link>
          </div>
        </div>
      </Container>
    </div>
  );
}