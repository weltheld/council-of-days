import { DayDetailPanel } from "@/components/council/DayDetailPanel";

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string; date: string }>;
}) {
  const { slug, date } = await params;
  return <DayDetailPanel slug={slug} date={date} />;
}
