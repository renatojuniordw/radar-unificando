'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Container } from '@mui/material';
import { useSession } from 'next-auth/react';
import { useSnackbar } from '@/hooks/useSnackbar';
import { ProfileTab } from '@/components/profile/profile-tab';
import { GeneratedResumesTab } from '@/components/profile/generated-resumes-tab';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ArrowLeft, User, Download, Trash2, FileText } from 'lucide-react';

function getInitial(name?: string | null, email?: string | null): string {
  const source = name?.trim() || email?.trim() || 'U';
  return source[0]?.toUpperCase() || 'U';
}

export default function ProfilePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { show: showSnackbar } = useSnackbar();
  const [activeTab, setActiveTab] = useState<'profile' | 'resumes'>('profile');
  const [exporting, setExporting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleExportData() {
    setExporting(true);
    try {
      const res = await fetch('/api/export');
      if (!res.ok) throw new Error('Erro ao exportar');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `radar-unificando-dados-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      showSnackbar('Dados exportados com sucesso!', 'success');
    } catch {
      showSnackbar('Erro ao exportar dados. Tente novamente.', 'error');
    } finally {
      setExporting(false);
    }
  }

  async function handleDeleteAccount() {
    setDeleting(true);
    try {
      const res = await fetch('/api/auth/account', { method: 'DELETE' });
      if (!res.ok) throw new Error('Erro ao excluir');
      showSnackbar('Conta excluída com sucesso.', 'success');
      // Redireciona para a home após exclusão
      router.push('/');
    } catch {
      showSnackbar('Erro ao excluir conta. Tente novamente.', 'error');
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  }

  const displayName = session?.user?.name?.trim() || session?.user?.email || 'Usuário';
  const initial = getInitial(session?.user?.name, session?.user?.email);

  return (
    <div className="bg-[#ffffff] min-h-screen text-[#020617] py-6 sm:py-10">
      <Container maxWidth="md">
        {/* Link de voltar */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-wider text-[#64748b] hover:text-[#020617] no-underline mb-6 transition-colors min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para vagas
        </Link>

        {/* Cabeçalho da página */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 shrink-0 rounded-full bg-[#ccff00] border-4 border-[#020617] flex items-center justify-center text-[#020617] font-black text-xl shadow-[3px_3px_0px_#000]">
            {initial}
          </div>
          <div className="min-w-0">
            <h1 className="font-black uppercase tracking-tight text-2xl sm:text-3xl leading-none m-0 text-[#020617]">
              Meu Perfil
            </h1>
            <p className="m-0 font-mono text-xs uppercase tracking-wider text-[#64748b] truncate mt-1">
              {displayName}
            </p>
          </div>
        </div>

        {/* Navegação entre Abas */}
        <div className="flex gap-2 mb-6 border-b-2 border-[#020617] pb-3">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 px-4 py-2 font-mono text-xs font-black uppercase tracking-wider border-2 border-[#020617] cursor-pointer transition-all ${
              activeTab === 'profile'
                ? 'bg-[#ccff00] text-[#020617] shadow-[3px_3px_0px_#000]'
                : 'bg-white text-[#64748b] hover:bg-slate-50'
            }`}
          >
            <User className="w-4 h-4" />
            Meu Perfil
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('resumes')}
            className={`flex items-center gap-2 px-4 py-2 font-mono text-xs font-black uppercase tracking-wider border-2 border-[#020617] cursor-pointer transition-all ${
              activeTab === 'resumes'
                ? 'bg-[#ccff00] text-[#020617] shadow-[3px_3px_0px_#000]'
                : 'bg-white text-[#64748b] hover:bg-slate-50'
            }`}
          >
            <FileText className="w-4 h-4" />
            Currículos Adaptados
          </button>
        </div>

        {/* Conteúdo da Aba de Currículos Adaptados */}
        {activeTab === 'resumes' && <GeneratedResumesTab />}

        {/* Conteúdo da Aba de Perfil */}
        {activeTab === 'profile' && <ProfileTab />}

        {/* Gerenciamento de Conta (LGPD) */}
        <div className="mt-12 pt-8 border-t-2 border-slate-200">
          <h2 className="font-black text-sm uppercase tracking-wider text-[#64748b] mb-4">
            Gerenciamento de Conta
          </h2>
          <p className="text-[#94a3b8] text-xs font-mono mb-4">
            Em conformidade com a LGPD (Lei 13.709/2018), você pode exportar seus dados ou solicitar a exclusão da sua conta e todos os dados pessoais associados.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleExportData}
              disabled={exporting}
              className="flex items-center justify-center gap-2 px-5 py-3 text-xs font-mono font-black uppercase tracking-wider border-2 border-[#020617] bg-white text-[#020617] hover:bg-slate-50 cursor-pointer min-h-[44px]"
            >
              <Download className="w-4 h-4" />
              {exporting ? 'Exportando...' : 'Exportar Meus Dados'}
            </button>
            <button
              onClick={() => setDeleteDialogOpen(true)}
              className="flex items-center justify-center gap-2 px-5 py-3 text-xs font-mono font-black uppercase tracking-wider border-2 border-red-600 bg-transparent text-red-600 hover:bg-red-50 cursor-pointer min-h-[44px]"
            >
              <Trash2 className="w-4 h-4" />
              Excluir Minha Conta
            </button>
          </div>
        </div>

        {/* Dialog de confirmação de exclusão */}
        <ConfirmDialog
          open={deleteDialogOpen}
          title="Excluir minha conta"
          message="Esta ação é irreversível. Sua conta e todos os dados pessoais associados (perfil, currículo, histórico de chats, vagas salvas) serão permanentemente excluídos. Você tem certeza?"
          confirmLabel={deleting ? 'Excluindo...' : 'Sim, excluir minha conta'}
          cancelLabel="Cancelar"
          onConfirm={handleDeleteAccount}
          onCancel={() => setDeleteDialogOpen(false)}
          severity="error"
        />
      </Container>
    </div>
  );
}
