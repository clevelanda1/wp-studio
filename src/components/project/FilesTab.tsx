import React, { useState } from 'react';
import { Project } from '../../contexts/DataContext';
import { ProjectFile } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Plus, File, Upload, X, Folder, Download, Eye, Trash2 } from 'lucide-react';

interface FilesTabProps {
  project: Project;
  projectFiles: ProjectFile[];
  onAddProjectFile: (projectFile: Omit<ProjectFile, 'id' | 'created_at'>) => Promise<void>;
  onUpdateProjectFile: (id: string, updates: Partial<ProjectFile>) => Promise<void>;
  onDeleteProjectFile: (id: string) => Promise<void>;
}

const FilesTab: React.FC<FilesTabProps> = ({
  project,
  projectFiles,
  onAddProjectFile,
  onUpdateProjectFile,
  onDeleteProjectFile
}) => {
  const { user } = useAuth();
  const [showAddFileForm, setShowAddFileForm] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [deletingFile, setDeletingFile] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [roomFilter, setRoomFilter] = useState<string>('all');
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    room: '',
    description: '',
    isVisionboard: false
  });

  const isAdmin = user?.role === 'business_owner' || user?.role === 'team_member';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Filter for allowed file types
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    const validFiles = files.filter(file => {
      if (!allowedTypes.includes(file.type)) {
        alert(`File type ${file.type} is not allowed`);
        return false;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        alert(`File ${file.name} is too large (max 10MB)`);
        return false;
      }
      return true;
    });
    
    setSelectedFiles(validFiles);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedFiles.length === 0) {
      alert('Please select at least one file');
      return;
    }

    setUploading(true);

    try {
      // Upload each file to Supabase Storage and create project file records
      for (const file of selectedFiles) {
        // Generate unique file path
        const timestamp = Date.now();
        const fileExtension = file.name.split('.').pop();
        const fileName = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        const filePath = `projects/${project.id}/${fileName}`;

        console.log('🔍 Uploading file:', { fileName, filePath, fileSize: file.size });

        // Upload file to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('project_files')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('❌ Upload error:', uploadError);
          throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
        }

        console.log('✅ File uploaded successfully:', uploadData);

        // Get public URL for the uploaded file
        const { data: urlData } = supabase.storage
          .from('project_files')
          .getPublicUrl(filePath);

        if (!urlData.publicUrl) {
          throw new Error(`Failed to get public URL for ${file.name}`);
        }

        console.log('✅ Public URL generated:', urlData.publicUrl);
        
        const projectFile: Omit<ProjectFile, 'id' | 'created_at'> = {
          projectId: project.id,
          clientId: project.clientId || '',
          fileName: file.name,
          fileUrl: urlData.publicUrl,
          fileType: file.type,
          fileSize: file.size,
          room: formData.room || undefined,
          description: formData.description || '',
          isVisionboard: formData.isVisionboard
        };
        
        await onAddProjectFile(projectFile);
      }

      // Reset form
      setFormData({ room: '', description: '', isVisionboard: false });
      setSelectedFiles([]);
      setShowAddFileForm(false);
      
      console.log('✅ All files uploaded and saved to database');
    } catch (error) {
      console.error('Failed to upload files:', error);
      alert(`Failed to upload files: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleViewFile = (fileUrl: string) => {
    window.open(fileUrl, '_blank');
  };

  const handleDownloadFile = (fileUrl: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteFile = async (fileId: string) => {
    setShowDeleteConfirm(null);
    try {
      setDeletingFile(fileId);
      
      // Get the file to delete from storage
      const fileToDelete = projectFiles.find(f => f.id === fileId);
      if (fileToDelete) {
        // Extract file path from URL for storage deletion
        const url = new URL(fileToDelete.fileUrl);
        const pathParts = url.pathname.split('/');
        const filePath = pathParts.slice(-2).join('/'); // Get last two parts: projects/{id}/{filename}
        
        console.log('🔍 Deleting file from storage:', filePath);
        
        // Delete from Supabase Storage
        const { error: storageError } = await supabase.storage
          .from('project_files')
          .remove([filePath]);
        
        if (storageError) {
          console.warn('⚠️ Failed to delete from storage:', storageError);
          // Continue with database deletion even if storage deletion fails
        }
      }
      
      // Delete from database
      await onDeleteProjectFile(fileId);
    } catch (error) {
      console.error('Failed to delete file:', error);
      alert('Failed to delete file. Please try again.');
    } finally {
      setDeletingFile(null);
    }
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return <File className="w-8 h-8 text-red-500" />;
      case 'doc':
      case 'docx':
        return <File className="w-8 h-8 text-blue-500" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'webp':
        return <File className="w-8 h-8 text-green-500" />;
      default:
        return <File className="w-8 h-8 text-gray-500" />;
    }
  };

  // Filter files based on room selection
  const filteredFiles = projectFiles.filter(file => {
    if (roomFilter === 'all') return true;
    if (roomFilter === 'no-room') return !file.room;
    return file.room === roomFilter;
  });

  // Get unique rooms from project and files
  const availableRooms = Array.from(new Set([
    ...(project.rooms || []),
    ...projectFiles.map(f => f.room).filter(Boolean)
  ])).sort();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between space-x-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900 tracking-tight">Project Files</h3>
          <p className="text-sm text-gray-600 mt-1">Manage project documents and images</p>
        </div>
        <div className="flex items-center space-x-3">
          {/* Room Filter */}
          <select
            value={roomFilter}
            onChange={(e) => setRoomFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            <option value="all">All Rooms</option>
            <option value="no-room">No Room Assigned</option>
            {availableRooms.map(room => (
              <option key={room} value={room}>{room}</option>
            ))}
          </select>
          
          {isAdmin && !showAddFileForm && (
            <button 
              onClick={() => setShowAddFileForm(true)}
              className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-4 py-2 rounded-lg transition-colors duration-200"
            >
              <span>Add File</span>
            </button>
          )}
        </div>
      </div>

      {/* Add File Form */}
      {showAddFileForm && isAdmin && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h4 className="text-lg font-medium text-gray-900">Upload Files</h4>
              <p className="text-sm text-gray-600 mt-1">Add documents, images, or other project files</p>
            </div>
            <button
              onClick={() => setShowAddFileForm(false)}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Room/Area
              </label>
              <select
                value={formData.room}
                onChange={(e) => setFormData(prev => ({ ...prev, room: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="">Select room/area</option>
                {project.rooms?.map(room => (
                  <option key={room} value={room}>{room}</option>
                ))}
                <option value="General">General</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Files *
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-gray-400 transition-colors">
                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center space-y-2"
                >
                  <Upload className="w-8 h-8 text-gray-400" />
                  <div>
                    <span className="text-blue-600 hover:text-blue-700 font-medium">
                      Click to upload
                    </span>
                    <span className="text-gray-500"> or drag and drop</span>
                  </div>
                  <p className="text-xs text-gray-500">PDF, DOC, DOCX, JPG, PNG, GIF, WEBP up to 10MB each</p>
                </label>
              </div>

              {selectedFiles.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm font-medium text-gray-700">Selected Files:</p>
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getFileIcon(file.name)}
                        <div>
                          <p className="text-sm font-medium text-blue-800">{file.name}</p>
                          <p className="text-xs text-blue-600">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(index)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">
                Is Visionboard
              </label>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, isVisionboard: !prev.isVisionboard }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  formData.isVisionboard ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    formData.isVisionboard ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                placeholder="Optional description for these files..."
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setShowAddFileForm(false)}
                disabled={uploading}
                className="px-4 py-2 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 border border-gray-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={selectedFiles.length === 0 || uploading}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {uploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Uploading...</span>
                  </>
                ) : (
                  <span>Upload Files</span>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Files List */}
      <div className="space-y-4">
        {filteredFiles && filteredFiles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredFiles.map((file) => {
              const isImage = file.fileType?.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp)$/i.test(file.fileName);
              
              return (
                <div key={file.id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-all duration-300">
                  {isImage ? (
                    <div className="aspect-video rounded-lg overflow-hidden border border-gray-200 mb-3">
                      <img 
                        src={file.fileUrl} 
                        alt={file.fileName}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ) : (
                    <div className="aspect-video rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center mb-3">
                      {getFileIcon(file.fileName)}
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900 text-sm truncate">{file.fileName}</h4>
                      {file.isVisionboard && (
                        <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full font-medium">
                          Visionboard
                        </span>
                      )}
                    </div>
                    {file.room && (
                      <p className="text-xs text-gray-500">Room: {file.room}</p>
                    )}
                    {file.description && (
                      <p className="text-xs text-gray-600">{file.description}</p>
                    )}
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleViewFile(file.fileUrl)}
                        className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 py-2 px-2 rounded-lg transition-colors text-xs font-medium flex items-center justify-center space-x-1"
                      >
                        <Eye className="w-3 h-3" />
                        <span>View</span>
                      </button>
                      <button
                        onClick={() => handleDownloadFile(file.fileUrl, file.fileName)}
                        className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-700 py-2 px-2 rounded-lg transition-colors text-xs font-medium flex items-center justify-center space-x-1"
                      >
                        <Download className="w-3 h-3" />
                        <span>Download</span>
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => setShowDeleteConfirm(file.id)}
                          disabled={deletingFile === file.id}
                          className="bg-red-50 hover:bg-red-100 text-red-700 py-2 px-2 rounded-lg transition-colors text-xs font-medium flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Delete File"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <Folder className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">
              {roomFilter === 'all' ? 'No files yet' : `No files in ${roomFilter === 'no-room' ? 'unassigned files' : roomFilter}`}
            </h4>
            <p className="text-gray-600">
              {roomFilter === 'all' 
                ? (isAdmin ? 'Upload your first file to get started' : 'Files will appear here once they\'re uploaded')
                : 'Try selecting a different room or upload files for this room'
              }
            </p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete File</h3>
                <p className="text-sm text-gray-600">This action cannot be undone</p>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700 mb-3">
                Are you sure you want to delete this file?
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-800 text-sm">
                  <strong>"{projectFiles.find(f => f.id === showDeleteConfirm)?.fileName}"</strong> will be permanently removed from the project and storage.
                </p>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteFile(showDeleteConfirm)}
                disabled={deletingFile === showDeleteConfirm}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deletingFile === showDeleteConfirm ? 'Deleting...' : 'Delete File'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilesTab;