import { apiRequest } from "../apiClient";

export async function getAllUsers() {
    return apiRequest("/admin/users");
}

export async function updateUserRole(userId, newRole) {
    return apiRequest(`/admin/users/${userId}/role`, "PUT", { role: newRole });
}

export async function deleteUser(userId) {
    return apiRequest(`/admin/users/${userId}`, "DELETE");
}
