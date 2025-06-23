import { Navbar } from "@/components/common/Navbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col  bg-slate-900 text-black font-mono">
      <Navbar />
      <main className="flex-grow border-t-2 border-slate-600">
        <div className="max-w-7xl mx-auto p-6 bg-slate-900">
          <div className="border-2 border-slate-700 bg-slate-800 p-6">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}