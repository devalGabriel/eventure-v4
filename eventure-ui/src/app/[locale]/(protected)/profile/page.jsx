// src/app/[locale]/(protected)/profile/page.jsx
import { requireUserRSC, getProfileRSC } from "@/lib/server-auth";
import { Typography, Paper } from "@mui/material";
import FormSection from "@/components/forms/FormSection";
import AvatarClient from "@/components/profile/AvatarClient";
import ProfileForm from "@/components/profile/ProfileForm";
import PasswordForm from "@/components/profile/PasswordForm";

export default async function ProfilePage({ params }) {
  const { locale } = await params; 
  await requireUserRSC(locale || "ro");
  const prof = await getProfileRSC();
  return (
    <div className="form-page">
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4">Profilul meu</Typography>
      </Paper>

      <div className="form-grid">
        <div className="col-12">
          <FormSection
            title="Avatar"
            description="Încarcă un avatar pentru profilul tău.">
            <AvatarClient initial={prof?.avatarUrl} name={prof?.name} />
          </FormSection>
        </div>

        <div className="col-12">
          <FormSection title="Date de profil">
            <ProfileForm userId={prof?.id} name={prof?.name} email={prof?.email} />
          </FormSection>
        </div>

        <div className="col-12">
          <FormSection
            title="Schimbare parolă"
            description="Introdu parola curentă și una nouă."
          >
            <PasswordForm />
          </FormSection>
        </div>
      </div>
    </div>
  );
}
