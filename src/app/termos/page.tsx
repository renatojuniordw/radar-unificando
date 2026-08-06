import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Termos de Uso e Privacidade | Radar Unificando',
  description: 'Política de privacidade, conformidade com a LGPD e termos de uso do Radar Unificando.',
};

export default function TermosPage() {
  return (
    <main
      style={{
        backgroundColor: '#020617',
        color: '#ffffff',
        minHeight: '100vh',
        padding: '64px 24px',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {/* Header de Navegação */}
        <div style={{ marginBottom: 40 }}>
          <Link
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              color: '#ccff00',
              textDecoration: 'none',
              fontWeight: 900,
              fontSize: '0.8rem',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              fontFamily: 'ui-monospace, monospace',
              border: '2px solid #ccff00',
              padding: '8px 16px',
              backgroundColor: 'transparent',
              boxShadow: '4px 4px 0px rgba(204,255,0,0.2)',
            }}
          >
            ← Voltar para o Radar
          </Link>
        </div>

        {/* Título Principal */}
        <div
          style={{
            backgroundColor: '#0f172a',
            border: '4px solid #1e293b',
            padding: '32px',
            boxShadow: '8px 8px 0px #ccff00',
            marginBottom: 48,
          }}
        >
          <div
            style={{
              display: 'inline-block',
              backgroundColor: '#ccff00',
              color: '#020617',
              padding: '4px 12px',
              fontWeight: 900,
              fontSize: '0.7rem',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: 16,
              fontFamily: 'ui-monospace, monospace',
            }}
          >
            PRIVACIDADE E TRANSPARÊNCIA
          </div>
          <h1
            style={{
              fontSize: '2.5rem',
              fontWeight: 900,
              margin: 0,
              letterSpacing: '-0.02em',
              textTransform: 'uppercase',
              color: '#ffffff',
            }}
          >
            Termos de Uso & Política de Privacidade
          </h1>
          <p
            style={{
              color: '#94a3b8',
              fontSize: '0.9rem',
              fontFamily: 'ui-monospace, monospace',
              marginTop: 12,
              marginBottom: 0,
            }}
          >
            Última atualização: Agosto de 2026 • Conformidade total com a Lei Geral de Proteção de Dados (LGPD)
          </p>
        </div>

        {/* Conteúdo dos Termos */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 32,
            lineHeight: 1.7,
            color: '#cbd5e1',
          }}
        >
          {/* Seção 1 */}
          <section
            style={{
              backgroundColor: '#0f172a',
              border: '2px solid #1e293b',
              padding: '28px',
            }}
          >
            <h2
              style={{
                color: '#ccff00',
                fontSize: '1.25rem',
                fontWeight: 800,
                marginTop: 0,
                marginBottom: 16,
                textTransform: 'uppercase',
                fontFamily: 'ui-monospace, monospace',
              }}
            >
              1. Visão Geral do Serviço
            </h2>
            <p>
              O <strong>Radar Unificando</strong> é um agregador e motor de busca independente que otimiza a localização de vagas de emprego públicas publicadas em plataformas como Gupy e InHire. Nosso objetivo é acelerar a busca de profissionais de tecnologia por novas oportunidades de trabalho remoto ou presencial no Brasil e no exterior.
            </p>
          </section>

          {/* Seção 2 - Sanitização e PII */}
          <section
            style={{
              backgroundColor: '#0f172a',
              border: '2px solid #ccff00',
              padding: '28px',
              boxShadow: '4px 4px 0px rgba(204,255,0,0.15)',
            }}
          >
            <div
              style={{
                display: 'inline-block',
                backgroundColor: '#ccff00',
                color: '#020617',
                padding: '2px 8px',
                fontWeight: 900,
                fontSize: '0.65rem',
                textTransform: 'uppercase',
                marginBottom: 12,
                fontFamily: 'ui-monospace, monospace',
              }}
            >
              🔒 PROTEÇÃO DE DADOS (LGPD)
            </div>
            <h2
              style={{
                color: '#ffffff',
                fontSize: '1.25rem',
                fontWeight: 800,
                marginTop: 0,
                marginBottom: 16,
                textTransform: 'uppercase',
                fontFamily: 'ui-monospace, monospace',
              }}
            >
              2. Anonimização Automática de Dados Pessoais Sensíveis (PII)
            </h2>
            <p>
              Respeitamos rigorosamente a sua privacidade. Em conformidade com a <strong>Lei Geral de Proteção de Dados (Lei nº 13.709/2018 - LGPD)</strong>, implementamos mecanismos automáticos de redação de dados (<em>PII Redactor</em>):
            </p>
            <ul style={{ paddingLeft: 20, marginTop: 12, color: '#94a3b8' }}>
              <li style={{ marginBottom: 8 }}>
                <strong>Sanitização em Tempo Real:</strong> Todos os dados sensíveis colados no chat (como CPF, CNPJ, RG, telefones e números de cartão) são automaticamente substituídos por marcas de redação (ex: <code>[CPF REDIGIDO]</code>) antes de qualquer processamento por Inteligência Artificial.
              </li>
              <li style={{ marginBottom: 8 }}>
                <strong>Armazenamento Seguro:</strong> O banco de dados do Radar Unificando não armazena dados ultrassensíveis em texto puro. Apenas textos sanitizados e públicos permanecem salvos em nosso histórico.
              </li>
              <li style={{ marginBottom: 0 }}>
                <strong>Não Compartilhamento:</strong> Seus dados de contato pessoal jamais são vendidos ou repassados a terceiros.
              </li>
            </ul>
          </section>

          {/* Seção 3 */}
          <section
            style={{
              backgroundColor: '#0f172a',
              border: '2px solid #1e293b',
              padding: '28px',
            }}
          >
            <h2
              style={{
                color: '#ccff00',
                fontSize: '1.25rem',
                fontWeight: 800,
                marginTop: 0,
                marginBottom: 16,
                textTransform: 'uppercase',
                fontFamily: 'ui-monospace, monospace',
              }}
            >
              3. Limites de Uso do Assistente de IA (uso justo)
            </h2>
            <p>
              Para assegurar a disponibilidade, performance e equidade entre os usuários — e para que o serviço continue gratuito e aberto:
            </p>
            <ul style={{ paddingLeft: 20, marginTop: 12, color: '#94a3b8' }}>
              <li style={{ marginBottom: 8 }}>
                <strong>Limite por Conversa:</strong> Cada sessão de chat pode acumular no máximo <strong>25 mensagens</strong>. Ao atingir o limite, a conversa é congelada e o usuário deve iniciar um novo tópico para manter a resposta rápida e objetiva.
              </li>
              <li style={{ marginBottom: 8 }}>
                <strong>Cota de Interações:</strong> Cada usuário possui um limite de <strong>50 mensagens a cada 24 horas</strong>, renovado à meia-noite.
              </li>
              <li style={{ marginBottom: 8 }}>
                <strong>Cota de Tokens de IA:</strong> O consumo de inteligência artificial é medido em tokens (a unidade de processamento do modelo). Cada conta possui um teto diário de <strong>100 mil tokens</strong> (renova à meia-noite) e um teto mensal de <strong>2 milhões de tokens</strong> (renova no dia 1º de cada mês). O header do chat mostra o consumo em tempo real.
              </li>
              <li style={{ marginBottom: 8 }}>
                <strong>Limites por Pessoa, não por Conta:</strong> Os limites acima valem por pessoa. Contas que carregam o mesmo currículo são tratadas como uma única pessoa e <strong>compartilham o mesmo teto</strong>. Também há um teto diário por endereço de IP (3x o individual) e um limite de <strong>3 cadastros por IP a cada 24 horas</strong>, para coibir a criação em massa de contas.
              </li>
              <li style={{ marginBottom: 8 }}>
                <strong>Taxa de Mensagens:</strong> Para evitar sobrecarga, há um limite de <strong>10 mensagens por minuto</strong> por usuário.
              </li>
              <li style={{ marginBottom: 0 }}>
                <strong>Uso Responsável:</strong> Tentativas de burlar os limites (múltiplas contas, automação, abuso de prompts) podem levar à suspensão do acesso, preservando o serviço para todos.
              </li>
            </ul>
          </section>

          {/* Seção 4 */}
          <section
            style={{
              backgroundColor: '#0f172a',
              border: '2px solid #1e293b',
              padding: '28px',
            }}
          >
            <h2
              style={{
                color: '#ccff00',
                fontSize: '1.25rem',
                fontWeight: 800,
                marginTop: 0,
                marginBottom: 16,
                textTransform: 'uppercase',
                fontFamily: 'ui-monospace, monospace',
              }}
            >
              4. Isenção de Responsabilidade sobre Vagas de Terceiros
            </h2>
            <p>
              As informações de vagas (títulos, requisitos, faixas salariais e links de candidatura) são extraídas diretamente de fontes públicas das empresas contratantes. O Radar Unificando não interfere no processo seletivo nem garante a contratação, atuando exclusivamente como facilitador da busca de oportunidades.
            </p>
          </section>

          {/* Footer de navegação da página */}
          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <Link
              href="/"
              style={{
                display: 'inline-block',
                backgroundColor: '#ccff00',
                color: '#020617',
                padding: '14px 28px',
                fontWeight: 900,
                fontSize: '0.85rem',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                textDecoration: 'none',
                fontFamily: 'ui-monospace, monospace',
                boxShadow: '6px 6px 0px #ffffff',
              }}
            >
              Entendido — Acessar Radar de Vagas
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
