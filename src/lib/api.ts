const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://13.221.172.108:5000/api';

export interface AuthFormData {
  username?: string;
  email: string;
  password: string;
}

export interface FileData {
  _id: string;
  filename: string;
  size: number;
  url: string;
  contentType: string;
  fileType: string;
  folder: string;
  user: string;
  uploadTime: string;
}

class ApiService {
  private getAuthHeaders(token?: string) {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  }

  async register(data: AuthFormData) {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Registration failed');
    }
    
    return response.json();
  }

  async login(data: AuthFormData) {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }
    
    return response.json();
  }

  async refreshToken(refreshToken: string) {
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ refreshToken }),
    });
    
    if (!response.ok) {
      throw new Error('Token refresh failed');
    }
    
    return response.json();
  }

  async uploadFiles(files: FileList, folder: string, token: string) {
    const formData = new FormData();
    
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }
    
    if (folder) {
      formData.append('folder', folder);
    }

    const response = await fetch(`${API_URL}/files/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Upload failed');
    }
    
    return response.json();
  }

  async getFiles(params: { folder?: string; fileType?: string }, token: string): Promise<FileData[]> {
    const searchParams = new URLSearchParams();
    if (params.folder) searchParams.append('folder', params.folder);
    if (params.fileType) searchParams.append('fileType', params.fileType);
    
    const queryString = searchParams.toString();
    const url = `${API_URL}/files${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch files');
    }
    
    const data = await response.json();
    return Array.isArray(data.files) ? data.files : [];
  }

  async downloadFile(fileId: string, token: string) {
    const response = await fetch(`${API_URL}/files/${fileId}/download`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to get download link');
    }
    
    const data = await response.json();
    
    if (!data.url && data.downloadUrl) {
      data.url = data.downloadUrl;
    } else if (!data.url && data.signedUrl) {
      data.url = data.signedUrl;
    }
    
    return data;
  }

  async deleteFile(fileId: string, token: string) {
    const response = await fetch(`${API_URL}/files/${fileId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete file');
    }
    
    return response.json();
  }
}

export const apiService = new ApiService();
