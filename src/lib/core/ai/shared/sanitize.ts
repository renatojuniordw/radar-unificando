// Sanitização de conteúdo não confiável (currículo e descrição de vaga vêm
// de terceiros — usuário e postagens externas via Gupy). Colapsa espaços
// excessivos e neutraliza tentativas de "fechar" a tag delimitadora mais
// cedo (ex.: o texto contém literalmente "</resume>" tentando escapar do
// bloco de dados).
export function sanitizeUntrusted(text: string, tag: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\n{4,}/g, '\n\n\n')
    .replace(new RegExp(`</?${tag}>`, 'gi'), '')
    .trim();
}
