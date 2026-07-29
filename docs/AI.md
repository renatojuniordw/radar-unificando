# AI no Browser — Radar Unificando v2

## Transformers.js

Processamento local no browser usando modelos de NLP. Sem custo, sem envio de dados.

| Tarefa | Modelo | Tamanho |
|--------|--------|---------|
| NER (extrair skills) | `Xenova/bert-base-NER` | ~400MB |
| Embeddings (match semântico) | `Xenova/all-MiniLM-L6-v2` | ~80MB |

## Pipeline de Extração

```
Upload PDF (LinkedIn export)
  → pdfjs-dist extrai texto
  → Transformers.js NER identifica skills, cargos, empresas
  → Usuário revisa e ajusta
  → Salva no perfil (PostgreSQL)
```

## Fallback

Se Transformers.js falhar:
1. Extração por regex + taxonomia (determinístico)
2. Match por palavras-chave (sem embeddings)

## Gemini API (Opcional)

Usuário pode colar a própria API key para adaptação de currículo por IA.
