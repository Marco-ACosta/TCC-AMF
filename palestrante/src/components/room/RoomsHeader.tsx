"use client";

export default function RoomsHeader({ count }: { count: number }) {
  return (
    <div style={{ textAlign: "center" }}>
      <h1 style={{ margin: 0 }}>Salas</h1>
      <div style={{ opacity: 0.75, fontSize: 12, marginTop: 4 }}>
        {count > 0 ? `${count} sala(s) encontradas` : "—"}
      </div>
    </div>
  );
}
