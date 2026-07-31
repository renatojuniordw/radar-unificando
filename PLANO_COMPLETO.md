# Plano Completo: Home Personalizada + Redesign /perfil + Todas as Melhorias

## RESUMO EXECUTIVO

| Feature | Prioridade | Esforço |
|---------|------------|---------|
| Recomendação por perfil | Alta | Médio |
| Chat na home | Alta | Baixo |
| Preview da IA no perfil | Média | Baixo |
| Virtualização da tabela (500+ vagas) | Alta | Médio |
| Histórico de conversas no chat | Média | Alto |
| Skeleton loading | Média | Baixo |
| Debounce na busca | Média | Baixo |
| Todas as outras melhorias | Baixa | Variado |

---

## FASE 1: CORREÇÕES PRÉVIAS (Pré-requisito)

### 1.1 `profile-completion-card.tsx`
- Adicionar `<Link href="/">` quando `skills.length > 0`
- Texto: "Ver vagas recomendadas →"

### 1.2 `e2e/fluxos-principais.spec.ts`
- Adicionar teste de redirect de /perfil não autenticado

---

## FASE 2: BACKEND — RECOMENDAÇÃO POR PERFIL

### 2.1 Criar `src/lib/core/matching/recommendation.ts`

```typescript
// Funções puras e testáveis

// Normaliza texto: lowercase, remove acentos, remove stopwords PT
function normalizeText(text: string): string

// Extrai tokens normalizados de um perfil
export function buildProfileTokens(profile: {
  currentRole: string | null;
  area: string | null;
  skills: string[];
}): string[]

// Calcula score de overlap entre tokens do perfil e campos da vaga
export function rankJobsByProfile(
  jobs: Array<{
    tituloVaga: string | null;
    nomeNaPlataforma: string | null;
    cargoCategoria: string | null;
    empresa: string;
  }>,
  tokens: string[]
): Array<{ job: any; score: number }>
```

### 2.2 Atualizar `job-repository.ts`

```typescript
// Novo método
findRecommendedByUserId(
  userId: string,
  profile: { currentRole: string | null; area: string | null; skills: string[] },
  take?: number
): Promise<Array<{ job: Job; score: number }>>
```

### 2.3 Atualizar `api/vagas/route.ts`

```typescript
// Suportar recomendado=1
if (recomendado === '1') {
  if (!session) return []
  const profile = await profileRepository.findByUserId(userId)
  if (!profile) return []
  return jobRepository.findRecommendedByUserId(userId, profile)
}
```

### 2.4 Testes `src/__tests__/recommendation.test.ts`

---

## FASE 3: CHAT NA HOME

### 3.1 Mover para Root Layout

**`src/app/layout.tsx`**:
```tsx
import { ChatAssistantProvider } from '@/contexts/chat-assistant-context';
import { ChatAssistantUI } from '@/components/chat-assistant-ui';

// Envolver main
<ChatAssistantProvider>
  <main style={{ flex: 1 }}>{children}</main>
  <ChatAssistantUI />
</ChatAssistantProvider>
```

**`src/app/(dashboard)/layout.tsx`**:
```tsx
// Remover ChatAssistantProvider e ChatAssistantUI
export default async function DashboardLayout({ children }) {
  const session = await auth();
  if (!session) redirect('/login');
  return <>{children}</>;
}
```

### 3.2 ChatAssistantUI: Esconder sem Sessão

**`src/components/chat-assistant-ui.tsx`**:
```tsx
import { useSession } from 'next-auth/react';

export function ChatAssistantUI() {
  const { data: session, status } = useSession();
  
  if (status === 'loading') return null;
  if (!session) return null;
  
  // ... resto do componente
}
```

### 3.3 Histórico de Conversas (Nova Feature)

**Novo componente: `src/components/chat-sidebar.tsx`**:
```tsx
interface Conversation {
  id: string;
  title: string;
  lastMessage: string;
  createdAt: Date;
}

interface Props {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
}

export function ChatSidebar({ conversations, activeId, onSelect, onNew }: Props) {
  return (
    <Box sx={{ 
      width: 250, 
      borderRight: '1px solid', 
      borderColor: 'divider',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Button fullWidth variant="contained" onClick={onNew}>
          Nova Conversa
        </Button>
      </Box>
      
      <List sx={{ flex: 1, overflow: 'auto' }}>
        {conversations.map(conv => (
          <ListItemButton 
            key={conv.id} 
            selected={conv.id === activeId}
            onClick={() => onSelect(conv.id)}
          >
            <ListItemText 
              primary={conv.title} 
              secondary={conv.lastMessage}
              primaryTypographyProps={{ noWrap: true, fontSize: '0.875rem' }}
              secondaryTypographyProps={{ noWrap: true, fontSize: '0.75rem' }}
            />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );
}
```

