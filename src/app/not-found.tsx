import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center space-y-4 max-w-md">
        <div className="text-5xl">🧭</div>
        <h1 className="text-2xl font-bold text-gray-900">Page not found</h1>
        <p className="text-gray-600 text-sm">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link href="/">
          <Button>← Back to Home</Button>
        </Link>
      </div>
    </div>
  );
}