# Permissões da API Impact Radius (Udemy Affiliate) — Radar Unificando

Este documento registra as configurações, escopos autorizados e políticas de segurança aplicadas ao token de acesso da API do **Impact Radius** para a integração com a **Udemy Affiliate** na plataforma **Radar Unificando**.

---

## 📌 Informações do Token

| Campo | Valor Configurado |
| :--- | :--- |
| **Token Name** | `radarunificando` |
| **Description** | `Token de acesso para integração e consulta da API de cursos e afiliados na plataforma Radar Unificando.` |
| **Versão da API** | `16 (2026-03-31)` |
| **Ambiente** | Produção |

---

## ✅ Escopos Autorizados (Habilitados)

Os escopos abaixo foram selecionados seguindo a política de menor privilégio (*Least Privilege Principle*), permitindo que a plataforma consulte catálogos de cursos, promoções, gere links de rastreamento e monitore conversões.

| Escopo / Categoria | Métodos | Objetivos & Justificativa no Radar Unificando |
| :--- | :---: | :--- |
| **Ads** | `GET` | Recuperar anúncios em texto, banners e links promocionais da Udemy com suporte a iframe e códigos de rastreamento. |
| **Catalogs** | `GET` | Consultar os catálogos completos de cursos da Udemy e executar buscas dinâmicas (`ItemSearch`). |
| **Tracking Links** | `POST`, `GET` | Gerar dinamicamente e consultar os links com parâmetro de afiliado (*tracking links*) para o usuário final. |
| **Actions** | `GET` | Consultar relatórios de ações (conversões/vendas) registradas e elegíveis para comissão. |
| **Clicks** | `GET` | Monitorar o volume e detalhes de cliques nos links de afiliados disponibilizados. |
| **Campaigns** | `GET` | Obter informações e logotipos da campanha de afiliado da Udemy. |
| **Deals** | `GET` | Consultar ofertas e promoções ativas associadas à campanha da Udemy. |
| **Products** | `GET` | Buscar produtos do marketplace da Impact para exibição na plataforma. |
| **Promo Codes** | `GET` | Obter códigos promocionais e cupons de desconto ativos para ofertas de cursos. |
| **Promotions** | `GET` | Obter a lista de anúncios promocionais e ofertas específicas. |
| **Reports** | `GET` | Gerar e exportar relatórios de desempenho e receita. |
| **Contracts** | `GET` | Consultar termos contratuais e taxas de comissão vigentes na campanha. |
| **Accounts** | `GET` | Consultar a home da conta mediapartner (`/Mediapartners/<AccountSID>`). |

---

## 🛡️ Escopos Bloqueados (Políticas de Segurança)

Para garantir a máxima segurança das credenciais e seguir as boas práticas da LGPD e ISO 27001, os seguintes escopos sensíveis foram **desativados** no token de acesso:

| Escopo Desativado | Razão da Restrição |
| :--- | :--- |
| **Withdrawal Settings** | Impede qualquer alteração via API nos dados de saque e conta bancária da empresa. |
| **Tax Documents** | Impede o acesso ou envio de documentos fiscais e comprovantes de impostos. |
| **Identity Verification** | Impede criação ou alteração de sessões de verificação de identidade (KYC). |
| **Users** | Impede visualização ou alteração de usuários administradores da conta Impact. |
| **Media Properties** | Impede criação, alteração ou exclusão dos sites/propriedades cadastradas. |
| **Invoices** | Evita download de notas fiscais internas da conta. |
| **Action Inquiries** | Oculta investigações formais de disputas de pagamento (tratadas manualmente no painel). |
| **Jobs Management** | Evita reprocessamento ou gerenciamento de rotinas em lote não supervisionadas. |
| **Exception List** | Evita manipulação de listas de exceção de cupons/descontos. |
| **Stores** | Desnecessário para a integração exclusiva de ofertas digitais da Udemy. |

---

## 🔄 Manutenção e Auditoria

- **Revisão Anual**: Este token deve ter suas permissões revisadas anualmente ou sempre que houver alteração contratual com a Udemy / Impact Radius.
- **Armazenamento Seguro**: As credenciais geradas (`Account SID` e `Auth Token`) devem ser armazenadas exclusivamente em variáveis de ambiente criptografadas (`.env` em produção) e nunca versionadas no repositório Git.
