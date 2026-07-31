import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { ChatAssistantProvider } from '@/contexts/chat-assistant-context';
import { ChatAssistantUI } from '@/components/chat-assistant-ui';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect('/login');
  return (
    <ChatAssistantProvider>
      {children}
      <ChatAssistantUI />
    </ChatAssistantProvider>
  );
}
