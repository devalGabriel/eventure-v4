// RSC: inserează <script> cu rolurile în window.__evt_roles
export default function RolesScript({ roles=[] }) {
  const json = JSON.stringify(roles);
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `window.__evt_roles = ${json};`
      }}
    />
  );
}
