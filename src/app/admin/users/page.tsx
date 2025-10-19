'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  fetchAllUsers,
  createUserByAdmin,
  updateUserRole, // 👈 new function
} from '@/lib/auth';
import {
  FiSearch,
  FiFilter,
  FiEdit,
  FiTrash2,
  FiPlus,
  FiChevronDown,
  FiChevronUp,
  FiSave,
} from 'react-icons/fi';

export default function UsersManagement() {
  const { currentUser, isAdmin } = useAuth();
  const router = useRouter();

  const [users, setUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Barangay Admin',
  });
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [editedRole, setEditedRole] = useState('');

  /* =========================
     🔹 Fetch Users
  ========================= */
  useEffect(() => {
    const loadUsers = async () => {
      const fetchedUsers = await fetchAllUsers();

      // ✅ Deduplicate by ID
      const uniqueUsers = Array.from(
        new Map(fetchedUsers.map((u) => [u.id, u])).values()
      );
      setUsers(uniqueUsers);
    };
    loadUsers();
  }, []);

  /* =========================
     🔹 Redirect Non-Admins
  ========================= */
  useEffect(() => {
    if (typeof isAdmin === 'undefined') return;
    if (!isAdmin) router.push('/');
  }, [isAdmin, router]);

  /* =========================
     🔹 Filters
  ========================= */
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'All' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'All' || user.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  /* =========================
     🔹 Create New User
  ========================= */
  const handleCreateUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.password) {
      alert('Please fill all fields.');
      return;
    }

    const result = await createUserByAdmin(
      newUser.email,
      newUser.password,
      newUser.name,
      newUser.role
    );

    if (result.success) {
      alert(`✅ ${newUser.role} created successfully!`);
      setShowAddForm(false);
      setNewUser({ name: '', email: '', password: '', role: 'Barangay Admin' });
      const fetchedUsers = await fetchAllUsers();
      const uniqueUsers = Array.from(
        new Map(fetchedUsers.map((u) => [u.id, u])).values()
      );
      setUsers(uniqueUsers);
    } else {
      alert(`❌ Error: ${result.error}`);
    }
  };

  /* =========================
     🔹 Toggle User Status
  ========================= */
  const toggleUserStatus = async (userId: string, newStatus: string) => {
    setUsers(
      users.map((user) =>
        user.id === userId ? { ...user, status: newStatus } : user
      )
    );
  };

  /* =========================
     🔹 Delete User (Client-side only)
  ========================= */
  const deleteUser = (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      setUsers(users.filter((user) => user.id !== userId));
    }
  };

  /* =========================
     🔹 Update Role
  ========================= */
  const handleRoleUpdate = async (userId: string) => {
    if (!editedRole) return;

    const result = await updateUserRole(userId, editedRole);

    if (result.success) {
      alert('✅ Role updated successfully!');
      setEditingRole(null);
      const updated = users.map((u) =>
        u.id === userId ? { ...u, role: editedRole } : u
      );
      setUsers(updated);
    } else {
      alert(`❌ Error: ${result.error}`);
    }
  };

  if (typeof isAdmin === 'undefined' || !currentUser || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  /* =========================
     🔹 Render
  ========================= */
  return (
    <div className="bg-gray-50 p-6 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              User Management
            </h1>
            <p className="text-gray-600">
              Manage all users and their permissions
            </p>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FiPlus className="mr-2" />
            Add New User
          </button>
        </div>

        {/* Add User Form */}
        {showAddForm && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Create New Account</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <input
                type="text"
                placeholder="Full Name"
                value={newUser.name}
                onChange={(e) =>
                  setNewUser({ ...newUser, name: e.target.value })
                }
                className="border p-2 rounded-md"
              />
              <input
                type="email"
                placeholder="Email"
                value={newUser.email}
                onChange={(e) =>
                  setNewUser({ ...newUser, email: e.target.value })
                }
                className="border p-2 rounded-md"
              />
              <input
                type="password"
                placeholder="Password"
                value={newUser.password}
                onChange={(e) =>
                  setNewUser({ ...newUser, password: e.target.value })
                }
                className="border p-2 rounded-md"
              />
              <select
                value={newUser.role}
                onChange={(e) =>
                  setNewUser({ ...newUser, role: e.target.value })
                }
                className="border p-2 rounded-md"
              >
                <option value="Barangay Admin">Barangay Admin</option>
                <option value="Private Spot Owner">Private Spot Owner</option>
              </select>
            </div>
            <div className="flex justify-end mt-4">
              <button
                onClick={handleCreateUser}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Create User
              </button>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <FiFilter className="mr-2" />
              Filters
              {showFilters ? (
                <FiChevronUp className="ml-2" />
              ) : (
                <FiChevronDown className="ml-2" />
              )}
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Active</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user, index) => (
                  <tr key={user.id || user.email || index}>
                    <td className="px-6 py-4 whitespace-nowrap flex items-center">
                      <img
                        className="h-10 w-10 rounded-full"
                        src={user.photoURL || '/assets/default-avatar.png'}
                        alt={user.displayName || user.email}
                      />
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.displayName || 'Unknown'}
                        </div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {editingRole === user.id ? (
                        <div className="flex items-center space-x-2">
                          <select
                            value={editedRole}
                            onChange={(e) => setEditedRole(e.target.value)}
                            className="border p-1 rounded-md"
                          >
                            <option value="Barangay Admin">Barangay Admin</option>
                            <option value="Private Spot Owner">Private Spot Owner</option>
                            <option value="Tourist">Tourist</option>
                          </select>
                          <button
                            onClick={() => handleRoleUpdate(user.id)}
                            className="text-green-600 hover:text-green-800"
                          >
                            <FiSave />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <span>{user.role}</span>
                          <button
                            onClick={() => {
                              setEditingRole(user.id);
                              setEditedRole(user.role);
                            }}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <FiEdit />
                          </button>
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          user.status === 'Active'
                            ? 'bg-green-100 text-green-800'
                            : user.status === 'Inactive'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {user.lastActive || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        {user.status === 'Active' ? (
                          <button
                            onClick={() => toggleUserStatus(user.id, 'Inactive')}
                            className="text-yellow-600 hover:text-yellow-900"
                          >
                            <FiChevronDown />
                          </button>
                        ) : (
                          <button
                            onClick={() => toggleUserStatus(user.id, 'Active')}
                            className="text-green-600 hover:text-green-900"
                          >
                            <FiChevronUp />
                          </button>
                        )}
                        <button
                          onClick={() => deleteUser(user.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
