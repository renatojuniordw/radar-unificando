import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { ChatAssistant } from '@/components/chat-assistant';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect('/login');
  return (
    <>
      {children}
      <ChatAssistant />
    </>
  );
}
