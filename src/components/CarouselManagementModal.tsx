import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, Upload, Trash2, Loader2, Image as ImageIcon, CheckCircle, XCircle, UploadCloud } from 'lucide-react';
import { storage, ID, getImageUrl } from '@/lib/appwrite';

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

interface AlertType {
  type: 'success' | 'error' | 'info';
  message: string;
}

// Internal Toast component for modal
const Toast = ({ alert, onClose }: { alert: AlertType; onClose: () => void }) => {
  const colors = {
    success: { border: 'border-green-200', icon: 'text-green-500', text: 'text-green-800' },
    error: { border: 'border-red-200', icon: 'text-red-500', text: 'text-red-800' },
    info: { border: 'border-blue-200', icon: 'text-blue-500', text: 'text-blue-800' },
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000); // auto-dismiss after 4s
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`flex items-center justify-between px-4 py-2 rounded shadow-md bg-white ${colors[alert.type].border} w-full max-w-md mx-auto mb-2`}>
      <div className="flex items-center space-x-2">
        {alert.type === 'success' && <CheckCircle className={`h-5 w-5 ${colors.success.icon}`} />}
        {alert.type === 'error' && <XCircle className={`h-5 w-5 ${colors.error.icon}`} />}
        {alert.type === 'info' && <Loader2 className={`h-5 w-5 animate-spin ${colors.info.icon}`} />}
        <span className={`text-sm ${colors[alert.type].text}`}>{alert.message}</span>
      </div>
      <button onClick={onClose} className="text-gray-600 hover:text-gray-800">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

