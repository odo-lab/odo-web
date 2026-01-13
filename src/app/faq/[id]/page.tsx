import { FAQS } from "@/lib/faqs";

export default function Page({ params }: { params: { id: string } }) {
  const raw = decodeURIComponent(String(params?.id ?? "")).trim();
  const no = Number(raw);

  const byNo = Number.isFinite(no) ? FAQS.find((f) => f.no === no) : undefined;
  const byId = FAQS.find((f) => f.id === raw);

  return (
    <div style={{ color: "white", padding: 40 }}>
      <div>raw: {JSON.stringify(raw)}</div>
      <div>no: {JSON.stringify(no)}</div>
      <div style={{ marginTop: 12 }}>FAQS:</div>
      <pre>{JSON.stringify(FAQS, null, 2)}</pre>
      <div style={{ marginTop: 12 }}>byNo: {JSON.stringify(byNo, null, 2)}</div>
      <div>byId: {JSON.stringify(byId, null, 2)}</div>
    </div>
  );
}
