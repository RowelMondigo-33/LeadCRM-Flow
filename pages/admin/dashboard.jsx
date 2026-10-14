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
    // 1. Verify User Session
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/admin/login');
      } else {
        fetchLeads();
      }
    };

    checkUser();

    // 2. Set up Supabase Realtime Subscription
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
    if (confirm('Sigurado ka bang gusto mong burahin ang lead na ito?')) {
      await supabase.from('leads').delete().eq('id', id);
      fetchLeads();
    }
  };

  // Filter & Search Logic
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
    return <div className="p-8 text-center text-gray-600">Loading Dashboard...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Lead Management Dashboard</h1>
            <p className="text-gray-500">Monitor incoming business inquiries in real-time.</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            Logout
          </button>
        </div>

        {/* Controls: Search & Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <input
            type="text"
            placeholder="Search by name, email, or service..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="All">All Statuses</option>
            <option value="New">New</option>
            <option value="In Progress">In Progress</option>
            <option value="Closed">Closed</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase">
                <th className="p-4">Customer</th>
                <th className="p-4">Contact Info</th>
                <th className="p-4">Service</th>
                <th className="p-4">Notes</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-sm">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-4 text-center text-gray-500">
                    No leads found.
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50">
                    <td className="p-4 font-semibold text-gray-800">{lead.full_name}</td>
                    <td className="p-4">
                      <div>{lead.email}</div>
                      <div className="text-gray-400 text-xs">{lead.phone}</div>
                    </td>
                    <td className="p-4 text-gray-600">{lead.service}</td>
                    <td className="p-4 text-gray-500 max-w-xs truncate">{lead.notes}</td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                        {lead.status || 'New'}
                      </span>
                    </td>
                    <td className="p-4 flex gap-2 justify-center">
                      <select
                        value={lead.status || 'New'}
                        onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                        className="p-1 text-xs border rounded bg-white"
                      >
                        <option value="New">New</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Closed">Closed</option>
                      </select>
                      <button
                        onClick={() => handleDelete(lead.id)}
                        className="px-2 py-1 bg-red-100 text-red-600 rounded text-xs hover:bg-red-200"
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