const CarouselManagementModal = React.forwardRef<HTMLDivElement, CarouselManagementModalProps>(({
  isOpen,
  onClose,
  items,
  onItemsUpdate,
  bucketId
}, ref) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [carouselItems, setCarouselItems] = useState<CarouselItem[]>(items);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{id: string, fileId?: string} | null>(null);
  const [alerts, setAlerts] = useState<AlertType[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (items && items.length > 0) {
      const updatedItems = items.map(item => ({
        ...item,
        image: item.fileId ? getImageUrl(item.fileId) : item.image
      }));
      setCarouselItems(updatedItems);
    } else {
      setCarouselItems(items);
    }
  }, [items]);

  const addAlert = (alert: AlertType) => {
    setAlerts(prev => [alert, ...prev]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setNewImages(Array.from(e.target.files));
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setIsDragging(true);
    else if (e.type === 'dragleave') setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setNewImages(Array.from(e.dataTransfer.files));
      e.dataTransfer.clearData();
    }
  }, []);

  const removeImage = (index: number) => {
    setNewImages(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFile = async (file: File): Promise<{fileId: string, imageUrl: string}> => {
    try {
      const fileId = ID.unique();
      await storage.createFile(bucketId, fileId, file);
      return { fileId, imageUrl: getImageUrl(fileId) };
    } catch (error) {
      throw error;
    }
  };

  const deleteFile = async (fileId: string) => {
    try {
      await storage.deleteFile(bucketId, fileId);
      return true;
    } catch (error) {
      return false;
    }
  };

  const uploadFiles = async (files: File[]) => {
    const uploadedItems: CarouselItem[] = [];

    for (const file of files) {
      try {
        addAlert({ type: 'info', message: `Uploading ${file.name}...` });
        const { fileId, imageUrl } = await uploadFile(file);
        uploadedItems.push({ id: ID.unique(), image: imageUrl, fileId });
        addAlert({ type: 'success', message: `${file.name} uploaded successfully.` });
      } catch (error) {
        console.error(error);
        addAlert({ type: 'error', message: `Failed to upload ${file.name}` });
      }
    }
    return uploadedItems;
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newImages.length === 0) return;

    setIsUploading(true);
    try {
      const uploadedItems = await uploadFiles(newImages);
      if (uploadedItems.length > 0) {
        const updatedItems = [...carouselItems, ...uploadedItems];
        setCarouselItems(updatedItems);
        onItemsUpdate(updatedItems);
        setNewImages([]);
        const fileInput = document.getElementById('image-upload') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      }
    } catch (error) {
      console.error(error);
      addAlert({ type: 'error', message: 'Failed to upload images' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteItem = (itemId: string, fileId?: string) => {
    setItemToDelete({ id: itemId, fileId });
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(itemToDelete.id);

    try {
      if (itemToDelete.fileId) await deleteFile(itemToDelete.fileId);
      const updatedItems = carouselItems.filter(item => item.id !== itemToDelete.id);
      setCarouselItems(updatedItems);
      onItemsUpdate(updatedItems);
      addAlert({ type: 'success', message: 'Image deleted successfully.' });
    } catch (error) {
      console.error(error);
      addAlert({ type: 'error', message: 'Failed to delete image.' });
    } finally {
      setItemToDelete(null);
      setShowDeleteConfirm(false);
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
    <Transition.Root show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="fixed inset-0 z-[9999]" onClose={onClose} ref={ref}>
        {/* Overlay */}
        <Transition.Child as={React.Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100"
          leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child as={React.Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100"
              leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
              <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all relative">

                {/* Toast Notifications */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[10000] flex flex-col space-y-2 w-full max-w-md">
                  {alerts.map((alert, idx) => (
                    <Toast key={idx} alert={alert} onClose={() => setAlerts(prev => prev.filter((_, i) => i !== idx))} />
                  ))}
                </div>

                {/* Header */}
                <div className="flex justify-between items-center pb-4 border-b">
                  <Dialog.Title className="text-lg font-medium leading-6 text-gray-900">Manage Carousel Images</Dialog.Title>
                  <button type="button" className="text-gray-400 hover:text-gray-500" onClick={onClose}>
                    <X className="h-6 w-6" />
                  </button>
                </div>

                {/* Main Content */}
                <div className="mt-6">
                  {/* Add New Image Form */}
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Add New Image</h4>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Images</label>
                        <div 
                          className={`mt-1 border-2 border-dashed rounded-lg p-6 text-center ${
                            isDragging ? 'border-green-500 bg-green-50' : 'border-gray-300'
                          }`}
                          onDragEnter={handleDragOver}
                          onDragOver={handleDragOver}
                          onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }}
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
                            <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                          </div>
                        </div>

                        {newImages.length > 0 && (
                          <div className="mt-3 space-y-2">
                            <p className="text-sm font-medium text-gray-700">Selected files ({newImages.length}):</p>
                            <ul className="space-y-2 max-h-40 overflow-y-auto">
                              {newImages.map((file, index) => (
                                <li key={index} className="flex items-center justify-between bg-white rounded-md p-2 border">
                                  <div className="flex items-center space-x-2">
                                    <ImageIcon className="h-4 w-4 text-gray-400" />
                                    <span className="text-sm text-gray-700 truncate max-w-xs">{file.name}</span>
                                    <span className="text-xs text-gray-500">
                                      ({(file.size / 1024 / 1024).toFixed(2)} MB)
                                    </span>
                                  </div>
                                  <button 
                                    type="button" 
                                    onClick={() => removeImage(index)}
                                    className="text-gray-400 hover:text-red-500"
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

                  {/* Current Images List */}
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
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.onerror = null;
                                  target.src = '/placeholder-image.jpg';
                                }}
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

                {/* Delete Confirmation Dialog */}
                {showDeleteConfirm && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium text-gray-900">Delete Image</h3>
                        <button type="button" className="text-gray-400 hover:text-gray-500" onClick={() => setShowDeleteConfirm(false)}>
                          <X className="h-6 w-6" />
                        </button>
                      </div>
                      <p className="text-sm text-gray-500 mb-6">Are you sure you want to delete this image? This action cannot be undone.</p>
                      <div className="flex justify-end space-x-3">
                        <button type="button" className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
                        <button type="button" className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700" onClick={confirmDelete}>Delete</button>
                      </div>
                    </div>
                  </div>
                )}

              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
});

CarouselManagementModal.displayName = 'CarouselManagementModal';
export default CarouselManagementModal;
