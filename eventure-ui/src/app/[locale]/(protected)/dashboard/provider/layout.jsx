// src/app/[locale]/(protected)/dashboard/provider/layout.jsx
"use client";

import { usePathname, useRouter } from "next/navigation";
import { useMemo } from "react";
import { Box, Tabs, Tab } from "@mui/material";
import { extractLocaleAndPath } from "@/lib/extractLocaleAndPath";

const tabs = [
  { label: "Overview", value: "/dashboard/provider" },
  { label: "Profil Business", value: "/dashboard/provider/profile" },
  { label: "Servicii & Pachete", value: "/dashboard/provider/services" },
  { label: "Disponibilitate", value: "/dashboard/provider/availability" },
  { label: "Grupuri", value: "/dashboard/provider/groups" },
  { label: "Invitații", value: "/dashboard/provider/invitations" },
];

export default function ProviderLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();

  const { locale, path } = useMemo(
    () => extractLocaleAndPath(pathname),
    [pathname]
  );

  const current = useMemo(() => {
    if (!path) return "/dashboard/provider";

    // 1) Exact match (ex: /dashboard/provider/groups)
    const exact = tabs.find((t) => t.value === path);
    if (exact) return exact.value;

    // 2) Nested match pentru tab-urile non-Overview
    //    ex: /dashboard/provider/groups/1 -> /dashboard/provider/groups
    const nested = tabs
      .filter((t) => t.value !== "/dashboard/provider")
      .find(
        (t) => path === t.value || path.startsWith(`${t.value}/`)
      );

    if (nested) return nested.value;

    // 3) Fallback: Overview
    return "/dashboard/provider";
  }, [path]);

  const handleChange = (_event, newValue) => {
    if (!locale) return;
    if (!newValue || newValue === current) return; // nimic de făcut

    router.replace(`/${locale}${newValue}`);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Tabs
        value={current}
        onChange={handleChange}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 3 }}
      >
        {tabs.map((tab) => (
          <Tab key={tab.value} label={tab.label} value={tab.value} />
        ))}
      </Tabs>

      <Box>{children}</Box>
    </Box>
  );
}