**Atualizar `chat-assistant-ui.tsx`**:
```tsx
// Adicionar estado para conversas
const [conversations, setConversations] = useState<Conversation[]>([]);
const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

// Carregar conversas do servidor
useEffect(() => {
  async function loadConversations() {
    const res = await fetch('/api/chat/conversations');
    if (res.ok) {
      const data = await res.json();
      setConversations(data);
    }
  }
  loadConversations();
}, []);

// Renderizar sidebar quando aberto
{open && (
  <Box sx={{ display: 'flex', height: '100%' }}>
    <ChatSidebar 
      conversations={conversations}
      activeId={activeConversationId}
      onSelect={handleSelectConversation}
      onNew={handleNewConversation}
    />
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      {/* Conteúdo do chat */}
    </Box>
  </Box>
)}
```

### 3.4 Botões de Ação Rápida

**No final do chat, antes do input**:
```tsx
<Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
  <Chip 
    label="Buscar vagas" 
    size="small"
    onClick={() => sendMessage("Busque vagas de " + (profile.currentRole || "minha área"))}
    sx={{ cursor: 'pointer' }}
  />
  <Chip 
    label="Analisar perfil" 
    size="small"
    onClick={() => sendMessage("Analise meu perfil e me diga como estão minhas chances")}
    sx={{ cursor: 'pointer' }}
  />
  <Chip 
    label="Gerar carta" 
    size="small"
    onClick={() => sendMessage("Gere uma carta de apresentação para uma vaga")}
    sx={{ cursor: 'pointer' }}
  />
</Box>
```

### 3.5 Indicador de Digitação Melhorado

```tsx
{loading && (
  <Box sx={{ display: 'flex', gap: 0.5, p: 1, alignItems: 'center' }}>
    {[0, 1, 2].map(i => (
      <Box
        key={i}
        sx={{
          width: 8, height: 8, borderRadius: '50%',
          bgcolor: 'grey.400',
          animation: 'pulse 1.4s infinite ease-in-out',
          animationDelay: `${i * 0.2}s`,
          '@keyframes pulse': {
            '0%, 80%, 100%': { opacity: 0.3, transform: 'scale(0.8)' },
            '40%': { opacity: 1, transform: 'scale(1)' },
          },
        }}
      />
    ))}
    <Typography variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>
      Digitando...
    </Typography>
  </Box>
)}
```

---

## FASE 4: HOME PERSONALIZADA

### 4.1 Saudação no Hero

**`src/app/page.tsx`**:
```tsx
const { data: session } = useSession();
const profile = useProfile();

const primeiroNome = session?.user?.name?.split(' ')[0] 
  || session?.user?.email?.split('@')[0] 
  || '';

const perfilMinimo = profile.skills.length >= 3 && (profile.currentRole || profile.area);

// No hero section
{session && (
  <Box sx={{ mb: 4 }}>
    <Typography variant="h2" sx={{ fontWeight: 900, mb: 1 }}>
      OLÁ, {primeiroNome.toUpperCase()}
    </Typography>
    <Typography variant="body1" sx={{ color: '#64748b' }}>
      Encontramos vagas que combinam com seu perfil.
    </Typography>
  </Box>
)}
```

### 4.2 CTA de Perfil Incompleto

```tsx
{session && !perfilMinimo && (
  <Box sx={{ 
    mb: 3, p: 2, 
    border: '2px solid #ccff00', 
    bgcolor: 'rgba(204, 255, 0, 0.05)',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    borderRadius: 1,
  }}>
    <Typography variant="body2" sx={{ fontWeight: 700 }}>
      Complete seu perfil para receber vagas recomendadas
    </Typography>
    <Link href="/perfil" sx={{ 
      fontWeight: 900, fontSize: '0.7rem', textTransform: 'uppercase',
      color: '#020617', textDecoration: 'none',
      border: '2px solid #020617', px: 2, py: 1,
    }}>
      COMPLETAR →
    </Link>
  </Box>
)}
```

