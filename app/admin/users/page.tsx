import { getAuthToken, verifyToken } from '@/lib/auth';
import { sql } from '@/lib/db';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function AdminUsers() {
  const token = getAuthToken();
  if (!token) redirect('/login');
  const payload = verifyToken(token);
  if (!payload || !payload.is_admin) redirect('/home');

  const users = await sql`SELECT * FROM users ORDER BY created_at DESC`;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">User Management</h1>

      <div className="bg-xm-card rounded-xl border border-gray-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-left">
              <th className="p-3 text-xs text-gray-500">Collector #</th>
              <th className="p-3 text-xs text-gray-500">Name</th>
              <th className="p-3 text-xs text-gray-500">Email</th>
              <th className="p-3 text-xs text-gray-500">Rank</th>
              <th className="p-3 text-xs text-gray-500">Points</th>
              <th className="p-3 text-xs text-gray-500">Cards</th>
              <th className="p-3 text-xs text-gray-500">Admin</th>
              <th className="p-3 text-xs text-gray-500">Joined</th>
            </tr>
          </thead>
          <tbody>
            {(users as any[]).map((user) => (
              <tr key={user.id} className="border-b border-gray-800/50 hover:bg-xm-dark/50">
                <td className="p-3 text-xs text-xm-gold font-mono">{user.collector_number}</td>
                <td className="p-3 text-xs">{user.display_name}</td>
                <td className="p-3 text-xs text-gray-400">{user.email}</td>
                <td className="p-3">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-xm-gold/20 text-xm-gold">{user.rank}</span>
                </td>
                <td className="p-3 text-xs">{user.total_points?.toLocaleString()}</td>
                <td className="p-3 text-xs">{user.collection_count || 0}</td>
                <td className="p-3 text-xs">{user.is_admin ? '✓' : '—'}</td>
                <td className="p-3 text-xs text-gray-500">{new Date(user.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
