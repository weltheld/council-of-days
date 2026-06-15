export default function GroupLayout({
  children,
  panel,
}: {
  children: React.ReactNode;
  panel: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen bg-surface">
      {children}
      {panel}
    </div>
  );
}
