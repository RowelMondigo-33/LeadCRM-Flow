import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function AdminDashboard() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching leads:', error);
    } else {
      setLeads(data || []);
    }
    setLoading(false);
  };

  const updateStatus = async (id, newStatus) => {
    const { error } = await supabase
      .from('leads')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) {
      console.error('Error updating status:', error);
    } else {
      setLeads(leads.map((lead) => (lead.id === id ? { ...lead, status: newStatus } : lead)));
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'New':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Contacted':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Scheduled':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Completed':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Lost':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Lead Management Dashboard</h1>
            <p className="text-sm text-slate-500 mt-1">Monitor incoming business inquiries and track client statuses in real-time.</p>
          </div>
          <button
            onClick={fetchLeads}
            className="inline-flex items-center justify-center px-4 py-2.5 bg-white border border-slate-200 rounded-xl shadow-sm text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            Refresh Leads
          </button>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm">
            <p className="text-slate-500 animate-pulse">Loading leads...</p>
          </div>
        ) : leads.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm">
            <p className="text-slate-500">No leads received yet.</p>
          </div>
        ) : (
          <div className="bg-white shadow-xl rounded-2xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Contact Info</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Service Requested</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Notes</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {leads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-slate-50/50 transition">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-900">{lead.full_name}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{new Date(lead.created_at).toLocaleDateString()}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        <div className="font-medium text-slate-900">{lead.email}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{lead.phone}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 font-medium">
                        {lead.service_requested}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500 max-w-xs truncate">
                        {lead.notes || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs font-semibold rounded-full border ${getStatusBadge(lead.status)}`}>
                          {lead.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <select
                          value={lead.status}
                          onChange={(e) => updateStatus(lead.id, e.target.value)}
                          className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                        >
                          <option value="New">New</option>
                          <option value="Contacted">Contacted</option>
                          <option value="Scheduled">Scheduled</option>
                          <option value="Completed">Completed</option>
                          <option value="Lost">Lost</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}