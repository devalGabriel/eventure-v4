"use client";
import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Stack,
  Typography,
  Divider,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import Link from "next/link";
import { usePathname } from "next/navigation";

import DashboardIcon from "@mui/icons-material/Dashboard";
import PeopleIcon from "@mui/icons-material/People";
import EventIcon from "@mui/icons-material/Event";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import SettingsIcon from "@mui/icons-material/Settings";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";

const ICONS = {
  Dashboard: <DashboardIcon fontSize="small" />,
  Users: <PeopleIcon fontSize="small" />,
  Offers: <LocalOfferIcon fontSize="small" />,
  "My Events": <EventIcon fontSize="small" />,
  Settings: <SettingsIcon fontSize="small" />,
};

const NAV_BY_ROLE = {
    ADMIN: [
    {
      section: "General",
      items: [
        { label: "Dashboard", href: "/dashboard" },
        { label: "Events", href: "/admin/events" },
      ],
    },
    {
      section: "Administrare",
      items: [
        { label: "Users", href: "/admin/users" },
        { label: "Settings", href: "/settings" },
        { label: "Modules", href: "/admin/modules" },
        { label: "Providers", href: "/admin/providers" },
        { label: "Provider Applications", href: "/admin/providers/applications" },
        { label: "Provider Catalog", href: "/dashboard/admin/providers/catalog" }, // 👈 nou
      ],
    },
  ],

  PROVIDER: [
    { section: "Provider Area", items: [{ label: "Profil si configurari", href: "/dashboard/provider" }] },
    {
      section: "Servicii",
      items: [
        { label: "Offers", href: "/offers" },
        { label: "Events", href: "/provider/events" },
        { label: "Groups", href: "/offers/groups" },
      ],
    },
  ],
  CLIENT: [
    { section: "General", items: [{ label: "Dashboard", href: "/dashboard" }] },
    {
      section: "Evenimente",
      items: [{ label: "Evenimente", href: "/events" }],
    },
    {
      section: "Devino furnizor",
      items: [{ label: "Aplică", href: "/profile/provider/apply" }],
    },
  ],
};

function mergeSections(roles) {
  const hasProvider = Array.isArray(roles) && roles.includes('PROVIDER');
  const sectionMap = new Map();

  (roles || []).forEach((r) => {
    (NAV_BY_ROLE[r] || []).forEach((sec) => {
      if (!sectionMap.has(sec.section)) sectionMap.set(sec.section, new Map());
      const group = sectionMap.get(sec.section);

      sec.items.forEach((i) => {
        // dacă userul ESTE deja PROVIDER, nu mai arătăm linkul "Aplică"
        if (hasProvider && i.href === '/profile/provider/apply') {
          return;
        }
        group.set(i.href, i);
      });
    });
  });

  const result = [];

  for (const [section, group] of sectionMap.entries()) {
    const items = Array.from(group.values());
    // 🔴 nu păstrăm secțiuni fără items (ex: "Devino furnizor" când ai și rol PROVIDER)
    if (items.length === 0) continue;
    result.push({ section, items });
  }

  if (result.length === 0) {
    result.push({
      section: 'General',
      items: [{ label: 'Dashboard', href: '/dashboard' }]
    });
  }

  return result;
}


