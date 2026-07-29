# Radar Unificando

> Busca automática de vagas 100% remotas em **Gupy** e **InHire** para cargos de Dados, BI, Business e Growth.

Projeto original: [busca-vagas-gupy-inhire](https://github.com/anomalyco/busca-vagas-gupy-inhire)  
Reescrito para web por: [Renato Bezerra](https://renatobezerra.com.br/)  
Licença: MIT

---

## 🚀 Como Rodar

**Pré-requisito:** [Docker](https://docs.docker.com/get-docker/) instalado.

```bash
docker compose up
```

Abra [http://localhost:11010](http://localhost:11010)

> ✅ Pronto. Sem instalar Node, sem banco, sem configurar nada.

## Como Usar

1. **Adicione empresas** (opcional) — cole nomes na página Empresas
2. **Execute o pipeline** — clique em "EXECUTAR"
3. **Veja as vagas** — explore, filtre, exporte CSV

## Desenvolvimento

```bash
npm install
npm run dev
```

## Design System

Este projeto segue o estilo **Neo-Brutalista**:

- Contraste extremo: preto `#020617` + neon `#ccff00`
- Zero arredondamentos (`border-radius: 0`)
- Sombras sem blur (`box-shadow: 8px 8px 0px #000`)
- Tipografia pesada (`font-black`, `uppercase`, `tracking-tighter`)

## Créditos

- [@anomalyco](https://github.com/anomalyco) — scraper original Node.js + PowerShell
- [Renato Bezerra](https://renatobezerra.com.br/) — reescrita para Next.js + web
