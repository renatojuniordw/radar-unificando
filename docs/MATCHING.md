# Matching Engine — Radar Unificando v2

## Scoring Engine (9 Componentes)

O score é calculado pelo `ScoringEngine` em `src/lib/core/matching/scoring-engine.ts`.

| Componente | Peso | Descrição |
|-----------|------|-----------|
| mandatorySkills | 30% | Skills obrigatórias da vaga |
| desirableSkills | 15% | Skills desejáveis |
| responsibilities | 15% | Responsabilidades do cargo |
| seniority | 10% | Nível de senioridade |
| domain | 10% | Domínio de atuação |
| education | 5% | Formação acadêmica |
| languages | 5% | Idiomas |
| logistics | 5% | Localização + remoto |
| behavioral | 5% | Fit comportamental |

## Skill Taxonomy

`src/lib/core/matching/skill-taxonomy.ts` contém a taxonomia de skills categorizadas:

- Data & Analytics
- BI & Visualization
- Programming & Engineering
- Cloud & Infrastructure
- Business & Strategy
- Marketing & Growth
- Tools & Platforms
- Soft Skills
- Domain Knowledge

## Como usar

```typescript
const match = scoringEngine.calculate(profileData, requirements);
// match.totalScore → 0-1 (multiplique por 100 para %)
// match.breakdown → scores por componente
// match.matchedSkills → skills que deram match
// match.missingMandatory → skills obrigatórias faltando
// match.evidence → array de explicações
```
