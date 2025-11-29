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

export async function getProductStatusList() {
  // Calls FastAPI: /admin/products/status-list
  return apiRequest("/admin/products/status-list");
}