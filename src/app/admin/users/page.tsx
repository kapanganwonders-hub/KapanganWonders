'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

const BARANGAYS = [
  'Balakbak',
  'Boklaoan',
  'Cayapes',
  'Cuba',
  'Datakan',
  'Gadang',
  'Gaswiling',
  'Labueg',
  'Sagubo',
  'Taba-ao',
  'Paykek',
  'Central',
  'Pongayan',
  'Pudong',
  'Beleng-Belis',
];

const capitalizeFirstLetter = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};
import {
  fetchAllUsers,
  createUserByAdmin,
  updateUserRole,
  deleteUserAccount,
} from '@/lib/auth';
import {
  FiSearch,
  FiEdit,
  FiTrash2,
  FiPlus,
  FiChevronDown,
  FiChevronUp,
  FiSave,
} from 'react-icons/fi';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

export default function UsersManagement() {
  const { currentUser, isAdmin } = useAuth();
  const router = useRouter();

  const [users, setUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showBarangayDropdown, setShowBarangayDropdown] = useState(true);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Barangay Admin',
    barangay: '',
    privateSpotName: '',
  });
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [editedRole, setEditedRole] = useState('');

  /* =========================
     🔹 Helper: Reload Users
  ========================= */
  const reloadUsers = async () => {
    try {
      const fetchedUsers = await fetchAllUsers();

      const uniqueUsers = Array.from(
        new Map(fetchedUsers.map((u) => [u.id, u])).values()
      ).map((user) => {
        const isActive =
          typeof user.isActive === 'boolean'
            ? user.isActive
            : user.status === 'Active';

        return {
          ...user,
          isActive,
          status: isActive ? 'Active' : 'Inactive',
        };
      });

      setUsers(uniqueUsers);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  useEffect(() => {
    reloadUsers();
  }, []);

  /* =========================
     🔹 Redirect Non-Admins
  ========================= */
  useEffect(() => {
    if (typeof isAdmin === 'undefined') return;
    if (!isAdmin) router.push('/');
  }, [isAdmin, router]);

  /* =========================
     🔹 Create New User
  ========================= */
  const handleCreateUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.password) {
      alert('Please fill all fields.');
      return;
    }

    if (newUser.role === 'Barangay Admin' && !newUser.barangay) {
      alert('Please select a barangay for Barangay Admin.');
      return;
    }

    if (
      newUser.role === 'Private Spot Owner' &&
      (!newUser.privateSpotName || !newUser.barangay)
    ) {
      alert('Please fill in private spot name and barangay for Private Spot Owner.');
      return;
    }

    try {
      const result = await createUserByAdmin(
        newUser.email,
        newUser.password,
        newUser.name,
        newUser.role,
        newUser.barangay as any,
        newUser.privateSpotName as any
      );

      if (result.success) {
        alert(`✅ ${newUser.role} created successfully!`);
        setShowAddForm(false);
        setNewUser({
          name: '',
          email: '',
          password: '',
          role: 'Barangay Admin',
          barangay: '',
          privateSpotName: '',
        });
        await reloadUsers();
      } else {
        alert(`❌ Error: ${result.error}`);
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred while creating the user.');
    }
  };

  /* =========================
     🔹 Toggle User Status (Firestore)
  ========================= */
  const toggleUserStatus = async (user: any) => {
    const newIsActive = user.status !== 'Active';
    const newStatus = newIsActive ? 'Active' : 'Inactive';

    let collectionName = 'users'; // default

    if (user.role === 'Barangay Admin') {
      collectionName = 'barangayAdmins';
    } else if (user.role === 'Private Spot Owner') {
      collectionName = 'privateSpotOwners';
    }

    try {
      const updates: any = { status: newStatus };

      // Only tourists have "isActive"
      if (collectionName === 'users') {
        updates.isActive = newIsActive;
      }

      await updateDoc(doc(db, collectionName, String(user.id)), updates);

      // Update local state
      setUsers(prev =>
        prev.map(u =>
          u.id === user.id
            ? { ...u, status: newStatus, isActive: newIsActive }
            : u
        )
      );
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update user status.');
    }
  };

  /* =========================
     🔹 Delete User
  ========================= */
  const deleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    try {
      const result = await deleteUserAccount(userId);
      if (result.success) {
        setUsers((prev) => prev.filter((u) => u.id !== userId));
      } else {
        alert(`Failed to delete user: ${result.error}`);
      }
    } catch (err) {
      console.error('Error deleting user:', err);
      alert('An error occurred while deleting the user.');
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
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, role: editedRole } : u
        )
      );
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
            <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
            <p className="text-gray-600">Manage all users and their permissions</p>
          </div>
          <button
            onClick={() => setShowAddForm((prev) => !prev)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <FiPlus className="mr-2" />
            Add New User
          </button>
        </div>

      {/* Add User Form */}
{showAddForm && (
  <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
    <h2 className="text-lg font-semibold mb-4">Create New Account</h2>

    {/* Name */}
    <div className="mb-3">
      <label className="block text-sm font-medium text-gray-700">Name</label>
      <input
        type="text"
        value={newUser.name}
        onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
        className="mt-1 block w-full border rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
        placeholder="Enter full name"
      />
    </div>

    {/* Email */}
    <div className="mb-3">
      <label className="block text-sm font-medium text-gray-700">Email</label>
      <input
        type="email"
        value={newUser.email}
        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
        className="mt-1 block w-full border rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
        placeholder="Enter email"
      />
    </div>

    {/* Password */}
    <div className="mb-3">
      <label className="block text-sm font-medium text-gray-700">Password</label>
      <input
        type="password"
        value={newUser.password}
        onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
        className="mt-1 block w-full border rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
        placeholder="Enter password"
      />
    </div>

    {/* Role */}
    <div className="mb-3">
      <label className="block text-sm font-medium text-gray-700">Role</label>
      <select
        value={newUser.role}
        onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
        className="mt-1 block w-full border rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
      >
        <option value="Tourist">Tourist</option>
        <option value="Barangay Admin">Barangay Admin</option>
        <option value="Private Spot Owner">Private Spot Owner</option>
      </select>
    </div>

    {/* Barangay - only for admins or private spot owners */}
    {(newUser.role === 'Barangay Admin' || newUser.role === 'Private Spot Owner') && (
      <div className="mb-3">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="block text-sm font-medium text-gray-700">Barangay</label>
            <button
              type="button"
              onClick={() => setShowBarangayDropdown(!showBarangayDropdown)}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              {showBarangayDropdown ? 'Type custom' : 'Select from list'}
            </button>
          </div>
          
          {showBarangayDropdown ? (
            <select
              value={newUser.barangay}
              onChange={(e) => setNewUser({ ...newUser, barangay: e.target.value })}
              className="mt-1 block w-full border rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select a barangay</option>
              {BARANGAYS.map((barangay) => (
                <option key={barangay} value={barangay}>
                  {barangay}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={newUser.barangay}
              onChange={(e) => {
                const value = e.target.value;
                // Capitalize first letter and keep the rest as is
                const capitalized = value ? capitalizeFirstLetter(value) : '';
                setNewUser({ ...newUser, barangay: capitalized });
              }}
              className="mt-1 block w-full border rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter barangay name"
            />
          )}
        </div>
      </div>
    )}

    {/* Private Spot Name - only for private spot owners */}
    {newUser.role === 'Private Spot Owner' && (
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700">Private Spot Name</label>
        <input
          type="text"
          value={newUser.privateSpotName}
          onChange={(e) =>
            setNewUser({ ...newUser, privateSpotName: e.target.value })
          }
          className="mt-1 block w-full border rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Enter private spot name"
        />
      </div>
    )}

    {/* Submit Button */}
    <div className="flex justify-end mt-4">
      <button
        onClick={handleCreateUser}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
      >
        Create User
      </button>
    </div>
  </div>
)}


        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <FiSearch className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="w-48">
              <label className="sr-only">Filter by role</label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="block w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              >
                <option value="All">All Roles</option>
                <option value="Tourist">Tourist</option>
                <option value="Barangay Admin">Barangay Admin</option>
                <option value="Private Spot Owner">Private Spot Owner</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users
                  .filter((u) => {
                    const matchesSearch =
                      u.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      u.email?.toLowerCase().includes(searchTerm.toLowerCase());
                    const matchesRole = roleFilter === 'All' || u.role === roleFilter;
                    return matchesSearch && matchesRole;
                  })
                   .map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 flex items-center space-x-3">
                        <img
                          src={user.photoURL || '/assets/default-avatar.png'}
                          alt=""
                          className="w-10 h-10 rounded-full"
                        />
                        <div>
                          <p className="font-medium text-gray-900">{user.displayName || 'Unknown'}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
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
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            user.status === 'Active'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {user.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-sm">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => toggleUserStatus(user)}
                            className={`${
                              user.status === 'Active'
                                ? 'text-yellow-600 hover:text-yellow-900'
                                : 'text-green-600 hover:text-green-900'
                            }`}
                          >
                            {user.status === 'Active' ? <FiChevronDown /> : <FiChevronUp />}
                          </button>
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
