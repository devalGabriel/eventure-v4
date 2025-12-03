// src/components/provider/invitations/ProviderInvitationDetailPage.jsx
"use client";

import { useEffect, useState, useMemo } from "react";
import { Box, LinearProgress, Typography } from "@mui/material";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { getProviderServices } from "@/lib/api/providersClient";
import ProviderInvitationHeader from "./ProviderInvitationHeader";
import ProviderOfferForm from "./ProviderOfferForm";
import OfferMessagesSection from "./OfferMessagesSection";

function emptyLine() {
  return {
    id: Math.random().toString(36).slice(2),
    label: "",
    qty: 1,
    amount: 0,
    packageId: null,
    baseAmount: null,
  };
}

export default function ProviderInvitationDetailPage() {
  const params = useParams();
  const search = useSearchParams();
  const router = useRouter();

  const locale = Array.isArray(params?.locale)
    ? params.locale[0]
    : params?.locale;
  const invitationId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [invitation, setInvitation] = useState(null);
  const [offer, setOffer] = useState(null);
  const [lines, setLines] = useState([emptyLine()]);
  const [terms, setTerms] = useState("");
  const [currency, setCurrency] = useState("RON");
  const [priceTotal, setPriceTotal] = useState("");

  const [servicePackages, setServicePackages] = useState([]);
  const [servicesError, setServicesError] = useState(null);

  // evenimentul asociat – folosit în mai multe locuri
  const ev = invitation?.event || {};
  const subtotal = useMemo(
    () =>
      lines.reduce(
        (sum, l) => sum + (Number(l.qty) || 0) * (Number(l.amount) || 0),
        0
      ),
    [lines]
  );

  // load invitation + ofertă (dacă există) + pachetele providerului
  useEffect(() => {
    let mounted = true;

    async function load() {
      if (!invitationId) return;
      setLoading(true);
      setError(null);
      setServicesError(null);
      try {
        const [ri, ro] = await Promise.all([
          fetch(`/api/invitations/${invitationId}`, { cache: "no-store" }),
          fetch(`/api/offers?invitationId=${invitationId}`, {
            cache: "no-store",
          }),
        ]);

        const [ti, to] = await Promise.all([ri.text(), ro.text()]);
        if (!ri.ok) throw new Error(ti || "Failed to load invitation");

        const inv = ti ? JSON.parse(ti) : null;
        let offList = [];
        if (ro.ok && to) {
          const jsonOff = JSON.parse(to);
          offList = Array.isArray(jsonOff) ? jsonOff : jsonOff.rows || [];
        }

        // pachetele providerului
        let services = [];
        try {
          const sp = await getProviderServices();
          services = Array.isArray(sp) ? sp : sp?.rows || [];
        } catch (e) {
          console.error("Failed to load provider services", e);
          services = [];
          if (mounted) {
            setServicesError(
              "Nu am putut încărca pachetele de servicii. Poți totuși completa oferta manual."
            );
          }
        }

        const mainOffer = offList[0] || null;

        if (mounted) {
          setInvitation(inv);
          setOffer(mainOffer);
          setServicePackages(services);

          const evCurrency = inv?.event?.currency || "RON";
          setCurrency(mainOffer?.currency || evCurrency);

          const rawDetails =
            typeof mainOffer?.detailsJson === "string"
              ? (() => {
                  try {
                    return JSON.parse(mainOffer.detailsJson);
                  } catch {
                    return null;
                  }
                })()
              : mainOffer?.detailsJson;

          if (
            rawDetails &&
            Array.isArray(rawDetails.lines) &&
            rawDetails.lines.length
          ) {
            setLines(
              rawDetails.lines.map((l) => ({
                id: Math.random().toString(36).slice(2),
                label: l.label || "",
                qty: l.qty ?? 1,
                amount: l.amount ?? 0,
                packageId: l.packageId || null,
                baseAmount:
                  typeof l.baseAmount === "number" || l.baseAmount === null
                    ? l.baseAmount
                    : l.baseAmount != null
                    ? Number(l.baseAmount)
                    : null,
              }))
            );
          } else {
            setLines([emptyLine()]);
          }

          setTerms(rawDetails?.terms || "");
          setPriceTotal(mainOffer?.priceTotal ?? mainOffer?.totalCost ?? "");
        }
      } catch (e) {
        console.error(e);
        if (mounted) setError(String(e?.message || e));
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [invitationId]);

  // dacă am venit cu ?accept=1 și invitația e PENDING, o acceptăm automat
  useEffect(() => {
    const auto = search?.get("accept");
    if (!auto || auto !== "1") return;
    if (!invitation || invitation.status !== "PENDING") return;

    (async () => {
      try {
        await fetch(`/api/invitations/${invitation.id}/decision`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ decision: "ACCEPTED" }),
        });
      } catch (e) {
        console.error(e);
      }
    })();
  }, [search, invitation]);

  // dacă nu avem total și userul lucrează pe linii, calculăm default
  useEffect(() => {
    if (!priceTotal && subtotal > 0) {
      setPriceTotal(subtotal.toFixed(2));
    }
  }, [subtotal, priceTotal]);

  const handleLineChange = (id, field, value) => {
    setLines((prev) =>
      prev.map((l) => (l.id === id ? { ...l, [field]: value } : l))
    );
  };

  const handleLinePackageChange = (id, packageId) => {
    setLines((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l;

        if (!packageId) {
          // revenim la linie personalizată
          return {
            ...l,
            packageId: null,
            baseAmount: null,
          };
        }

        const pkg = servicePackages.find((p) => p.id === packageId);
        if (!pkg) {
          return {
            ...l,
            packageId,
          };
        }

        const base =
          pkg.basePrice != null
            ? Number(pkg.basePrice)
            : pkg.base_price != null
            ? Number(pkg.base_price)
            : 0;

        return {
          ...l,
          packageId,
          label: l.label || pkg.name || "",
          amount: base,
          baseAmount: base,
        };
      })
    );
  };

  const addLine = () => setLines((prev) => [...prev, emptyLine()]);
  const removeLine = (id) =>
    setLines((prev) => prev.filter((l) => l.id !== id));

    async function saveOffer(status) {
    if (!invitation) return;
    setSaving(true);
    setError(null);

    try {
      // 1) Derivăm, din liniile ofertei, ce pachete sunt grupuri
      //    Presupunem că servicePackages conține info de tip:
      //    { id, name, basePrice, type, providerGroupId, ... }
      //    Dacă structura ta e puțin diferită, adaptăm doar maparea de mai jos.
      const enrichedLines = lines.map((l) => {
        const pkg = l.packageId
          ? servicePackages.find((p) => p.id === l.packageId)
          : null;

        const lineBase = {
          label: l.label,
          qty: Number(l.qty) || 0,
          needId: invitation.needId,
          amount: Number(l.amount) || 0,
          packageId: l.packageId || null,
          ...(l.baseAmount != null ? { baseAmount: Number(l.baseAmount) } : {}),
        };

        if (!pkg) return lineBase;

        return {
          ...lineBase,
          // meta suplimentară pentru trasabilitate în JSON
          packageMeta: {
            id: pkg.id,
            name: pkg.name || null,
            type: pkg.type || null, // ex: "SERVICE" / "GROUP"
            providerGroupId:
              pkg.providerGroupId ??
              pkg.groupId ??
              null, // depinde cum e în providers-service
          },
        };
      });

      // 2) Dacă există cel puțin un pachet legat de un grup, atașăm acel grup
      //    la nivel de EventOffer.providerGroupId (primul grup găsit)
      const firstGroupId =
        enrichedLines
          .map((l) => l.packageMeta?.providerGroupId || null)
          .find((gid) => gid) || null;

      const payload = {
        totalCost: priceTotal ? Number(priceTotal) : subtotal || 0,
        currency,
        status,
        providerGroupId: firstGroupId, // <-- important pentru EventOffer
        detailsJson: {
          lines: enrichedLines,
          terms,
        },
      };

      const url = offer
        ? `/api/offers/${offer.id}`
        : `/api/events/${ev.id}/invitations/${invitation.id}/offers`;

      const method = offer ? "PUT" : "POST";

      const r = await fetch(url, {
        method,
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      const txt = await r.text();
      if (!r.ok) throw new Error(txt || `Save failed with ${r.status}`);

      router.replace(
        `/${locale}/dashboard/provider/invitations/${invitation.id}`
      );
    } catch (e) {
      console.error(e);
      setError(String(e?.message || e));
    } finally {
      setSaving(false);
    }
  }


  if (loading && !invitation) {
    return (
      <Box sx={{ p: 2 }}>
        <LinearProgress />
      </Box>
    );
  }

  if (error && !invitation) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  if (!invitation) {
    return <Box sx={{ p: 2 }}>Invitație inexistentă.</Box>;
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Invitație & ofertă – {ev.name || "Eveniment"}
      </Typography>

      <ProviderInvitationHeader invitation={invitation} event={ev} />

      <ProviderOfferForm
        servicesError={servicesError}
        servicePackages={servicePackages}
        lines={lines}
        currency={currency}
        priceTotal={priceTotal}
        terms={terms}
        saving={saving}
        onLineChange={handleLineChange}
        onLinePackageChange={handleLinePackageChange}
        onAddLine={addLine}
        onRemoveLine={removeLine}
        onChangeCurrency={setCurrency}
        onChangePriceTotal={setPriceTotal}
        onChangeTerms={setTerms}
        onSaveDraft={() => saveOffer("DRAFT")}
        onSaveFinal={() => saveOffer(offer ? "REVISED" : "SENT")}
      />

      {error && (
        <Typography color="error" sx={{ mt: 1 }}>
          {error}
        </Typography>
      )}

      {/* Mesaje pe ofertă – opțional, doar dacă există ofertă */}
      {offer && <OfferMessagesSection offerId={offer.id} />}
    </Box>
  );
}
