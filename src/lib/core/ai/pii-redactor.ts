/**
 * Utilitário central de sanitização e anonimização de dados pessoais sensíveis (PII)
 * em conformidade com a LGPD.
 */

const CPF_REGEX = /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g;
const CNPJ_REGEX = /\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/g;
const PHONE_REGEX = /\b(?:\+?55\s?)?(?:\(?\d{2}\)?\s?)(?:9\d{4}|\d{4})[ -]?\d{4}\b/g;
const CREDIT_CARD_REGEX = /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})\b/g;
const RG_REGEX = /\b\d{2}\.?\d{3}\.?\d{3}-?[0-9xX]\b/g;

/**
 * Redige e anonimiza dados pessoais sensíveis de uma string de texto.
 * Deve ser aplicado ANTES de salvar em banco de dados e ANTES de enviar para provedores de IA.
 * 
 * @param text Texto de entrada contendo dados brutos
 * @returns Texto sanitizado com tags de redação [CPF REDIGIDO], etc.
 */
export function redactPii(text: string): string {
  if (!text || typeof text !== 'string') return text;

  return text
    .replace(CPF_REGEX, '[CPF REDIGIDO]')
    .replace(CNPJ_REGEX, '[CNPJ REDIGIDO]')
    .replace(CREDIT_CARD_REGEX, '[CARTÃO REDIGIDO]')
    .replace(PHONE_REGEX, '[TELEFONE REDIGIDO]')
    .replace(RG_REGEX, '[RG REDIGIDO]');
}

/**
 * Sanitiza recursivamente objetos ou mensagens contendo texto antes de persistir ou enviar.
 */
export function sanitizePiiInObject<T>(obj: T): T {
  if (!obj) return obj;

  if (typeof obj === 'string') {
    return redactPii(obj) as unknown as T;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizePiiInObject(item)) as unknown as T;
  }

  if (typeof obj === 'object' && obj !== null) {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        sanitized[key] = redactPii(value);
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = sanitizePiiInObject(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized as T;
  }

  return obj;
}
