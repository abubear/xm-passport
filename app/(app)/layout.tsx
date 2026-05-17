import ClientLayout from '@/components/ui/ClientLayout';

// CONCEPT MODE: no auth check — all pages public with demo data
export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ClientLayout>{children}</ClientLayout>;
}
