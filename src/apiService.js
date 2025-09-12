import axios from 'axios';

let apiUrl = '';

/**
 * @typedef {Object} LatestVersionRes
 * @property {number} id
 * @property {string} name
 * @property {string} last_version
 * @property {string} cover
 * @property {string} description
 * @property {string} size
 */

/**
 * by_sub_dirs 返回的条目（字段名为 version 而非 last_version）
 * @typedef {Object} SubDirAddonRes
 * @property {number} id
 * @property {string} name
 * @property {string} sub_dir_name
 * @property {string} version
 * @property {string} last_updated
 * @property {string} cover
 * @property {string} description
 * @property {string} size
 */

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

  /**
   * @param {Array<number|string>} ids
   * @returns {Promise<LatestVersionRes[]>}
   */
  async checkLatestVersionsByIds(ids = []) {
    try {
      // 确保每个元素为整数
      const idNums = Array.from(new Set((ids || []).map((v) => {
        const n = Number(v);
        return Number.isFinite(n) ? Math.trunc(n) : NaN;
      }).filter((n) => Number.isFinite(n))));
      if (idNums.length === 0) return [];
      const payload = { addons_ids: idNums };
      const { data } = await axios.post(`${apiUrl}/addons/latest_version`, payload, {
        headers: { 'Content-Type': 'application/json' }
      });
      // 期望返回 { code: number, data: LatestVersionRes[], msg: string }
      if (data && Array.isArray(data.data)) return data.data;
      return [];
    } catch (e) {
      return [];
    }
  },

  // 入参: subDirNames: string[]
  // 回参: Record<string, Array<{ id: number, name: string, last_version: string, cover: string, description: string, size: string }>>
  /**
   * @param {string[]} subDirNames
   * @returns {Promise<Record<string, SubDirAddonRes[]>>}
   */
  async getAddonsBySubDirs(subDirNames = []) {
    try {
      const payload = { sub_dir_names: subDirNames };
      const { data } = await axios.post(`${apiUrl}/addons/by_sub_dirs`, payload, {
        headers: { 'Content-Type': 'application/json' }
      });
      // 期望返回 { code: number, data: Record<string, LatestVersionRes[]>, msg: string }
      if (data && data.data && typeof data.data === 'object') return data.data;
      return {};
    } catch (e) {
      return {};
    }
  }
};