### 4.3 Vagas Recomendadas

```tsx
const [modoRecomendado, setModoRecomendado] = useState(false);

useEffect(() => {
  if (session && perfilMinimo) {
    setModoRecomendado(true);
    if (profile.currentRole || profile.area) {
      setCargosBusca([profile.currentRole || profile.area]);
    }
  }
}, [session, perfilMinimo, profile.currentRole, profile.area]);

// Na chamada de vagas
async function carregarVagas(filters = {}) {
  setLoading(true);
  const params = new URLSearchParams();
  
  if (modoRecomendado && session) {
    params.set('recomendado', '1');
  } else {
    if (filters.plataforma) params.set('plataforma', filters.plataforma);
    if (filters.cargo) params.set('cargo', filters.cargo);
    if (filters.search) params.set('search', filters.search);
  }
  
  const query = params.toString();
  const res = await fetch(`/api/vagas${query ? "?" + query : ""}`);
  // ...
}

// Seção de vagas recomendadas
{modoRecomendado && vagas.length > 0 && (
  <Box sx={{ mb: 4 }}>
    <Typography variant="h3" sx={{ 
      fontWeight: 900, mb: 2, 
      textTransform: 'uppercase', letterSpacing: '-0.01em'
    }}>
      RECOMENDADAS PARA VOCÊ · {profile.area || profile.currentRole || ''}
    </Typography>
  </Box>
)}
```

### 4.4 Filtros Persistentes

```tsx
// Salvar filtros no localStorage
useEffect(() => {
  const saved = localStorage.getItem('radar-filters');
  if (saved) {
    const filters = JSON.parse(saved);
    setCargosBusca(filters.cargos || []);
    // Outros filtros
  }
}, []);

useEffect(() => {
  localStorage.setItem('radar-filters', JSON.stringify({
    cargos: cargosBusca,
    // Outros filtros
  }));
}, [cargosBusca]);
```

### 4.5 Estatísticas Rápidas

```tsx
// Acima da tabela
{vagas.length > 0 && (
  <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
    <Chip 
      label={`${vagas.length} vagas encontradas`} 
      color="primary" 
      size="small"
    />
    <Chip 
      label={`${vagas.filter(v => v.na_lista === 'Sim').length} na sua lista`} 
      color="warning" 
      size="small"
    />
    <Chip 
      label={`${new Set(vagas.map(v => v.empresa)).size} empresas`} 
      color="secondary" 
      size="small"
    />
  </Box>
)}
```

---

## FASE 5: REDESIGN DA /PERFIL

### 5.1 Nova Lógica de Estados

**`perfil/page.tsx`**:
```typescript
type ProfileStatus = 'empty' | 'importing' | 'reviewing' | 'complete';

const profileStatus: ProfileStatus = useMemo(() => {
  if (!hasResume && profile.skills.length === 0 && !showManualForm) return 'empty';
  if (!hasResume && showManualForm) return 'importing';
  if (hasResume || profile.skills.length > 0) return 'reviewing';
  return 'complete';
}, [hasResume, showManualForm, profile.skills.length]);
```

### 5.2 Renderização Condicional Simplificada

```tsx
{profileStatus === 'empty' && <ProfileEmptyState />}
{profileStatus === 'importing' && <ProfileImportSection />}
{profileStatus === 'reviewing' && (
  <>
    <ProfileCompletionCard />
    <ProfileReviewSection />
    {hasResume && <ProfileImportSection variant="reimport" />}
  </>
)}
{profileStatus === 'complete' && <ProfileSuccessCard />}
```

### 5.3 Corrigir Typo

**`profile-import-section.tsx:95`**:
- **Antes**: "OU Cole o Texto do_currículo"
- **Depois**: "OU Cole o Texto do Currículo"

### 5.4 Botão Salvar Inteligente

```tsx
const hasChanges = profile.fieldOverrides.size > 0 || 
  (profileStatus === 'reviewing' && !profile.saving);

{hasChanges && (
  <button onClick={handleSave} className="btn-neon">
    {profile.saving ? 'SALVANDO...' : 'SALVAR PERFIL'}
  </button>
)}
```

### 5.5 Preview da IA

