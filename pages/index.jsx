import LeadForm from '../components/LeadForm';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 py-12 px-4 flex flex-col justify-center items-center">
      <div className="text-center mb-8 max-w-xl">
        <span className="px-3 py-1 text-xs font-semibold uppercase tracking-widest bg-indigo-500/10 text-indigo-400 rounded-full border border-indigo-500/20">LeadCRM Flow</span>
        <h1 className="text-4xl font-extrabold text-white mt-3">Transform Your Client Inquiries</h1>
        <p className="text-slate-400 mt-2 text-sm">Professional lead capture system designed to boost your conversion rates.</p>
      </div>
      <LeadForm />
    </div>
  );
}