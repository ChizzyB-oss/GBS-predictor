import { useEffect, useState } from "react";
import DashboardLayout from "../../Components/DashboardLayout";
import { Users, Trash2, Edit, Search } from "lucide-react";
import { adminApi } from "../../api/client";

export default function ManageUsers() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [editingUser, setEditingUser] = useState(null);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      const token = localStorage.getItem("gbs_token");
      const data = await adminApi.getUsers(token);
      setUsers(data);
    } catch (err) {
      console.error("Failed to fetch users:", err);
    }
    setLoading(false);
  }

  async function handleDelete(id) {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      const token = localStorage.getItem("gbs_token");
      await adminApi.deleteUser(id, token);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Failed to delete user");
    }
  }

  // ------ ROLE BADGES ------
  const roleBadge = (role) => {
    return role === "admin"
      ? "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-300"
      : "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900 dark:text-emerald-300";
  };

  // ------ SEARCH FILTER ------
  const filteredUsers = users.filter((u) => {
    const text = `${u.full_name} ${u.email}`.toLowerCase();
    return text.includes(search.toLowerCase());
  });

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn">

        {/* HEADER */}
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
              <Users className="w-7 h-7 text-blue-600 dark:text-blue-300" />
              Manage Users
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Administrate clinician and admin accounts.
            </p>
          </div>

          {/* SEARCH BAR */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search users…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="
                pl-10 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700
                bg-white dark:bg-slate-800 text-sm
                text-slate-700 dark:text-slate-200
                focus:ring-2 focus:ring-blue-500 outline-none
              "
            />
          </div>
        </header>

        {/* LOADING */}
        {loading && (
          <div className="text-center py-10 text-slate-500 dark:text-slate-400">
            Loading users…
          </div>
        )}

        {/* EMPTY STATE */}
        {!loading && filteredUsers.length === 0 && (
          <div className="text-center py-16 border rounded-2xl bg-white dark:bg-slate-800 shadow-card">
            <p className="text-lg font-medium text-slate-600 dark:text-slate-300">
              No users found.
            </p>
            <p className="text-slate-400 dark:text-slate-500 text-sm">
              Try adjusting your search.
            </p>
          </div>
        )}

        {/* USERS TABLE */}
        {filteredUsers.length > 0 && (
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                <tr>
                  <th className="text-left px-6 py-3">Name</th>
                  <th className="text-left px-6 py-3">Email</th>
                  <th className="text-left px-6 py-3">Role</th>
                  <th className="text-right px-6 py-3">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredUsers.map((u) => (
                  <tr
                    key={u.id}
                    className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                  >
                    <td className="px-6 py-3 capitalize">{u.full_name}</td>
                    <td className="px-6 py-3">{u.email}</td>

                    {/* ROLE BADGE */}
                    <td className="px-6 py-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold border ${roleBadge(
                          u.role
                        )}`}
                      >
                        {u.role}
                      </span>
                    </td>

                    {/* ACTION BUTTONS */}
                    <td className="px-6 py-3 text-right flex items-center justify-end gap-3">

                      {/* EDIT BUTTON */}
                      <button
                        onClick={() => setEditingUser(u)}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-100"
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      {/* DELETE BUTTON */}
                      <button
                        onClick={() => handleDelete(u.id)}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                    </td>
                  </tr>
                ))}
              </tbody>

            </table>
          </div>
        )}

        {/* EDIT USER MODAL */}
        {editingUser && (
          <EditUserModal
            user={editingUser}
            onClose={() => setEditingUser(null)}
            onSave={loadUsers}
          />
        )}

      </div>
    </DashboardLayout>
  );
}

/* ======================================
   EDIT USER MODAL COMPONENT
====================================== */
function EditUserModal({ user, onClose, onSave }) {
  const [role, setRole] = useState(user.role);

  async function handleSave() {
    try {
      const token = localStorage.getItem("gbs_token");
      await adminApi.updateUserRole(user.id, role, token);
      onSave();
      onClose();
    } catch (err) {
      console.error("Failed to update user:", err);
      alert("Update failed");
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-xl animate-fadeIn"
      >
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
          Edit User
        </h2>

        <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
          {user.full_name} ({user.email})
        </p>

        <label className="text-sm text-slate-700 dark:text-slate-300 font-medium">
          Role
        </label>

        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="
            w-full mt-2 px-3 py-2 rounded-lg 
            border border-slate-300 dark:border-slate-600 
            bg-white dark:bg-slate-700
            text-slate-900 dark:text-white
          "
        >
          <option value="clinician">Clinician</option>
          <option value="admin">Admin</option>
        </select>

        {/* BUTTONS */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200"
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
