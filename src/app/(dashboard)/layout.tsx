import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { ChatAssistant } from '@/components/chat-assistant';
import { ChatAssistantProvider } from '@/contexts/chat-assistant-context';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect('/login');
  return (
    <ChatAssistantProvider>
      {children}
      <ChatAssistant />
    </ChatAssistantProvider>
  );
}