export default function Sidebar({ locale = "ro", onNavigate }) {
  const pathname = usePathname();

  // Rolurile vin din window.__evt_roles (așa cum aveai)
  const [roles, setRoles] = useState(
    typeof window !== "undefined" && Array.isArray(window.__evt_roles)
      ? window.__evt_roles
      : []
  );

  useEffect(() => {
    const onEvt = () => {
      const r = Array.isArray(window.__evt_roles) ? window.__evt_roles : [];
      setRoles(r);
    };
    window.addEventListener("evt:roles-set", onEvt);
    return () => window.removeEventListener("evt:roles-set", onEvt);
  }, []);

  // Module din registry (enabled)
  const [clientMods, setClientMods] = useState([]); // [{label, href}]
  const [adminMods, setAdminMods] = useState([]); // [{label, href}]

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/modules", { cache: "no-store" });
        const data = await res.json();
        const enabled = (data.modules || []).filter((m) => m.enabled);

        const cm = enabled
          .map((m) => {
            const route = m.manifest?.ui?.clientSidebarRoute;
            if (!route?.label || !route?.href) return null;
            const href = route.href.startsWith("/")
              ? `/${locale}${route.href}`
              : `/${locale}/${route.href}`;
            return { label: route.label, href };
          })
          .filter(Boolean);

        const am = enabled
          .map((m) => {
            const route = m.manifest?.ui?.adminSidebarRoute;
            if (!route?.label || !route?.href) return null;
            const href = route.href.startsWith("/")
              ? `/${locale}${route.href}`
              : `/${locale}/${route.href}`;
            return { label: route.label, href };
          })
          .filter(Boolean);

        if (alive) {
          setClientMods(cm);
          setAdminMods(am);
        }
      } catch {
        if (alive) {
          setClientMods([]);
          setAdminMods([]);
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, [locale]);

  // Secțiunile de bază (din roluri) + cele dinamice din module
  const sections = useMemo(() => {
    const base = mergeSections(roles);

    // Dacă userul are rol CLIENT și există rute de modul client, adăugăm secțiunea "Client Modules"
    if (roles.includes("CLIENT") && clientMods.length > 0) {
      base.push({ section: "Client Modules", items: clientMods });
    }

    // Dacă userul are rol ADMIN și există rute de modul admin, adăugăm secțiunea "Admin Modules"
    if (roles.includes("ADMIN") && adminMods.length > 0) {
      base.push({ section: "Admin Modules", items: adminMods });
    }

    return base;
  }, [roles, clientMods, adminMods]);

    const activeHrefAbs = useMemo(() => {
    if (!pathname) return null;
    let bestHref = null;
    let bestLen = 0;

    sections.forEach((sec) => {
      (sec.items || []).forEach((item) => {
        const hrefAbs = item.href.startsWith(`/${locale}`)
          ? item.href
          : `/${locale}${item.href}`;

        if (
          pathname === hrefAbs ||
          pathname.startsWith(hrefAbs + '/') ||
          pathname.startsWith(hrefAbs)
        ) {
          if (hrefAbs.length > bestLen) {
            bestLen = hrefAbs.length;
            bestHref = hrefAbs;
          }
        }
      });
    });

    return bestHref;
  }, [sections, pathname, locale]);

  return (
    <Box
      component="nav"
      sx={{
        width: 240,
        flex: "0 0 240px",
        borderRight: "1px solid rgba(0,0,0,.08)",
        position: { xs: "relative", md: "sticky" },
        top: { md: 64 },
        height: { md: "calc(100vh - 64px)" },
        overflowY: { md: "auto" },
        px: 2,
        py: 2,
        bgcolor: "background.paper",
      }}
      role="navigation"
    >
      {sections.map((sec, idx) => (
        <Box key={sec.section}>
          <Typography
            variant="subtitle2"
            sx={{ mb: 1, mt: idx ? 2 : 0, opacity: 0.6, fontWeight: 600 }}
          >
            {sec.section}
          </Typography>

          <Stack spacing={0.5}>
                        {sec.items.map((item) => {
              const hrefAbs = item.href.startsWith(`/${locale}`)
                ? item.href
                : `/${locale}${item.href}`;
              const active = hrefAbs === activeHrefAbs; // 🔁 aici schimbăm

              return (
                <Button
                  key={item.href}
                  component={Link}
                  href={hrefAbs}
                  onClick={onNavigate}
                  startIcon={
                    <ListItemIcon sx={{ minWidth: 28 }}>
                      {ICONS[item.label] || (
                        <HelpOutlineIcon fontSize="small" />
                      )}
                    </ListItemIcon>
                  }
                  fullWidth
                  size="small"
                  variant="text"
                  color="inherit"
                  sx={{
                    justifyContent: "flex-start",
                    textTransform: "none",
                    borderRadius: 2,
                    pl: 1,
                    color: active ? "primary.main" : "text.primary",
                    backgroundColor: active ? "action.selected" : "transparent",
                    borderLeft: active ? "3px solid" : "3px solid transparent",
                    borderLeftColor: active ? "primary.main" : "transparent",
                    "&:hover": {
                      backgroundColor: active
                        ? "action.selected"
                        : "action.hover",
                    },
                  }}
                >
                  <ListItemText primary={item.label} />
                </Button>
              );
            })}

          </Stack>

          {idx < sections.length - 1 && <Divider sx={{ my: 2 }} />}
        </Box>
      ))}
    </Box>
  );
}
