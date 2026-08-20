import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE } from '@/lib/core/constants';

export const metadata: Metadata = {
  title: { absolute: 'Termos de Uso, Privacidade e LGPD | Radar Unificando' },
  description: 'Política de privacidade, conformidade com a LGPD e termos de uso do Radar Unificando.',
  alternates: { canonical: `${SITE.url}/termos` },
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
              justifyContent: 'center',
              minHeight: '44px',
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
              O <strong>Radar Unificando</strong> é uma plataforma inteligente, agregador e motor de busca independente que otimiza a localização de vagas de emprego públicas publicadas em grandes portais de recrutamento (como Gupy e InHire), além de oferecer uma Extensão Chrome integrada, análise de aderência por Inteligência Artificial (score ATS), recomendações de capacitação profissional e assistente de carreira. Nosso objetivo é acelerar a busca de profissionais de <strong>todas as áreas do mercado</strong> (Marketing, Vendas, RH, Finanças, Tecnologia, Saúde, Design, Operações e mais) por oportunidades de trabalho remoto, híbrido ou presencial no Brasil e no exterior.
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
              3. Limites de Uso da Plataforma e do Assistente de IA (uso justo)
            </h2>
            <p>
              Para assegurar a disponibilidade, performance e equidade entre os usuários — e para que o serviço continue 100% gratuito e aberto:
            </p>
            <ul style={{ paddingLeft: 20, marginTop: 12, color: '#94a3b8' }}>
              <li style={{ marginBottom: 8 }}>
                <strong>Limite por Conversa:</strong> Cada sessão de chat pode acumular no máximo <strong>25 mensagens</strong>. Ao atingir o limite, a conversa é concluída e o usuário deve iniciar um novo tópico para manter as respostas objetivas e rápidas.
              </li>
              <li style={{ marginBottom: 8 }}>
                <strong>Cota de Interações Diárias:</strong> Cada conta de usuário possui um limite de <strong>50 mensagens a cada 24 horas</strong> no chat, renovado diariamente à meia-noite.
              </li>
              <li style={{ marginBottom: 8 }}>
                <strong>Taxa de Mensagens (Rate Limit):</strong> Para evitar sobrecarga de servidor, há uma limitação de no máximo <strong>10 mensagens por minuto</strong> por usuário/IP no assistente de IA.
              </li>
              <li style={{ marginBottom: 8 }}>
                <strong>Cota de Tokens de IA:</strong> O processamento dos modelos de Inteligência Artificial possui um teto de <strong>100 mil tokens/dia</strong> (renova à meia-noite) e <strong>2 milhões de tokens/mês</strong> (renova no dia 1º de cada mês) por usuário. O header do chat exibe o consumo de tokens em tempo real.
              </li>
              <li style={{ marginBottom: 8 }}>
                <strong>Limites por Pessoa (Anti Multi-Conta):</strong> Contas que compartilham o mesmo currículo são vinculadas e <strong>compartilham o mesmo teto de tokens</strong>. Existe também um teto diário global por endereço de IP de <strong>300 mil tokens/dia</strong> e um limite de <strong>3 cadastros de conta por IP a cada 24 horas</strong>.
              </li>
              <li style={{ marginBottom: 8 }}>
                <strong>Orçamento Diário Global:</strong> O projeto possui um limite diário global de custos em nuvem. Ao ser atingido, o chat é pausado para todos os usuários e volta a funcionar automaticamente após a meia-noite.
              </li>
              <li style={{ marginBottom: 8 }}>
                <strong>Extensão do Navegador Chrome:</strong> As requisições de análise de vagas enviadas pela Extensão Chrome contam com rate limit próprio de <strong>20 análises por minuto</strong>.
              </li>
              <li style={{ marginBottom: 0 }}>
                <strong>Uso Responsável:</strong> Tentativas de burlar os limites (automações não autorizadas, criação massiva de contas, abuso de prompts) podem acarretar a suspensão temporária ou definitiva do acesso.
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

          {/* Seção 5 - Links de Afiliados */}
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
              5. Links de Afiliados
            </h2>
            <p>
              Para manter o serviço gratuito e aberto, o Radar Unificando participa de programas de afiliados de capacitação profissional, atualmente com a plataforma <strong>Udemy</strong> (outras plataformas poderão ser adicionadas futuramente). Quando você clica em um link de curso recomendado e realiza uma compra, podemos receber uma comissão da plataforma — <strong>sem nenhum custo adicional para você</strong>.
            </p>
            <ul style={{ paddingLeft: 20, marginTop: 12, color: '#94a3b8' }}>
              <li style={{ marginBottom: 8 }}>
                <strong>Transparência:</strong> As recomendações de curso são exibidas com a identificação de que se trata de indicação (ex: &quot;Recomendação do Radar&quot;) e o preço que você vê é o mesmo que pagaria acessando a plataforma diretamente.
              </li>
              <li style={{ marginBottom: 8 }}>
                <strong>Base da recomendação:</strong> Os cursos são sugeridos com base nas skills exigidas pelas vagas que você busca e nas lacunas identificadas na análise do seu currículo — não por qualquer pagamento de terceiros.
              </li>
              <li style={{ marginBottom: 8 }}>
                <strong>Sem interferência no preço:</strong> A comissão de afiliado não altera o valor cobrado pela plataforma (Udemy), nem os termos de compra dela.
              </li>
              <li style={{ marginBottom: 0 }}>
                <strong>Dados pessoais:</strong> Nenhum dado pessoal seu é compartilhado com as plataformas de afiliados. A identificação da indicação ocorre apenas por parâmetro técnico no link (ex: <code>?ref=</code>).
              </li>
            </ul>
          </section>

          {/* Seção 6 - Política de Cookies */}
          <section
            id="cookies"
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
              🍪 CONSENTIMENTO
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
              6. Política de Cookies
            </h2>
            <p>
              O Radar Unificando utiliza cookies e tecnologias de armazenamento local para garantir o funcionamento do serviço e, com o seu consentimento, para medir a audiência. Você pode aceitar ou recusar os cookies de análise a qualquer momento pelo aviso exibido no rodapé do site.
            </p>
            <ul style={{ paddingLeft: 20, marginTop: 12, color: '#94a3b8' }}>
              <li style={{ marginBottom: 8 }}>
                <strong>Cookies essenciais:</strong> Necessários para o funcionamento do site, como o cookie de sessão do login (Auth.js). Não dependem do seu consentimento e não são usados para rastreamento.
              </li>
              <li style={{ marginBottom: 8 }}>
                <strong>Armazenamento local (IndexedDB/localStorage):</strong> Usado para guardar no seu navegador preferências de busca, histórico de conversas do chat e o seu consentimento de cookies. Esses dados não saem do seu dispositivo.
              </li>
              <li style={{ marginBottom: 8 }}>
                <strong>Cookies de análise (Google Analytics 4):</strong> Carregados <strong>somente após o seu consentimento</strong> (&quot;Aceitar&quot; no aviso de cookies). Coletam dados agregados e anônimos de navegação (páginas visitadas, origem do acesso) para entendermos como o site é usado. Você pode recusar sem qualquer prejuízo ao funcionamento.
              </li>
              <li style={{ marginBottom: 8 }}>
                <strong>Como gerenciar:</strong> Você pode limpar cookies e dados de sites pelas configurações do seu navegador a qualquer momento. Ao limpar os dados do site, o aviso de cookies será exibido novamente.
              </li>
              <li style={{ marginBottom: 8 }}>
                <strong>Tracking de afiliados (Impact):</strong> O script de recomendação de cursos da plataforma Impact é carregado <strong>somente após o seu consentimento</strong> (&quot;Aceitar&quot; no aviso de cookies), da mesma forma que o Google Analytics. Ele permite atribuir as recomendações de cursos que você acessa via links do site.
              </li>
              <li style={{ marginBottom: 0 }}>
                <strong>Links de afiliados:</strong> Os links de cursos (Udemy) podem conter parâmetros técnicos de identificação (ex: <code>?ref=</code>) que não identificam você pessoalmente e não configuram cookies de rastreamento no nosso site.
              </li>
            </ul>
          </section>

          {/* Seção 7 - Seus Direitos LGPD */}
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
              7. Seus Direitos (LGPD)
            </h2>
            <p>
              Em conformidade com a <strong>Lei Geral de Proteção de Dados (Lei nº 13.709/2018)</strong>, você pode, a qualquer momento, solicitar:
            </p>
            <ul style={{ paddingLeft: 20, marginTop: 12, color: '#94a3b8' }}>
              <li style={{ marginBottom: 8 }}>
                <strong>Confirmação e acesso:</strong> saber se tratamos seus dados e ter acesso a eles.
              </li>
              <li style={{ marginBottom: 8 }}>
                <strong>Correção:</strong> atualizar dados incompletos, inexatos ou desatualizados.
              </li>
              <li style={{ marginBottom: 8 }}>
                <strong>Eliminação:</strong> solicitar a exclusão dos seus dados pessoais e do seu perfil. No painel <Link href="/perfil" style={{ color: '#ccff00' }}>Meu Perfil</Link> você encontra o botão &quot;Excluir minha conta&quot;, que remove sua conta e todos os dados associados (Art. 18, VI).
              </li>
              <li style={{ marginBottom: 8 }}>
                <strong>Portabilidade:</strong> receber seus dados em formato estruturado, quando aplicável. No painel <Link href="/perfil" style={{ color: '#ccff00' }}>Meu Perfil</Link> você encontra o botão &quot;Exportar meus dados&quot;, que gera um arquivo JSON legível e reutilizável (Art. 18, V).
              </li>
              <li style={{ marginBottom: 8 }}>
                <strong>Revogação de consentimento:</strong> retirar o consentimento de cookies de análise e de tracking a qualquer momento pelo aviso de cookies ou pelas configurações do navegador.
              </li>
              <li style={{ marginBottom: 0 }}>
                <strong>Como exercer:</strong> envie sua solicitação pelos canais de contato informados na página <Link href="/sobre" style={{ color: '#ccff00' }}>Sobre</Link> ou diretamente ao nosso Encarregado de Dados (seção 9 abaixo). Responderemos no prazo legal.
              </li>
            </ul>
          </section>

          {/* Seção 8 - Retenção de Dados */}
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
              8. Retenção de Dados
            </h2>
            <p>
              Os prazos de retenção abaixo são aplicados automaticamente por rotinas de limpeza agendadas no servidor, além da exclusão manual pela sua conta.
            </p>
            <ul style={{ paddingLeft: 20, marginTop: 12, color: '#94a3b8' }}>
              <li style={{ marginBottom: 8 }}>
                <strong>Perfil e currículo:</strong> mantidos enquanto sua conta estiver ativa. Você pode excluir seu perfil a qualquer momento (o que remove também todos os dados associados).
              </li>
              <li style={{ marginBottom: 8 }}>
                <strong>Histórico de conversas:</strong> as mensagens do chat são armazenadas para continuidade da conversa e podem ser apagadas por você a qualquer momento. Chats sem nenhuma atividade há mais de 12 meses são removidos automaticamente.
              </li>
              <li style={{ marginBottom: 8 }}>
                <strong>Cache de análises de IA:</strong> resultados de análise (ATS, fit, entrevistas) são cacheados por até 30 dias e removidos automaticamente após o vencimento.
              </li>
              <li style={{ marginBottom: 8 }}>
                <strong>Sessão (JWT):</strong> o token de sessão fica em cookie seguro (HttpOnly) e é encerrado no logout, na exclusão da conta ou por expiração natural.
              </li>
              <li style={{ marginBottom: 0 }}>
                <strong>Dados anônimos:</strong> vagas públicas e métricas agregadas de uso não contêm dados pessoais e são mantidas para o funcionamento e melhoria do serviço.
              </li>
            </ul>
          </section>

          {/* Seção 9 - Controlador e Encarregado */}
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
              📋 ART. 41 — LGPD
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
              9. Controlador de Dados e Encarregado (DPO)
            </h2>
            <p>
              Em conformidade com o <strong>Art. 41 da LGPD</strong>, o controlador das operações de tratamento é o <strong>Radar Unificando</strong> (projeto de código aberto desenvolvido e mantido pelo desenvolvedor Renato Bezerra, como pessoa física).
            </p>
            <ul style={{ paddingLeft: 20, marginTop: 12, color: '#94a3b8' }}>
              <li style={{ marginBottom: 8 }}>
                <strong>Encarregado de Dados (DPO):</strong> Renato Bezerra.
              </li>
              <li style={{ marginBottom: 8 }}>
                <strong>Canal de contato direto:</strong>{' '}
                <a href="mailto:privacidade@unificando.com.br" style={{ color: '#ccff00' }}>privacidade@unificando.com.br</a>{' '}
                (assuntos de proteção de dados, direitos LGPD e comunicação com a ANPD). Também é possível usar o formulário da página{' '}
                <Link href="/sobre" style={{ color: '#ccff00' }}>Sobre</Link>.
              </li>
              <li style={{ marginBottom: 0 }}>
                <strong>Prazo de resposta:</strong> as solicitações são respondidas em até 15 dias úteis, conforme o Art. 19 da LGPD.
              </li>
            </ul>
          </section>

          {/* Seção 10 - Base Legal */}
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
              10. Base Legal para o Tratamento de Dados (Art. 7º)
            </h2>
            <p>
              Cada categoria de dados tratada possui uma base legal específica, conforme o <strong>Art. 7º da LGPD</strong>:
            </p>
            <ul style={{ paddingLeft: 20, marginTop: 12, color: '#94a3b8' }}>
              <li style={{ marginBottom: 8 }}>
                <strong>Cadastro (nome, e-mail e senha):</strong> execução do contrato de prestação de serviço (Art. 7º, V) e, para a senha, segurança de dados.
              </li>
              <li style={{ marginBottom: 8 }}>
                <strong>Currículo e análises com IA (score ATS, fit, entrevistas):</strong> seu consentimento (Art. 7º, I). Seus dados são redigidos automaticamente (PII) antes do envio a provedores de IA (ver seção 11).
              </li>
              <li style={{ marginBottom: 8 }}>
                <strong>Cookies de análise (Google Analytics) e tracking de afiliados (Impact):</strong> seu consentimento (Art. 7º, I), que pode ser revogado a qualquer momento.
              </li>
              <li style={{ marginBottom: 8 }}>
                <strong>Logs técnicos e proteção contra abuso (rate limiting, histórico de uso):</strong> legítimo interesse do controlador (Art. 7º, IX) na segurança e integridade do serviço.
              </li>
              <li style={{ marginBottom: 0 }}>
                <strong>Obrigações legais e regulatórias:</strong> cumprimento de obrigação legal (Art. 7º, II), quando aplicável.
              </li>
            </ul>
          </section>

          {/* Seção 11 - Transferência Internacional */}
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
              11. Transferência Internacional de Dados (Art. 33)
            </h2>
            <p>
              Para fornecer as análises por inteligência artificial, partes do seu currículo podem ser processadas por provedores de IA localizados fora do Brasil (por exemplo, provedores nos Estados Unidos). Essa transferência observa o <strong>Art. 33 da LGPD</strong> e adota salvaguardas:
            </p>
            <ul style={{ paddingLeft: 20, marginTop: 12, color: '#94a3b8' }}>
              <li style={{ marginBottom: 8 }}>
                <strong>Minimização de dados:</strong> apenas o texto do currículo necessário para a análise é enviado, com dados pessoais sensíveis redigidos automaticamente (CPF, CNPJ, RG, telefone, cartão).
              </li>
              <li style={{ marginBottom: 8 }}>
                <strong>Nenhum dado é vendido:</strong> os provedores processam os dados apenas para executar a análise solicitada, sem cessão a terceiros para finalidade própria.
              </li>
              <li style={{ marginBottom: 0 }}>
                <strong>Mecanismos de conformidade:</strong> utilizamos provedores com cláusulas contratuais padrão (SCCs) ou programas de adequação reconhecidos internacionalmente, quando aplicável.
              </li>
            </ul>
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
