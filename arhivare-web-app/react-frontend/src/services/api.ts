const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export class ApiService {
  async healthCheck() {
    const response = await fetch(`${API_BASE_URL}/health`);
    if (!response.ok) throw new Error('Health check failed');
    return response.json();
  }

  async searchFonds(query: string, skip = 0, limit = 20) {
    const response = await fetch(
      `${API_BASE_URL}/search?query=${encodeURIComponent(query)}&skip=${skip}&limit=${limit}`
    );
    if (!response.ok) throw new Error('Search failed');
    return response.json();
  }
}

export const apiService = new ApiService();
