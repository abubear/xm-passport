import { redirect } from 'next/navigation';
import { getAuthToken, verifyToken } from '@/lib/auth';
import ClientLayout from '@/components/ui/ClientLayout';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = getAuthToken();

  if (!token) {
    redirect('/login');
  }

  const user = verifyToken(token);
  if (!user) {
    redirect('/login');
  }

  return <ClientLayout>{children}</ClientLayout>;
}
