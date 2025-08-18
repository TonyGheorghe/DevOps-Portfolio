// src/services/api.ts
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

class ApiService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('auth_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  // Public search endpoints
  async searchFonds(query: string, skip = 0, limit = 20) {
    const response = await fetch(
      `${API_BASE_URL}/search?query=${encodeURIComponent(query)}&skip=${skip}&limit=${limit}`
    );
    if (!response.ok) throw new Error('Search failed');
    return response.json();
  }

  async getSearchCount(query: string) {
    const response = await fetch(
      `${API_BASE_URL}/search/count?query=${encodeURIComponent(query)}`
    );
    if (!response.ok) throw new Error('Count failed');
    return response.json();
  }

  // Auth endpoints
  async login(username: string, password: string) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    if (!response.ok) throw new Error('Login failed');
    return response.json();
  }

  // Admin endpoints
  async getFonds(skip = 0, limit = 20, activeOnly = true) {
    const response = await fetch(
      `${API_BASE_URL}/fonds/?skip=${skip}&limit=${limit}&active_only=${activeOnly}`,
      { headers: this.getAuthHeaders() }
    );
    if (!response.ok) throw new Error('Failed to fetch fonds');
    return response.json();
  }

  async createFond(fondData: any) {
    const response = await fetch(`${API_BASE_URL}/fonds/`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(fondData)
    });
    if (!response.ok) throw new Error('Failed to create fond');
    return response.json();
  }

  async updateFond(id: number, fondData: any) {
    const response = await fetch(`${API_BASE_URL}/fonds/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(fondData)
    });
    if (!response.ok) throw new Error('Failed to update fond');
    return response.json();
  }

  async deleteFond(id: number, permanent = false) {
    const url = permanent 
      ? `${API_BASE_URL}/fonds/${id}?permanent=true`
      : `${API_BASE_URL}/fonds/${id}`;
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });
    return response.ok;
  }
}

export const apiService = new ApiService();
export default ApiService;
