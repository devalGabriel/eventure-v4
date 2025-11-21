import Link from "next/link";

export default function SessionUpdated() {
  return (
    <div style={{padding:24}}>
      <h2>Access updated</h2>
      <p>Your permissions changed. Please sign in again.</p>
      <Link href="/login">Go to login</Link>
    </div>
  );
}
