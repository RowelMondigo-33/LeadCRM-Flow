import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabaseClient';
import { useTheme } from '../../context/ThemeContext';

export default function AdminDashboard() {
  const { theme, toggleTheme } = useTheme();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedLeadNotes, setSelectedLeadNotes] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [activityLogs, setActivityLogs] = useState({});
  const [userEmail, setUserEmail] = useState('');
  const router = useRouter();

  // Dynamic Greeting Logic (Sun vs Moon)
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) {
      return { text: "Good Morning, Welcome Back!", icon: "☀️", color: "text-amber-400" };
    } else if (hour < 18) {
      return { text: "Good Afternoon, Welcome Back!", icon: "🌤️", color: "text-amber-500" };
    } else {
      return { text: "Good Evening, Welcome Back!", icon: "🌙", color: "text-indigo-400" };
    }
  };

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/admin/login');
      } else {
        setUserEmail(session.user.email);
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

  const exportToCSV = () => {
    if (filteredLeads.length === 0) return alert('No leads to export.');
    const headers = ['Full Name,Email,Phone,Service,Notes,Status,Created At\n'];
    const rows = filteredLeads.map((l) =>
      [`"${l.full_name || ''}"`, `"${l.email || ''}"`, `"${l.phone || ''}"`, `"${l.service || ''}"`, `"${(l.notes || '').replace(/"/g, '""')}"`, `"${l.status || 'New'}"`, `"${l.created_at || ''}"`].join(',')
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

  const handleAddNote = (e) => {
    e.preventDefault();
    if (!noteText.trim() || !selectedLeadNotes) return;

    const leadId = selectedLeadNotes.id;
    const newEntry = {
      text: noteText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setActivityLogs((prev) => ({
      ...prev,
      [leadId]: [...(prev[leadId] || []), newEntry],
    }));
    setNoteText('');
  };

  const greeting = getGreeting();

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      lead.email?.toLowerCase().includes(search.toLowerCase()) ||
      lead.service?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Analytics Metrics
  const totalLeads = leads.length;
  const newLeads = leads.filter((l) => !l.status || l.status === 'New').length;
  const inProgressLeads = leads.filter((l) => l.status === 'In Progress').length;
  const closedLeads = leads.filter((l) => l.status === 'Closed').length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white font-sans">
        <div className="animate-pulse flex items-center gap-3">
          <div className="w-4 h-4 bg-indigo-500 rounded-full animate-bounce"></div>
          <span className="text-lg font-semibold tracking-wide">Loading LeadCRM Flow...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 font-sans ${theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* Top Navigation */}
      <nav className={`border-b px-6 py-4 transition-colors ${theme === 'dark' ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'} shadow-sm backdrop-blur-md sticky top-0 z-30`}>
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-indigo-600 to-indigo-400 text-white w-10 h-10 rounded-xl flex items-center justify-center font-extrabold shadow-lg shadow-indigo-500/20">
              LC
            </div>
            <div>
              <span className="text-lg font-black tracking-tight">LeadCRM <span className="text-indigo-500">Flow</span></span>
              <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full">Global Edition</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className={`p-2.5 rounded-xl border transition flex items-center gap-2 text-sm font-semibold ${
                theme === 'dark'
                  ? 'bg-slate-800 border-slate-700 text-amber-300 hover:bg-slate-700'
                  : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
              }`}
              title="Toggle Light/Dark Theme"
            >
              {theme === 'dark' ? '☀️ Day Mode' : '🌙 Night Mode'}
            </button>

            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-xl text-sm transition shadow-lg shadow-rose-600/20"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto p-6 space-y-8">

        {/* Dynamic Day/Night Welcome Greeting */}
        <div className={`p-6 rounded-2xl border shadow-xl transition-all ${
          theme === 'dark'
            ? 'bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-indigo-500/20'
            : 'bg-gradient-to-r from-white via-indigo-50/50 to-white border-indigo-100'
        }`}>
          <div className="flex items-center gap-4">
            <span className={`text-4xl ${greeting.color} animate-pulse`}>{greeting.icon}</span>
            <div>
              <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
                {greeting.text}😊
              </h2>
              <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                Logged in as <span className="font-semibold text-indigo-400">{userEmail}</span>. All operational systems are live and syncing in real-time.
              </p>
            </div>
          </div>
        </div>

        {/* Analytics Insights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className={`p-5 rounded-2xl border ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} shadow-sm`}>
            <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Leads</div>
            <div className="text-3xl font-black mt-2 text-indigo-500">{totalLeads}</div>
            <div className="text-xs text-slate-500 mt-1">All time client entries</div>
          </div>

          <div className={`p-5 rounded-2xl border ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} shadow-sm`}>
            <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">New Inquiries</div>
            <div className="text-3xl font-black mt-2 text-emerald-500">{newLeads}</div>
            <div className="text-xs text-slate-500 mt-1">Awaiting client response</div>
          </div>

          <div className={`p-5 rounded-2xl border ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} shadow-sm`}>
            <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">In Progress</div>
            <div className="text-3xl font-black mt-2 text-amber-500">{inProgressLeads}</div>
            <div className="text-xs text-slate-500 mt-1">Currently engaging</div>
          </div>

          <div className={`p-5 rounded-2xl border ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} shadow-sm`}>
            <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">Closed Deals</div>
            <div className="text-3xl font-black mt-2 text-indigo-400">{closedLeads}</div>
            <div className="text-xs text-slate-500 mt-1">Successfully converted</div>
          </div>
        </div>

        {/* Search, Filter & Export Controls */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-1 gap-3 w-full">
            <input
              type="text"
              placeholder="Search leads by name, email, or service..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`flex-1 p-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition ${
                theme === 'dark' ? 'bg-slate-900 border-slate-800 text-white placeholder-slate-500' : 'bg-white border-slate-300 text-slate-900'
              }`}
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`p-3 rounded-xl border text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 transition ${
                theme === 'dark' ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-300 text-slate-900'
              }`}
            >
              <option value="All">All Statuses</option>
              <option value="New">New</option>
              <option value="In Progress">In Progress</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          <button
            onClick={exportToCSV}
            className="w-full md:w-auto px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-sm transition shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
          >
            📊 Export CSV Report
          </button>
        </div>

        {/* Leads Table */}
        <div className={`rounded-2xl border overflow-hidden shadow-sm transition-colors ${
          theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`border-b text-xs font-extrabold uppercase tracking-wider ${
                theme === 'dark' ? 'bg-slate-900/50 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'
              }`}>
                <th className="p-4">Customer</th>
                <th className="p-4">Contact Info</th>
                <th className="p-4">Requested Service</th>
                <th className="p-4">Inquiry Notes</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40 text-sm">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-10 text-center text-slate-500">
                    No matching client records found.
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => (
                  <tr key={lead.id} className={`transition ${theme === 'dark' ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'}`}>
                    <td className="p-4 font-bold">{lead.full_name}</td>
                    <td className="p-4">
                      <div className="font-medium text-indigo-400">{lead.email}</div>
                      <div className="text-slate-400 text-xs mt-0.5">{lead.phone || 'N/A'}</div>
                    </td>
                    <td className="p-4 font-semibold text-slate-300">{lead.service || 'General Inquiry'}</td>
                    <td className="p-4 max-w-xs truncate text-slate-400">{lead.notes || '—'}</td>
                    <td className="p-4">
                      <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                        lead.status === 'Closed' ? 'bg-slate-800 text-slate-300 border border-slate-700' :
                        lead.status === 'In Progress' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {lead.status || 'New'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2 justify-center items-center">
                        <select
                          value={lead.status || 'New'}
                          onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                          className={`p-1.5 text-xs rounded-lg border font-semibold ${
                            theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                          }`}
                        >
                          <option value="New">New</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Closed">Closed</option>
                        </select>

                        <button
                          onClick={() => setSelectedLeadNotes(lead)}
                          className="px-2.5 py-1.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-lg text-xs font-semibold hover:bg-indigo-500/20 transition"
                        >
                          💬 Notes
                        </button>

                        <button
                          onClick={() => handleDelete(lead.id)}
                          className="px-2.5 py-1.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-lg text-xs font-semibold hover:bg-rose-500/20 transition"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Activity Notes Modal */}
      {selectedLeadNotes && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`max-w-lg w-full p-6 rounded-2xl border shadow-2xl ${
            theme === 'dark' ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-xl font-extrabold">{selectedLeadNotes.full_name}</h3>
                <p className="text-xs text-slate-400">Activity Log & Internal Communication</p>
              </div>
              <button
                onClick={() => setSelectedLeadNotes(null)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="max-h-48 overflow-y-auto space-y-2 mb-4 p-3 bg-slate-950/40 rounded-xl border border-slate-800/60">
              {(activityLogs[selectedLeadNotes.id] || []).length === 0 ? (
                <div className="text-xs text-slate-500 text-center py-4">No internal activity notes recorded yet.</div>
              ) : (
                activityLogs[selectedLeadNotes.id].map((log, idx) => (
                  <div key={idx} className="p-2 bg-slate-800/50 rounded border border-slate-700/50 text-xs">
                    <span className="text-indigo-400 font-bold">[{log.timestamp}]</span> {log.text}
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleAddNote} className="space-y-3">
              <input
                type="text"
                placeholder="Type internal note (e.g. Called client, requested quote proposal)..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedLeadNotes(null)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-700 text-slate-400 hover:bg-slate-800"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white"
                >
                  Add Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}