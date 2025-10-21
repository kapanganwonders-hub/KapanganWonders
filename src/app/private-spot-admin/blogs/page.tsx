'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  doc, 
  updateDoc, 
  deleteDoc,
  orderBy
} from 'firebase/firestore';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X,
  Calendar,
  Eye,
  Image as ImageIcon
} from 'lucide-react';

export default function BlogsPage() {
  const { privateSpotAdminData } = useAuth();
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingBlog, setEditingBlog] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    category: 'Travel Tips',
    imageUrl: '',
    tags: '',
  });

  useEffect(() => {
    fetchBlogs();
  }, [privateSpotAdminData]);

  const fetchBlogs = async () => {
    if (!privateSpotAdminData?.uid) return;

    try {
      const blogsQuery = query(
        collection(db, 'blogs'),
        where('authorId', '==', privateSpotAdminData.uid),
        orderBy('createdAt', 'desc')
      );
      const blogsSnapshot = await getDocs(blogsQuery);
      const blogsData = blogsSnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      }));
      setBlogs(blogsData);
    } catch (error) {
      console.error('Error fetching blogs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddBlog = async () => {
    if (!formData.title || !formData.content) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const tagsArray = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      
      await addDoc(collection(db, 'blogs'), {
        title: formData.title,
        content: formData.content,
        excerpt: formData.excerpt || formData.content.substring(0, 150) + '...',
        category: formData.category,
        imageUrl: formData.imageUrl,
        tags: tagsArray,
        authorId: privateSpotAdminData?.uid,
        authorName: privateSpotAdminData?.displayName,
        businessName: privateSpotAdminData?.businessName,
        status: 'Published',
        views: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      alert('Blog post published successfully!');
      setShowAddForm(false);
      setFormData({
        title: '',
        content: '',
        excerpt: '',
        category: 'Travel Tips',
        imageUrl: '',
        tags: '',
      });
      fetchBlogs();
    } catch (error) {
      console.error('Error adding blog:', error);
      alert('Failed to publish blog post');
    }
  };

  const handleEditBlog = (blog: any) => {
    setEditingBlog(blog.id);
    setFormData({
      title: blog.title || '',
      content: blog.content || '',
      excerpt: blog.excerpt || '',
      category: blog.category || 'Travel Tips',
      imageUrl: blog.imageUrl || '',
      tags: blog.tags ? blog.tags.join(', ') : '',
    });
  };

  const handleUpdateBlog = async () => {
    if (!editingBlog) return;

    try {
      const tagsArray = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      
      await updateDoc(doc(db, 'blogs', editingBlog), {
        title: formData.title,
        content: formData.content,
        excerpt: formData.excerpt || formData.content.substring(0, 150) + '...',
        category: formData.category,
        imageUrl: formData.imageUrl,
        tags: tagsArray,
        updatedAt: new Date().toISOString(),
      });

      alert('Blog post updated successfully!');
      setEditingBlog(null);
      setFormData({
        title: '',
        content: '',
        excerpt: '',
        category: 'Travel Tips',
        imageUrl: '',
        tags: '',
      });
      fetchBlogs();
    } catch (error) {
      console.error('Error updating blog:', error);
      alert('Failed to update blog post');
    }
  };

  const handleDeleteBlog = async (blogId: string) => {
    if (!window.confirm('Are you sure you want to delete this blog post?')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'blogs', blogId));
      alert('Blog post deleted successfully!');
      fetchBlogs();
    } catch (error) {
      console.error('Error deleting blog:', error);
      alert('Failed to delete blog post');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Blog Posts</h1>
          <p className="text-gray-600 mt-1">Share stories and experiences with visitors</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
        >
          <Plus size={20} />
          New Blog Post
        </button>
      </div>

      {/* Add/Edit Form */}
      {(showAddForm || editingBlog) && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm p-6"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">
              {editingBlog ? 'Edit Blog Post' : 'New Blog Post'}
            </h2>
            <button
              onClick={() => {
                setShowAddForm(false);
                setEditingBlog(null);
                setFormData({
                  title: '',
                  content: '',
                  excerpt: '',
                  category: 'Travel Tips',
                  imageUrl: '',
                  tags: '',
                });
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={24} />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                placeholder="Blog post title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content <span className="text-red-500">*</span>
              </label>
              <textarea
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                rows={10}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                placeholder="Write your blog post content here..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Excerpt (Optional)
              </label>
              <textarea
                name="excerpt"
                value={formData.excerpt}
                onChange={handleInputChange}
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                placeholder="Short summary of your blog post (auto-generated if left empty)"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                >
                  <option value="Travel Tips">Travel Tips</option>
                  <option value="Local Culture">Local Culture</option>
                  <option value="Food & Dining">Food & Dining</option>
                  <option value="Activities">Activities</option>
                  <option value="Events">Events</option>
                  <option value="News">News</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Featured Image URL
                </label>
                <input
                  type="text"
                  name="imageUrl"
                  value={formData.imageUrl}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                placeholder="e.g., travel, kapangan, tourism"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={() => {
                setShowAddForm(false);
                setEditingBlog(null);
              }}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={editingBlog ? handleUpdateBlog : handleAddBlog}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
            >
              <Save size={20} />
              {editingBlog ? 'Update' : 'Publish'} Post
            </button>
          </div>
        </motion.div>
      )}

      {/* Blogs List */}
      <div className="grid grid-cols-1 gap-6">
        {blogs.length > 0 ? (
          blogs.map((blog) => (
            <motion.div
              key={blog.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition"
            >
              <div className="md:flex">
                {blog.imageUrl ? (
                  <img
                    src={blog.imageUrl}
                    alt={blog.title}
                    className="md:w-64 h-48 object-cover"
                  />
                ) : (
                  <div className="md:w-64 h-48 bg-gray-200 flex items-center justify-center">
                    <ImageIcon className="text-gray-400" size={48} />
                  </div>
                )}

                <div className="flex-1 p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-3 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full">
                          {blog.category}
                        </span>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Eye size={16} />
                          {blog.views || 0} views
                        </div>
                      </div>
                      <h3 className="text-2xl font-bold text-gray-800 mb-2">{blog.title}</h3>
                      <p className="text-gray-600 mb-3 line-clamp-2">{blog.excerpt || blog.content}</p>
                      
                      {blog.tags && blog.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {blog.tags.map((tag: string, index: number) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Calendar size={16} />
                        {new Date(blog.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleEditBlog(blog)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteBlog(blog.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm">
            <FileText className="mx-auto text-gray-400 mb-4" size={64} />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No Blog Posts Yet</h3>
            <p className="text-gray-600 mb-4">Start sharing your stories and experiences</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
            >
              Write Your First Post
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
