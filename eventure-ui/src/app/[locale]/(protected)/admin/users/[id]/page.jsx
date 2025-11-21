'use client'
import AdminUserDetail from "@/components/admin/users/AdminUserDetail";
import { extractLocaleAndPath } from "@/lib/extractLocaleAndPath";
import { usePathname } from "next/navigation";

export default function AdminUserDetailPage({ params }) {
  const pathname = usePathname()
  
  const {locale, path} = extractLocaleAndPath(pathname)
  const last = path.split("/")
  const len = last.length
  const id = last[len-1]
  
  return <AdminUserDetail userId={id} />;
}
