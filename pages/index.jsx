import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Home() {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    service: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSubmitted(false);
    setErrorMsg('');

    // Insert lead into Supabase
    const { data, error } = await supabase.from('leads').insert([
      {
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone,
        service: formData.service,
        notes: formData.notes,
        status: 'New',
      },
    ]);

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
    } else {
      setSubmitted(true);
      setLoading(false);
      // Auto-reset form fields
      setFormData({
        full_name: '',
        email: '',
        phone: '',
        service: '',
        notes: '',
      });

      // Send automated email notification via Next.js API route
      try {
        await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
      } catch (err) {
        console.error('Email trigger error:', err);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white/10 backdrop-blur-md p-8 rounded-2xl border border-white/20 shadow-2xl text-white">
        <div className="text-center mb-8">
          <span className="text-xs uppercase tracking-widest bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full border border-indigo-500/30 font-semibold">
            LeadCRM Flow
          </span>
          <h1 className="text-3xl font-extrabold mt-3">Transform Your Client Inquiries</h1>
          <p className="text-slate-300 text-sm mt-1">Professional lead capture system designed to boost your conversion rates.</p>
        </div>

        {submitted && (
          <div className="bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 p-4 rounded-xl mb-6 text-center text-sm font-medium animate-fade-in">
            ✓ Thank you! Your inquiry has been sent successfully. We will get back to you shortly.
          </div>
        )}

        {errorMsg && (
          <div className="bg-rose-500/20 border border-rose-500/50 text-rose-300 p-4 rounded-xl mb-6 text-center text-sm font-medium">
            ⚠️ {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Full Name</label>
            <input
              type="text"
              name="full_name"
              required
              value={formData.full_name}
              onChange={handleChange}
              placeholder="John Doe"
              className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Email Address</label>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="john@example.com"
              className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Phone Number</label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+63 912 345 6789"
              className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Service Required</label>
            <input
              type="text"
              name="service"
              value={formData.service}
              onChange={handleChange}
              placeholder="e.g. Web Development, CRM Setup"
              className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Additional Notes</label>
            <textarea
              name="notes"
              rows="3"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Tell us more about your project requirements..."
              className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition resize-none"
            ></textarea>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition duration-200 disabled:opacity-50"
          >
            {loading ? 'Submitting Inquiry...' : 'Submit Inquiry'}
          </button>
        </form>
      </div>
    </div>
  );
}