**Novo componente: `src/components/profile/profile-ai-preview.tsx`**:
```tsx
interface Props {
  seniority: string;
  area: string;
  skills: string[];
  experienceYears: number;
  currentRole: string;
}

export function ProfileAIPreview({ seniority, area, skills, experienceYears, currentRole }: Props) {
  const perfilMinimo = skills.length >= 3 && (currentRole || area);
  
  return (
    <div className="card-brutalist" style={{ 
      padding: 20, marginBottom: 24,
      borderLeft: '4px solid #ccff00',
      bgcolor: 'rgba(204, 255, 0, 0.02)'
    }}>
      <h4 style={{ 
        fontWeight: 900, fontSize: '0.75rem', textTransform: 'uppercase',
        letterSpacing: '0.02em', margin: '0 0 12px', color: '#020617'
      }}>
        COMO A IA VÊ SEU PERFIL
      </h4>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Senioridade</span>
          <span style={{ fontSize: '0.7rem', fontWeight: 700 }}>
            {seniority || 'Não definida'}
          </span>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Área</span>
          <span style={{ fontSize: '0.7rem', fontWeight: 700 }}>
            {area || 'Não definida'}
          </span>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Experiência</span>
          <span style={{ fontSize: '0.7rem', fontWeight: 700 }}>
            {experienceYears > 0 ? `${experienceYears} anos` : 'Não informada'}
          </span>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Skills</span>
          <span style={{ fontSize: '0.7rem', fontWeight: 700 }}>
            {skills.length > 0 
              ? `${skills.length} skills (${skills.slice(0, 3).join(', ')}${skills.length > 3 ? '...' : ''})`
              : 'Nenhuma'
            }
          </span>
        </div>
        
        <div style={{ 
          marginTop: 8, padding: '8px 12px', 
          bgcolor: perfilMinimo ? '#f0fdf4' : '#fef2f2',
          borderRadius: 4,
          border: `1px solid ${perfilMinimo ? '#16a34a' : '#dc2626'}`
        }}>
          <span style={{ 
            fontSize: '0.65rem', fontWeight: 700,
            color: perfilMinimo ? '#16a34a' : '#dc2626'
          }}>
            {perfilMinimo 
              ? '✓ Perfil pronto para recomendações'
              : '⚠ Complete seu perfil para melhores recomendações'
            }
          </span>
        </div>
      </div>
    </div>
  );
}
```

### 5.6 Integrar no `profile-review-section.tsx`

```tsx
import { ProfileAIPreview } from './profile-ai-preview';

// No final do componente
<>
  {/* Skills */}
  <div className="card-brutalist">...</div>
  
  {/* Experiência */}
  <div className="card-brutalist">...</div>
  
  {/* Preview da IA */}
  <ProfileAIPreview
    seniority={seniority}
    area={area}
    skills={skills}
    experienceYears={experienceYears}
    currentRole={currentRole}
  />
</>
```

### 5.7 Progresso por Categoria

**`profile-completion-card.tsx`**:
```tsx
<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2 }}>
  {[
    { label: 'Skills', done: skills.length >= 3, total: 3 },
    { label: 'Senioridade', done: !!seniority, total: 1 },
    { label: 'Experiência', done: experienceYears > 0, total: 1 },
    { label: 'Cargo', done: !!currentRole, total: 1 },
    { label: 'Área', done: !!area, total: 1 },
    { label: 'Currículo', done: (resumeText?.length || 0) > 50, total: 1 },
  ].map(item => (
    <Box key={item.label} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Typography variant="caption" sx={{ width: 80, fontSize: '0.65rem' }}>
        {item.label}
      </Typography>
      <Box sx={{ flex: 1, height: 4, bgcolor: 'grey.200', borderRadius: 2 }}>
        <Box 
          sx={{ 
            width: item.done ? '100%' : '0%', 
            height: '100%', 
            bgcolor: item.done ? 'success.main' : 'warning.main', 
            borderRadius: 2, 
            transition: 'width 0.3s' 
          }} 
        />
      </Box>
    </Box>
  ))}
</Box>
```

### 5.8 Import em Lote de Skills

