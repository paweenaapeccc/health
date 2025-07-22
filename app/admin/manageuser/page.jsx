'use client';

import { useEffect, useState } from 'react';

export default function ManageUserPage() {
  const [users, setUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      const res = await fetch('/api/manageuser');
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      // console.log('Users:', data)
      setUsers(data || []);
    } catch (error) {
      console.error('Failed to load users:', error);
      setUsers([]);
    }
  }

  async function deleteUser(userId) {
    if (!confirm('ยืนยันการลบผู้ใช้นี้?')) return;
    try {
      const res = await fetch(`/api/manageuser/${userId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete user');
      await loadUsers();
    } catch (error) {
      console.error(error);
      alert('ลบผู้ใช้ไม่สำเร็จ');
    }
  }

  async function saveEdit() {
    if (!editingUser?.username || !editingUser?.role || !editingUser?.id) {
      alert('กรุณากรอกข้อมูลให้ครบและมี ID');
      return;
    }

    try {
      const res = await fetch(`/api/manageuser/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: editingUser.username,
          role: editingUser.role,
        }),
      });
      if (!res.ok) throw new Error('Failed to update user');
      setEditingUser(null);
      await loadUsers();
    } catch (error) {
      console.error(error);
      alert('แก้ไขผู้ใช้ไม่สำเร็จ');
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Manage Users</h1>

      {/* Table */}
      <table className="table-auto border-collapse border border-gray-400 w-full mb-6">
        <thead className="bg-gray-200">
          <tr>
            <th className="border p-2">ID</th>
            <th className="border p-2">Username</th>
            <th className="border p-2">Role</th>
            <th className="border p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.length === 0 ? (
            <tr>
              <td colSpan={4} className="border p-2 text-center">ไม่มีข้อมูลผู้ใช้</td>
            </tr>
          ) : (
            users.map((user, index) => (
              <tr key={user.id ?? index}>
                <td className="text-center border p-2">{user.userID}</td>
                <td className="border p-2">{user.username}</td>
                <td className="border p-2">{user.role}</td>
                <td className="border p-2">
                  <button
                    onClick={() => setEditingUser({ ...user })}
                    className="text-blue-600 mr-2 hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteUser(user.id)}
                    className="text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Edit Form */}
      {editingUser && (
        <div className="bg-white p-4 rounded shadow-md border max-w-md">
          <h2 className="text-lg font-semibold mb-2">Edit User</h2>
          <div className="mb-3">
            <label className="block mb-1 font-medium">Username</label>
            <input
              type="text"
              value={editingUser.username}
              onChange={(e) =>
                setEditingUser({ ...editingUser, username: e.target.value })
              }
              className="border px-2 py-1 w-full"
            />
          </div>
          <div className="mb-3">
            <label className="block mb-1 font-medium">Role</label>
            <input
              type="text"
              value={editingUser.role}
              onChange={(e) =>
                setEditingUser({ ...editingUser, role: e.target.value })
              }
              className="border px-2 py-1 w-full"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={saveEdit}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              Save
            </button>
            <button
              onClick={() => setEditingUser(null)}
              className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
