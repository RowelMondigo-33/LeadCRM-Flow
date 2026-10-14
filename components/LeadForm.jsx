import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function LeadForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    service: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const { error } = await supabase
      .from('leads')
      .insert([
        {
          full_name: formData.name,
          email: formData.email,
          phone: formData.phone,
          service_requested: formData.service,
          notes: formData.notes,
          status: 'New',
        },
      ]);

    setLoading(false);

    if (error) {
      setMessage('Failed to submit inquiry. Please try again.');
      console.error(error);
    } else {
      setMessage('Thank you! Your inquiry has been sent successfully.');
      setFormData({ name: '', email: '', phone: '', service: '', notes: '' });
    }
  };

  return (
    <div className="bg-white shadow-xl rounded-2xl p-8 border border-gray-100 max-w-lg w-full">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-extrabold text-gray-900">Request a Free Quote</h2>
        <p className="text-sm text-gray-500 mt-1">Fill out the form below and we will get back to you shortly.</p>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-xl text-sm font-medium text-center ${
          message.includes('Thank') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
        }`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Full Name</label>
          <input
            type="text"
            name="name"
            required
            placeholder="John Doe"
            value={formData.name}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Email Address</label>
          <input
            type="email"
            name="email"
            required
            placeholder="john@example.com"
            value={formData.email}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Phone Number</label>
          <input
            type="tel"
            name="phone"
            required
            placeholder="+63 912 345 6789"
            value={formData.phone}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Service Required</label>
          <input
            type="text"
            name="service"
            required
            placeholder="e.g. Web Development, CRM Setup"
            value={formData.service}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Additional Notes</label>
          <textarea
            name="notes"
            rows="3"
            placeholder="Tell us more about your project requirements..."
            value={formData.notes}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition resize-none"
          ></textarea>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-indigo-200 transition duration-200 disabled:opacity-50"
        >
          {loading ? 'Submitting...' : 'Submit Inquiry'}
        </button>
      </form>
    </div>
  );
}