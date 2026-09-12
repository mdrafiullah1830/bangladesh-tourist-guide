import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function SafetyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900">Safety Tips</h1>
      <div className="mt-6 grid gap-4">
        <Card><h2 className="font-semibold">Before travelling</h2><p className="mt-2 text-sm text-gray-600">Share your itinerary, keep identity documents backed up, and confirm transport and accommodation directly.</p></Card>
        <Card><h2 className="font-semibold">While travelling</h2><p className="mt-2 text-sm text-gray-600">Keep valuables secure, use trusted transport, monitor local weather, and avoid isolated areas after dark.</p></Card>
        <Card><h2 className="font-semibold">Emergency</h2><p className="mt-2 text-sm text-gray-600">For an immediate emergency in Bangladesh, call 999.</p><Link href="/emergency"><Button className="mt-4">Open Emergency Center</Button></Link></Card>
      </div>
    </div>
  );
}
