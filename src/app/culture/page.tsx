import { Card } from '@/components/ui/Card';

export default function CulturePage() {
  const guidance = [
    ['Greetings', 'A polite greeting and respectful tone are appreciated; use the right hand when giving or receiving something.'],
    ['Dress', 'Choose modest clothing, especially at religious sites and in rural communities.'],
    ['Hospitality', 'Guests are often offered food or tea. Ask before photographing people or private events.'],
    ['Religious sites', 'Remove shoes where requested, keep voices low, and follow local photography rules.'],
  ];
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900">Culture Guide</h1>
      <p className="mt-3 text-gray-600">A few practical ways to travel respectfully in Bangladesh.</p>
      <div className="mt-6 grid sm:grid-cols-2 gap-4">{guidance.map(([title, text]) => <Card key={title}><h2 className="font-semibold">{title}</h2><p className="mt-2 text-sm text-gray-600">{text}</p></Card>)}</div>
    </div>
  );
}
