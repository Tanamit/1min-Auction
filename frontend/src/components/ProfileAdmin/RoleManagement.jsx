import { useEffect, useState } from "react";
import { getAllUsers, updateUserRole, deleteUser } from "../../services/ProfileAdmin/userService";

const ROLE_OPTIONS = ["admin", "seller", "buyer"];

export default function RoleManagement() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [actionUserId, setActionUserId] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState(null);
    const currentUserId = "CURRENT_ADMIN_ID"; // Replace with actual auth later

    async function loadUsers() {
        try {
            setLoading(true);
            const data = await getAllUsers();
            setUsers(data);
        } catch (e) {
            setError("Failed to load users.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadUsers();
    }, []);

    async function handleRoleChange(userId, newRole) {
        setActionUserId(userId);
        try {
            await updateUserRole(userId, newRole);
            setUsers((prev) =>
                prev.map((u) => (u.user_id === userId ? { ...u, role: newRole } : u))
            );
        } catch {
            setError("Failed to update role.");
        } finally {
            setActionUserId(null);
        }
    }

    async function handleDelete() {
        const id = confirmDelete?.user_id;
        setActionUserId(id);
        try {
            await deleteUser(id);
            setUsers((prev) => prev.filter((u) => u.user_id !== id));
            setConfirmDelete(null);
        } catch {
            setError("Failed to delete user.");
        } finally {
            setActionUserId(null);
        }
    }

    return (
        <section className="bg-white shadow-sm rounded-lg p-6 md:p-8">
            {/* Title */}
            <h2 className="text-2xl font-semibold text-gray-700 mb-6">
                Role Management
            </h2>

            {/* Error Message */}
            {error && (
                <p className="text-red-600 mb-3 bg-red-50 border border-red-100 p-2 rounded">
                    {error}
                </p>
            )}

            {/* Loading */}
            {loading ? (
                <p className="text-gray-500">Loading users...</p>
            ) : (
                <>
                    {/* Table Header */}
                    <div className="grid grid-cols-12 px-4 md:px-6 py-3 bg-gray-50 rounded-md shadow-sm">
                        <div className="col-span-4 text-sm font-semibold text-gray-600">
                            Name
                        </div>
                        <div className="col-span-4 text-sm font-semibold text-gray-600">
                            Email
                        </div>
                        <div className="col-span-2 text-sm font-semibold text-gray-600">
                            Role
                        </div>
                        <div className="col-span-2 text-sm font-semibold text-gray-600 text-right">
                            Actions
                        </div>
                    </div>

                    {/* Table Rows */}
                    <div className="space-y-3 mt-4">
                        {users.map((u) => {
                            const isSelf = u.user_id === currentUserId;
                            return (
                                <div
                                    key={u.user_id}
                                    className="grid grid-cols-12 items-center bg-white shadow-sm px-4 md:px-6 py-4 rounded-md border border-gray-100"
                                >
                                    <div className="col-span-4 font-medium text-gray-800">
                                        {u.name}
                                    </div>
                                    <div className="col-span-4 text-gray-600">{u.email}</div>

                                    <div className="col-span-2">
                                        <select
                                            value={u.role ?? ""}
                                            disabled={isSelf || actionUserId === u.user_id}
                                            onChange={(e) =>
                                                handleRoleChange(u.user_id, e.target.value)
                                            }
                                            className="border border-gray-300 rounded-md px-2 py-1 text-gray-700 w-full focus:outline-none focus:ring-2 focus:ring-gray-400"
                                        >
                                            <option value="" disabled>
                                                -- choose role --
                                            </option>
                                            {ROLE_OPTIONS.map((r) => (
                                                <option key={r} value={r}>
                                                    {r}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="col-span-2 flex justify-end">
                                        <button
                                            disabled={isSelf || actionUserId === u.user_id}
                                            onClick={() => setConfirmDelete(u)}
                                            className="text-red-600 hover:text-red-700 hover:underline text-sm font-medium"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}

            {/* Delete Confirmation Modal */}
            {confirmDelete && (
                <div className="fixed inset-0 z-50">
                    <div
                        className="absolute inset-0 bg-black/40"
                        onClick={() => setConfirmDelete(null)}
                        aria-hidden="true"
                    />
                    <div className="absolute inset-0 flex items-center justify-center p-4">
                        <div className="w-full max-w-md bg-white rounded-lg shadow-lg">
                            <div className="px-5 py-4 border-b border-gray-100">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Confirm Deletion
                                </h3>
                            </div>
                            <div className="p-5 text-gray-700">
                                Are you sure you want to delete{" "}
                                <span className="font-medium">{confirmDelete.name}</span> (
                                {confirmDelete.email})?
                            </div>
                            <div className="px-5 py-4 flex items-center justify-end gap-2 border-t border-gray-100">
                                <button
                                    onClick={() => setConfirmDelete(null)}
                                    className="px-4 py-2 rounded-md border text-gray-700 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="px-4 py-2 rounded-md text-white bg-red-600 hover:bg-red-700"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