**`profile-review-section.tsx`**:
```tsx
const [bulkSkillsInput, setBulkSkillsInput] = useState('');

// Adicionar após o Autocomplete
<TextField
  label="Ou adicionar múltiplas skills"
  placeholder="Python, SQL, Spark, Airflow"
  value={bulkSkillsInput}
  onChange={(e) => setBulkSkillsInput(e.target.value)}
  onKeyPress={(e) => {
    if (e.key === 'Enter') {
      const skills = bulkSkillsInput.split(',').map(s => s.trim()).filter(Boolean);
      if (skills.length > 0) {
        onAddSkills(skills);
        setBulkSkillsInput('');
      }
    }
  }}
  size="small"
  sx={{ mb: 2 }}
  helperText="Separadas por vírgula, pressione Enter para adicionar"
/>
```

---

## FASE 6: PERFORMANCE E UX

### 6.1 Virtualização da Tabela (500+ vagas)

**Instalar dependência**:
```bash
npm install @tanstack/react-virtual
```

**`src/components/vaga-table.tsx`**:
```tsx
import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';

// Adicionar estado
const parentRef = useRef<HTMLDivElement>(null);

// Virtualizar quando vagas.length > 50
const rowVirtualizer = useVirtualizer({
  count: filteredVagas.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 60, // Altura estimada de cada linha
  overscan: 10,
});

// Renderizar tabela virtualizada
<Box ref={parentRef} sx={{ height: '60vh', overflow: 'auto' }}>
  <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative' }}>
    {rowVirtualizer.getVirtualItems().map((virtualRow) => {
      const vaga = filteredVagas[virtualRow.index];
      return (
        <div
          key={virtualRow.key}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: `${virtualRow.size}px`,
            transform: `translateY(${virtualRow.start}px)`,
          }}
        >
          {/* Conteúdo da linha */}
        </div>
      );
    })}
  </div>
</Box>
```

### 6.2 Skeleton Loading

**`src/app/page.tsx`**:
```tsx
// Componente de skeleton
function VagaSkeleton() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <Box key={i} sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Skeleton variant="rectangular" width={120} height={20} />
          <Skeleton variant="rectangular" width={80} height={20} />
          <Skeleton variant="rectangular" width={200} height={20} />
          <Skeleton variant="rectangular" width={100} height={20} />
          <Skeleton variant="rectangular" width={60} height={20} />
        </Box>
      ))}
    </Box>
  );
}

// No componente principal
{loading ? (
  <VagaSkeleton />
) : (
  <VagaTable vagas={vagas} />
)}
```

### 6.3 Debounce na Busca

**Instalar dependência**:
```bash
npm install use-debounce
```

**`src/components/vaga-table.tsx`**:
```tsx
import { useDebounce } from 'use-debounce';

const [searchTerm, setSearchTerm] = useState('');
const [debouncedSearch] = useDebounce(searchTerm, 300);

useEffect(() => {
  onFilterChange({ search: debouncedSearch });
}, [debouncedSearch]);
```

### 6.4 Modo de Visualização

**`src/components/vaga-table.tsx`**:
```tsx
const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

// Toggle de visualização
<Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
  <IconButton 
    onClick={() => setViewMode('table')}
    sx={{ bgcolor: viewMode === 'table' ? 'primary.main' : 'transparent' }}
  >
    <TableIcon />
  </IconButton>
  <IconButton 
    onClick={() => setViewMode('cards')}
    sx={{ bgcolor: viewMode === 'cards' ? 'primary.main' : 'transparent' }}
  >
    <CardsIcon />
  </IconButton>
</Box>

// Renderização condicional
{viewMode === 'table' ? (
  <TableVagas vagas={vagas} />
) : (
  <CardsVagas vagas={vagas} />
)}
```

---

## FASE 7: ACESSIBILIDADE

### 7.1 Skip Links

**`src/app/layout.tsx`**:
```tsx
<Box sx={{ position: 'absolute', top: -40, left: 0, zIndex: 9999 }}>
  <a 
    href="#main-content"
    sx={{ 
      p: 2, 
      bgcolor: 'primary.main', 
      color: 'common.white',
      textDecoration: 'none',
      '&:focus': { top: 0 }
    }}
  >
    Pular para conteúdo principal
  </a>
</Box>

<main id="main-content" style={{ flex: 1 }}>{children}</main>
```

### 7.2 ARIA Labels Melhorados

**`src/components/vaga-table.tsx`**:
```tsx
<IconButton 
  aria-label={`Ver vaga ${vaga.titulo_vaga} na ${vaga.empresa}`}
  onClick={() => window.open(vaga.link, '_blank')}
>
  <LaunchIcon />
</IconButton>
```

