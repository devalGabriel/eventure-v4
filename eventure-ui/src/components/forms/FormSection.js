'use client';
export default function FormSection({ title, description, children, actions }) {
  return (
    <section className="form-section">
      {title && <h3 style={{marginTop:0}}>{title}</h3>}
      {description && <p style={{color:'#64748b'}}>{description}</p>}
      <div>{children}</div>
      {actions && <div style={{marginTop:16}}>{actions}</div>}
    </section>
  );
}
