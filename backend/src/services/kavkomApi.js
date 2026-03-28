const KAVKOM_API_URL = process.env.KAVKOM_API_URL || 'https://api.kavkom.com';
const KAVKOM_API_KEY = process.env.KAVKOM_API_KEY || '';

class KavkomApiService {
  constructor() {
    this.baseUrl = KAVKOM_API_URL;
    this.apiKey = KAVKOM_API_KEY;
  }

  async _request(method, endpoint, body = null) {
    const url = `${this.baseUrl}${endpoint}`;
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Api-Key ${this.apiKey}`,
      },
    };
    if (body) {
      options.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Kavkom API error ${response.status}: ${errorText}`);
      }
      return response.json();
    } catch (error) {
      console.error(`Kavkom API request failed: ${method} ${endpoint}`, error.message);
      throw error;
    }
  }

  async initiateCall(domainUuid, src, destination) {
    return this._request('POST', '/api/pbx/v1/active_call/call', {
      domain_uuid: domainUuid,
      src,
      destination,
    });
  }

  async getTags() {
    return this._request('GET', '/api/crm/v1/tags/');
  }

  async assignTag(contactId, tagId) {
    return this._request('POST', `/api/crm/v1/tags/${tagId}/assign`, {
      contact_id: contactId,
    });
  }

  async getExtensions() {
    return this._request('GET', '/api/pbx/v1/extension/');
  }

  async getCallRecords(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this._request('GET', `/api/pbx/v1/cdr/?${query}`);
  }

  async getUsers() {
    return this._request('GET', '/api/pbx/v1/user/');
  }
}

module.exports = new KavkomApiService();
