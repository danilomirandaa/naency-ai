export default function OverviewPage() {
  return (
    <>
      <div className="grid auto-rows-min gap-4 md:grid-cols-3">
        <div className="aspect-video rounded-2xl bg-background-neutral-100" />
        <div className="aspect-video rounded-2xl bg-background-neutral-100" />
        <div className="aspect-video rounded-2xl bg-background-neutral-100" />
      </div>
      <div className="min-h-[60vh] flex-1 rounded-2xl bg-background-neutral-100 md:min-h-min" />
    </>
  );
}
