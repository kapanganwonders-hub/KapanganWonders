import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, Upload, Trash2, Loader2, Image as ImageIcon, CheckCircle, XCircle, UploadCloud } from 'lucide-react';
import { storage } from '@/lib/appwrite';
import { client, ID } from '@/lib/appwrite';
import { toast } from 'react-hot-toast';

interface CarouselItem {
  id: string;
  image: string;
  fileId?: string;
}

interface CarouselManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CarouselItem[];
  onItemsUpdate: (items: CarouselItem[]) => void;
  bucketId: string;
}

// Toast notification component
const Toast = ({ message, type }: { message: string; type: 'success' | 'error' }) => (
  <div className="flex items-center space-x-2">
    {type === 'success' ? (
      <CheckCircle className="h-5 w-5 text-green-500" />
    ) : (
      <XCircle className="h-5 w-5 text-red-500" />
    )}
    <span>{message}</span>
  </div>
);

export default function CarouselManagementModal({ 
  isOpen, 
  onClose, 
  items, 
  onItemsUpdate,
  bucketId
}: CarouselManagementModalProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [carouselItems, setCarouselItems] = useState<CarouselItem[]>(items);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  // Fetch the latest files from storage
  const fetchFilesFromStorage = async () => {
    try {
      setIsRefreshing(true);
      const files = await storage.listFiles(bucketId);
      
      // Map storage files to carousel items format
      const storageItems = files.files.map(file => ({
        id: file.$id,
        image: `${client.config.endpoint}/storage/buckets/${bucketId}/files/${file.$id}/view?project=${client.config.project}`,
        fileId: file.$id
      }));
      
      setCarouselItems(storageItems);
      onItemsUpdate(storageItems);
    } catch (error) {
      console.error('Error fetching files from storage:', error);
      toast.error('Failed to refresh files from storage');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Sync with storage when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchFilesFromStorage();
    }
  }, [isOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      setNewImages(prev => [...prev, ...filesArray]);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files).filter(file => 
        file.type.startsWith('image/')
      );
      setNewImages(prev => [...prev, ...filesArray]);
    }
  }, []);

  const removeImage = (index: number) => {
    setNewImages(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFile = async (file: File): Promise<string> => {
    try {
      const response = await storage.createFile(
        bucketId,
        ID.unique(),
        file
      );
      
      // Wait a moment to ensure the file is fully processed
      await new Promise(resolve => setTimeout(resolve, 500));
      return response.$id;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw new Error('Failed to upload file. Please try again.');
    }
  };

  const deleteFile = async (fileId: string): Promise<boolean> => {
    try {
      await storage.deleteFile(bucketId, fileId);
      return true;
    } catch (error) {
      // If the file doesn't exist, we can consider the deletion successful
      if (error instanceof Error && error.message.includes('not found')) {
        console.log('File not found, considering deletion successful');
        return true;
      }
      // For other errors, log and rethrow
      console.error('Error deleting file:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to delete file: ${errorMessage}`);
    }
  };

  const uploadFiles = async (files: File[]) => {
    const loadingToast = toast.loading(`Uploading ${files.length} image(s)...`);
    setIsUploading(true);
    
    try {
      const uploadedItems = [];
      
      for (const file of files) {
        try {
          const fileId = await uploadFile(file);
          const fileUrl = `${client.config.endpoint}/storage/buckets/${bucketId}/files/${fileId}/view?project=${client.config.project}`;
          
          uploadedItems.push({
            id: fileId,
            image: fileUrl,
            fileId: fileId
          });
        } catch (error) {
          console.error(`Error uploading file ${file.name}:`, error);
          toast.error(`Failed to upload ${file.name}`, { id: `upload-error-${file.name}` });
        }
      }
      
      if (uploadedItems.length > 0) {
        const updatedItems = [...carouselItems, ...uploadedItems];
        setCarouselItems(updatedItems);
        onItemsUpdate(updatedItems);
        
        if (uploadedItems.length === 1) {
          toast.success(<Toast message="Image uploaded successfully!" type="success" />, { id: loadingToast });
        } else {
          toast.success(<Toast message={`${uploadedItems.length} images uploaded successfully!`} type="success" />, { id: loadingToast });
        }
      }
      
      setNewImages([]);
      const fileInput = document.getElementById('image-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
    } catch (error) {
      console.error('Error during upload process:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload images';
      toast.error(<Toast message={errorMessage} type="error" />, { id: loadingToast });
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newImages.length === 0) return;
    await uploadFiles(newImages);
  };

  const handleDeleteItem = async (itemId: string, fileId?: string) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    
    const loadingToast = toast.loading('Deleting image...');
    setIsDeleting(itemId);
    
    try {
      if (fileId) {
        await deleteFile(fileId);
      }
      
      // After successful deletion, refresh the list from storage
      // to ensure we're in sync with any external changes
      await fetchFilesFromStorage();
      
      toast.success(<Toast message="Image deleted successfully!" type="success" />, { id: loadingToast });
    } catch (error) {
      console.error('Error deleting carousel item:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete image';
      toast.error(<Toast message={errorMessage} type="error" />, { id: loadingToast });
    } finally {
      setIsDeleting(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleAddItem(e);
  };

  useEffect(() => {
    if (!isOpen) {
      setNewImages([]);
      const fileInput = document.getElementById('image-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    }
  }, [isOpen]);

  return (
    <Transition appear show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={React.Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex justify-between items-center pb-4 border-b">
                  <div className="flex items-center space-x-4">
                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                      Manage Carousel Images
                    </Dialog.Title>
                    <button
                      type="button"
                      onClick={fetchFilesFromStorage}
                      disabled={isRefreshing}
                      className="text-gray-500 hover:text-gray-700 disabled:opacity-50"
                      title="Refresh from storage"
                    >
                      {isRefreshing ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-500"
                    onClick={onClose}
                  >
                    <X className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <div className="mt-6">
                  {/* Add New Image Form */}
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Add New Image</h4>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Images
                        </label>
                        <div 
                          className={`mt-1 border-2 border-dashed rounded-lg p-6 text-center ${isDragging ? 'border-green-500 bg-green-50' : 'border-gray-300'}`}
                          onDragEnter={handleDragOver}
                          onDragOver={handleDragOver}
                          onDragLeave={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsDragging(false);
                          }}
                          onDrop={handleDrop}
                        >
                          <div className="space-y-2">
                            <UploadCloud className={`mx-auto h-12 w-12 ${isDragging ? 'text-green-500' : 'text-gray-400'}`} />
                            <div className="text-sm text-gray-600">
                              <label className="relative cursor-pointer rounded-md font-medium text-green-600 hover:text-green-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-green-500">
                                <span>Upload files</span>
                                <input
                                  id="image-upload"
                                  name="image-upload"
                                  type="file"
                                  className="sr-only"
                                  accept="image/*"
                                  onChange={handleFileChange}
                                  multiple
                                />
                              </label>
                              <p className="pl-1 inline">or drag and drop</p>
                            </div>
                            <p className="text-xs text-gray-500">
                              PNG, JPG, GIF up to 10MB
                            </p>
                          </div>
                        </div>

                        {newImages.length > 0 && (
                          <div className="mt-3 space-y-2">
                            <p className="text-sm font-medium text-gray-700">
                              Selected files ({newImages.length}):
                            </p>
                            <ul className="space-y-2 max-h-40 overflow-y-auto">
                              {newImages.map((file, index) => (
                                <li key={index} className="flex items-center justify-between bg-gray-50 rounded-md p-2">
                                  <div className="flex items-center space-x-2">
                                    <ImageIcon className="h-4 w-4 text-gray-400" />
                                    <span className="text-sm text-gray-700 truncate max-w-xs">
                                      {file.name}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      ({(file.size / 1024 / 1024).toFixed(2)} MB)
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => removeImage(index)}
                                    className="text-red-500 hover:text-red-700"
                                    title="Remove file"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={newImages.length === 0 || isUploading}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isUploading ? (
                            <>
                              <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="-ml-1 mr-2 h-4 w-4" />
                              {newImages.length > 1 ? `Upload ${newImages.length} Images` : 'Upload Image'}
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Current Items List */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Current Images</h4>
                    {carouselItems.length === 0 ? (
                      <div className="text-center py-6 text-gray-500">
                        <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="mt-2 text-sm">No images added yet.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {carouselItems.map((item, index) => (
                          <div key={item.id} className="relative group">
                            <div className="aspect-w-16 aspect-h-9 bg-gray-100 rounded-lg overflow-hidden">
                              <img
                                src={item.image}
                                alt={`Carousel image ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                              <button
                                type="button"
                                onClick={() => handleDeleteItem(item.id, item.fileId)}
                                disabled={isDeleting === item.id}
                                className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                title="Delete image"
                              >
                                {isDeleting === item.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    onClick={onClose}
                  >
                    Done
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
