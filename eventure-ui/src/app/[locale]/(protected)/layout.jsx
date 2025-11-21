// src/app/[locale]/(protected)/layout.jsx
import { requireUserRSC } from '@/lib/server-auth';

export default async function ProtectedLayout({ children, params }) {
  const { locale } = await params;       // ✅ await!
  await requireUserRSC(locale || 'ro');  // ✅ user check on server
  return <>{children}</>;
}
