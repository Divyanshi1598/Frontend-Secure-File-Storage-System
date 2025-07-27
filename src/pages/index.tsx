'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AuthForm from '@/components/AuthForm';
import FileUpload from '@/components/FileUpload';
import FileList from '@/components/FileList';
import { apiService, FileData, AuthFormData } from '@/lib/api';

export default function Home() {
  const { user, accessToken, login, register, logout, loading: authLoading } = useAuth();
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [files, setFiles] = useState<FileData[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    folder: '',
    fileType: ''
  });

  // Fetch files when user is authenticated
  useEffect(() => {
    if (accessToken) {
      fetchFiles();
    }
  }, [accessToken, filters]);

  const fetchFiles = async () => {
    if (!accessToken) return;
    
    setLoading(true);
    try {
      const fetchedFiles = await apiService.getFiles(filters, accessToken);
      setFiles(fetchedFiles);
    } catch (error) {
      console.error('Failed to fetch files:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (data: AuthFormData) => {
    if (authMode === 'login') {
      await login(data);
    } else {
      await register(data);
      alert('Registration successful! Please log in.');
      setAuthMode('login');
    }
  };

  const handleUpload = async (fileList: FileList, folder: string) => {
    if (!accessToken) return;
    
    try {
      await apiService.uploadFiles(fileList, folder, accessToken);
      await fetchFiles(); // Refresh file list
    } catch (error: any) {
      throw error;
    }
  };

  const handleDownload = async (file: FileData) => {
    if (!accessToken) return;
    
    try {
      const response = await apiService.downloadFile(file._id, accessToken);
      
      if (response.url) {
        window.open(response.url, '_blank');
      } else if (response.signedUrl) {
        window.open(response.signedUrl, '_blank');
      } else if (response.downloadUrl) {
        window.open(response.downloadUrl, '_blank');
      } else {
        throw new Error('No download URL provided by the server');
      }
    } catch (error) {
      alert('Failed to download file');
    }
  };

  const handleDelete = async (file: FileData) => {
    if (!accessToken) return;
    
    try {
      await apiService.deleteFile(file._id, accessToken);
      await fetchFiles(); // Refresh file list
    } catch (error) {
      alert('Failed to delete file');
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user || !accessToken) {
    return (
      <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Secure File Storage
            </h1>
            <p className="text-gray-600">
              Upload, manage, and share your files securely
            </p>
          </div>
          
          <AuthForm
            mode={authMode}
            onSubmit={handleAuth}
            onModeChange={setAuthMode}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Secure File Storage
              </h1>
              <p className="text-sm text-gray-600">Welcome back, {user.email}</p>
            </div>
            <button
              onClick={logout}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* File Upload */}
          <FileUpload onUpload={handleUpload} />

          {/* File Filters */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Filter Files</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Folder
                </label>
                <input
                  type="text"
                  name="folder"
                  value={filters.folder}
                  onChange={handleFilterChange}
                  placeholder="Filter by folder"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  File Type
                </label>
                <select
                  name="fileType"
                  value={filters.fileType}
                  onChange={handleFilterChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Types</option>
                  <option value="image">Images</option>
                  <option value="document">Documents</option>
                  <option value="video">Videos</option>
                  <option value="audio">Audio</option>
                  <option value="archive">Archives</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* File List */}
          <FileList
            files={files}
            onDownload={handleDownload}
            onDelete={handleDelete}
            loading={loading}
          />
        </div>
      </main>
    </div>
  );
}
