import { Card } from '@/components/ui/Card';

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900">About Bangladesh Guide</h1>
      <p className="mt-3 text-gray-600">A travel-planning prototype combining curated guidance, public place data, budgeting, and safety tools for travel in Bangladesh.</p>
      <Card className="mt-6">
        <h2 className="font-semibold text-lg">Data transparency</h2>
        <p className="mt-2 text-sm text-gray-600">Source and freshness badges distinguish public data from estimates and synthetic model outputs. Always verify prices, schedules, and safety information locally.</p>
      </Card>
    </div>
  );
}
