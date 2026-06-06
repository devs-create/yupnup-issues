import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0f1117] flex items-center justify-center">
      <div className="text-center">
        <p className="text-6xl font-black text-slate-700 mb-4">404</p>
        <h2 className="text-xl font-bold text-white mb-2">Page not found</h2>
        <p className="text-slate-400 mb-6">This page doesn't exist or you don't have access.</p>
        <Link href="/dashboard" className="btn-primary">Back to Dashboard</Link>
      </div>
    </div>
  );
}
