import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabaseClient';

export default function AdminDashboard() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/admin/login');
      } else {
        fetchLeads();
      }
    };

    checkUser();

    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'leads' },
        () => fetchLeads()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchLeads = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error) setLeads(data || []);
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/admin/login');
  };

  const handleStatusChange = async (id, newStatus) => {
    await supabase.from('leads').update({ status: newStatus }).eq('id', id);
    fetchLeads();
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this lead?')) {
      await supabase.from('leads').delete().eq('id', id);
      fetchLeads();
    }
  };

  // CSV Export Functionality
  const exportToCSV = () => {
    if (filteredLeads.length === 0) {
      alert('No leads available to export.');
      return;
    }

    const headers = ['Full Name,Email,Phone,Service,Notes,Status,Created At\n'];
    const rows = filteredLeads.map((lead) =>
      [
        `"${lead.full_name || ''}"`,
        `"${lead.email || ''}"`,
        `"${lead.phone || ''}"`,
        `"${lead.service || ''}"`,
        `"${(lead.notes || '').replace(/"/g, '""')}"`,
        `"${lead.status || 'New'}"`,
        `"${lead.created_at || ''}"`,
      ].join(',')
    );

    const csvContent = 'data:text/csv;charset=utf-8,' + headers.concat(rows).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `leads_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      lead.email?.toLowerCase().includes(search.toLowerCase()) ||
      lead.service?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === 'All' || lead.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return <div className="p-8 text-center text-gray-600 font-medium">Loading Dashboard...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-800">Lead Management Dashboard</h1>
            <p className="text-slate-500 text-sm">Monitor incoming business inquiries and track status in real-time.</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={exportToCSV}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg shadow transition text-sm flex items-center gap-1.5"
            >
              📊 Export CSV
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-lg shadow transition text-sm"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <input
            type="text"
            placeholder="Search by name, email, or service..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 p-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="p-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          >
            <option value="All">All Statuses</option>
            <option value="New">New</option>
            <option value="In Progress">In Progress</option>
            <option value="Closed">Closed</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                <th className="p-4">Customer</th>
                <th className="p-4">Contact Info</th>
                <th className="p-4">Service</th>
                <th className="p-4">Notes</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-400">
                    No matching leads found.
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-4 font-bold text-slate-800">{lead.full_name}</td>
                    <td className="p-4">
                      <div className="font-medium text-slate-700">{lead.email}</div>
                      <div className="text-slate-400 text-xs">{lead.phone}</div>
                    </td>
                    <td className="p-4 text-slate-600">{lead.service}</td>
                    <td className="p-4 text-slate-500 max-w-xs truncate">{lead.notes}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                        lead.status === 'Closed' ? 'bg-slate-200 text-slate-700' :
                        lead.status === 'In Progress' ? 'bg-amber-100 text-amber-800' :
                        'bg-emerald-100 text-emerald-800'
                      }`}>
                        {lead.status || 'New'}
                      </span>
                    </td>
                    <td className="p-4 flex gap-2 justify-center items-center">
                      <select
                        value={lead.status || 'New'}
                        onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                        className="p-1.5 text-xs border border-slate-300 rounded bg-white font-medium"
                      >
                        <option value="New">New</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Closed">Closed</option>
                      </select>
                      <button
                        onClick={() => handleDelete(lead.id)}
                        className="p-1.5 text-xs bg-rose-100 text-rose-700 hover:bg-rose-200 rounded font-semibold transition"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}