### 7.3 Indicador de Digitação Acessível

```tsx
{loading && (
  <Box 
    sx={{ display: 'flex', gap: 0.5, p: 1, alignItems: 'center' }}
    role="status"
    aria-live="polite"
  >
    {/* Animação de pontos */}
    <Typography variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>
      Assistente está digitando...
    </Typography>
  </Box>
)}
```

---

## FASE 8: LIMPEZA DE CÓDIGO

### 8.1 Remover Imports Não Usados

```tsx
// Em page.tsx - verificar se AnonymousStorage é usado
import { AnonymousStorage } from '@/lib/infrastructure/storage/local-storage';
```

### 8.2 Consolidar Componentes Similares

**Novo componente: `src/components/base-card.tsx`**:
```tsx
interface Props {
  title: string;
  children: React.ReactNode;
  variant?: 'default' | 'highlight' | 'success' | 'warning';
}

export function BaseCard({ title, children, variant = 'default' }: Props) {
  const variantStyles = {
    default: {},
    highlight: { borderLeft: '4px solid #ccff00' },
    success: { borderLeft: '4px solid #16a34a' },
    warning: { borderLeft: '4px solid #f59e0b' },
  };
  
  return (
    <div 
      className="card-brutalist" 
      style={{ 
        padding: 24, 
        marginBottom: 24,
        ...variantStyles[variant]
      }}
    >
      <h3 style={{ 
        fontWeight: 900, 
        textTransform: 'uppercase', 
        letterSpacing: '-0.01em', 
        fontSize: '0.9rem', 
        margin: '0 0 16px' 
      }}>
        {title}
      </h3>
      {children}
    </div>
  );
}
```

---

## FASE 9: TESTES E VALIDAÇÃO

### 9.1 Novos Testes

| Arquivo | Cobertura |
|---------|-----------|
| `src/__tests__/recommendation.test.ts` | Tokens + Ranking |
| `src/__tests__/api-vagas.test.ts` | Casos recomendado |
| `src/__tests__/profile-ai-preview.test.tsx` | Renderização |
| `src/__tests__/chat-sidebar.test.tsx` | Renderização |

### 9.2 Validação

```bash
npm run lint
npx tsc --noEmit
npm test
npm run build
```

---

## ORDEM DE EXECUÇÃO

| Fase | Ação | Dependência | Esforço |
|------|------|-------------|---------|
| **1** | Corrigir resquícios (link, e2e) | Nenhuma | Baixo |
| **2** | Backend recomendação | Nenhuma | Médio |
| **3** | Chat na home + histórico | Nenhuma | Médio |
| **4** | Home personalizada | Fase 2 | Médio |
| **5** | Redesign /perfil | Nenhuma | Médio |
| **6** | Performance (virtualização, debounce) | Nenhuma | Médio |
| **7** | Acessibilidade | Nenhuma | Baixo |
| **8** | Limpeza de código | Nenhuma | Baixo |
| **9** | Testes e validação | Fases 1-8 | Baixo |

**Total estimado**: ~8-12 horas

---

## DEPENDÊNCIAS NECESSÁRIAS

```bash
npm install @tanstack/react-virtual use-debounce
```

---

## RESUMO DE ENTREGÁVEIS

| # | Entregável | Status |
|---|------------|--------|
| 1 | `recommendation.ts` (funções puras) | Novo |
| 2 | `job-repository.ts` (findRecommendedByUserId) | Atualizado |
| 3 | `api/vagas/route.ts` (recomendado=1) | Atualizado |
| 4 | `recommendation.test.ts` | Novo |
| 5 | `profile-ai-preview.tsx` | Novo |
| 6 | `profile-review-section.tsx` (com preview) | Atualizado |
| 7 | `layout.tsx` (chat no root) | Atualizado |
| 8 | `dashboard/layout.tsx` (simplificado) | Atualizado |
| 9 | `chat-assistant-ui.tsx` (esconde sem sessão) | Atualizado |
| 10 | `chat-sidebar.tsx` (histórico) | Novo |
| 11 | `page.tsx` (saudação + recomendadas) | Atualizado |
| 12 | `profile-completion-card.tsx` (link + progresso) | Atualizado |
| 13 | `vaga-table.tsx` (virtualização + debounce) | Atualizado |
| 14 | `base-card.tsx` (componente base) | Novo |
| 15 | Testes adicionais | Novos |
