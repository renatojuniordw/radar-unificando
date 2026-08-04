import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const title = searchParams.get('title') || 'Radar Unificando — Vagas Gupy & InHire';
    const company = searchParams.get('company') || 'Vagas em Tempo Real';
    const role = searchParams.get('role') || '100% Remoto';

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            backgroundColor: '#020617',
            padding: '60px 80px',
            fontFamily: 'sans-serif',
            border: '12px solid #ccff00',
            boxSizing: 'border-box',
          }}
        >
          {/* Header Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                backgroundColor: '#ccff00',
                color: '#020617',
                padding: '8px 20px',
                fontSize: '20px',
                fontWeight: 900,
                letterSpacing: '2px',
                textTransform: 'uppercase',
              }}
            >
              GUPY + INHIRE · TEMPO REAL
            </div>
          </div>

          {/* Main Title & Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '1000px' }}>
            <div
              style={{
                fontSize: '56px',
                fontWeight: 900,
                color: '#ccff00',
                lineHeight: 1.05,
                textTransform: 'uppercase',
                letterSpacing: '-2px',
              }}
            >
              {title}
            </div>
            <div style={{ fontSize: '32px', color: '#94a3b8', fontWeight: 700, display: 'flex', gap: '12px' }}>
              🏢 {company} · 📍 {role}
            </div>
          </div>

          {/* Footer Bar */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              width: '100%',
              alignItems: 'center',
              borderTop: '2px solid #1e293b',
              paddingTop: '24px',
            }}
          >
            <div style={{ color: '#ffffff', fontSize: '24px', fontWeight: 700 }}>
              radar.unificando.com.br
            </div>
            <div
              style={{
                backgroundColor: '#0f172a',
                color: '#ccff00',
                border: '2px solid #ccff00',
                padding: '6px 16px',
                fontSize: '18px',
                fontWeight: 800,
              }}
            >
              BUSCA INTELIGENTE DE VAGAS
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch {
    return new Response('Erro ao gerar imagem OG', { status: 500 });
  }
}
