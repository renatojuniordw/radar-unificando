/**
 * Serialização segura para blocos <script type="application/ld+json">.
 *
 * JSON.stringify NÃO escapa `<`, `>` e `&`: um dado contendo
 * `</script><script>...` vazaria do bloco JSON-LD e injetaria HTML/JS (stored XSS).
 * Escapar como \uXXXX mantém o JSON semanticamente idêntico e o HTML inofensivo.
 *
 * Use esta função em TODOS os pontos que inserem JSON-LD via dangerouslySetInnerHTML
 * (centralizado em um único lugar — ver relatório securança item 1.4).
 */
export function toScriptJson(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
}
