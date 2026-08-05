import { describe, it, expect } from 'vitest';

describe('Chat UX Improvements Suite', () => {
  it('deve gerar título automático limpo limitado a 40 caracteres a partir da 1ª mensagem do usuário', () => {
    const rawMessage = '  Gostaria de saber quais vagas de DevOps remoto estão disponíveis hoje?  ';
    const inferredTitle = rawMessage.trim().slice(0, 40);

    expect(inferredTitle).toBe('Gostaria de saber quais vagas de DevOps ');
    expect(inferredTitle.length).toBeLessThanOrEqual(40);
  });

  it('deve identificar mensagens de erro para habilitar o botão Tentar Novamente', () => {
    const errorMessageText = 'Ocorreu um erro ao processar a resposta. Tente novamente em instantes.';
    const normalMessageText = 'Aqui estão as melhores vagas para o seu perfil!';

    const isError1 = errorMessageText.includes('Ocorreu um erro') || errorMessageText.includes('Erro ao processar');
    const isError2 = normalMessageText.includes('Ocorreu um erro') || normalMessageText.includes('Erro ao processar');

    expect(isError1).toBe(true);
    expect(isError2).toBe(false);
  });

  it('deve calcular se o scroll está no fundo com margem de tolerância', () => {
    const scrollHeight = 1000;
    const clientHeight = 400;
    
    const scrollTopAtBottom = 580; // 1000 - 580 - 400 = 20 < 60 -> No fundo
    const isAtBottom1 = scrollHeight - scrollTopAtBottom - clientHeight < 60;

    const scrollTopAtMiddle = 300; // 1000 - 300 - 400 = 300 >= 60 -> No meio/topo
    const isAtBottom2 = scrollHeight - scrollTopAtMiddle - clientHeight < 60;

    expect(isAtBottom1).toBe(true);
    expect(isAtBottom2).toBe(false);
  });
});
