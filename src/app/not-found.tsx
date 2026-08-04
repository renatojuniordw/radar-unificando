import Link from 'next/link';

export default function NotFound() {
  return (
    <main
      style={{
        backgroundColor: '#020617',
        color: '#ffffff',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      <div
        style={{
          maxWidth: '560px',
          width: '100%',
          backgroundColor: '#0f172a',
          border: '4px solid #1e293b',
          padding: '48px 32px',
          textAlign: 'center',
          boxShadow: '12px 12px 0px #ccff00',
        }}
      >
        <div
          style={{
            display: 'inline-block',
            backgroundColor: '#ccff00',
            color: '#020617',
            padding: '4px 12px',
            fontWeight: 900,
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            marginBottom: 20,
            fontFamily: 'ui-monospace, monospace',
          }}
        >
          ERRO 404 — ROTA NÃO ENCONTRADA
        </div>

        <h1
          style={{
            fontSize: '4rem',
            fontWeight: 900,
            margin: 0,
            lineHeight: 1,
            color: '#ccff00',
            fontFamily: 'ui-monospace, monospace',
            letterSpacing: '-0.03em',
          }}
        >
          404
        </h1>

        <h2
          style={{
            fontSize: '1.25rem',
            fontWeight: 800,
            marginTop: 16,
            marginBottom: 12,
            textTransform: 'uppercase',
            color: '#ffffff',
          }}
        >
          Vaga ou página encerrada
        </h2>

        <p
          style={{
            color: '#94a3b8',
            fontSize: '0.875rem',
            lineHeight: 1.6,
            marginBottom: 32,
            fontFamily: 'ui-monospace, monospace',
          }}
        >
          O endereço digitado não existe ou a vaga procurada não está mais disponível no Radar Unificando.
        </p>

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
            boxShadow: '4px 4px 0px #ffffff',
            transition: 'all 150ms ease-out',
          }}
        >
          Voltar para a Busca de Vagas
        </Link>
      </div>
    </main>
  );
}
