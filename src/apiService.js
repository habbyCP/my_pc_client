import axios from 'axios';

let apiUrl = '';

// Function to initialize the API service with the config
export async function initializeApiService() { 
    const config = await window.electronAPI.getConfig();
    apiUrl = config.API_URL;
}

// Real API service
export const apiService = {
  async getCategories() {
    const response = await axios.get(`${apiUrl}/categories/list`); 
    return response.data;
  },

  async getAddonsList(params = {}) {
    const response = await axios.get(`${apiUrl}/addons/list`, { params });
    return response.data;
  },

  async getClientsList(params = {}) {
    const response = await axios.get(`${apiUrl}/articles`, { params });
    return response.data;
  },

  async getAddonDownloadUrl(addonId) {
    const response = await axios.get(`${apiUrl}/addons/download_url/${addonId}`);
    return response.data;
  },
};
