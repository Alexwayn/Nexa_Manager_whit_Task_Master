import React, { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, PlusIcon, PencilIcon, TrashIcon, TagIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';

const ManageCategoriesModal = ({ isOpen, onClose, onSave }) => {
  const { t, ready } = useTranslation('inventory');
  
  const safeT = (key, options = {}, fallback = '') => {
    if (!ready) return fallback;
    try {
      return t(key, options) || fallback;
    } catch (error) {
      console.warn(`Translation key not found: ${key}`);
      return fallback;
    }
  };
  const [categories, setCategories] = useState([
    { id: 1, name: safeT('categories.electronics', {}, 'Electronics'), description: safeT('categories.descriptions.electronics', {}, 'Electronic devices and accessories'), itemCount: 15 },
    { id: 2, name: safeT('categories.clothing', {}, 'Clothing'), description: safeT('categories.descriptions.clothing', {}, 'Apparel and fashion items'), itemCount: 8 },
    { id: 3, name: safeT('categories.books', {}, 'Books'), description: safeT('categories.descriptions.books', {}, 'Books and educational materials'), itemCount: 12 },
    { id: 4, name: safeT('categories.homeGarden', {}, 'Home & Garden'), description: safeT('categories.descriptions.homeGarden', {}, 'Home improvement and garden supplies'), itemCount: 6 },
    { id: 5, name: safeT('categories.sports', {}, 'Sports'), description: safeT('categories.descriptions.sports', {}, 'Sports equipment and accessories'), itemCount: 4 },
    { id: 6, name: safeT('categories.automotive', {}, 'Automotive'), description: safeT('categories.descriptions.automotive', {}, 'Car parts and automotive supplies'), itemCount: 3 },
    { id: 7, name: safeT('categories.healthBeauty', {}, 'Health & Beauty'), description: safeT('categories.descriptions.healthBeauty', {}, 'Health and beauty products'), itemCount: 7 },
    { id: 8, name: safeT('categories.toysGames', {}, 'Toys & Games'), description: safeT('categories.descriptions.toysGames', {}, 'Toys and gaming products'), itemCount: 2 }
  ]);
  const [newCategory, setNewCategory] = useState({ name: '', description: '' });
  const [editingCategory, setEditingCategory] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [errors, setErrors] = useState({});

  const handleAddCategory = () => {
    if (!newCategory.name.trim()) {
      setErrors({ name: safeT('modals.manageCategories.errors.nameRequired', {}, 'Category name is required') });
      return;
    }

    if (categories.some(cat => cat.name.toLowerCase() === newCategory.name.toLowerCase())) {
      setErrors({ name: safeT('modals.manageCategories.errors.nameExists', {}, 'Category already exists') });
      return;
    }

    const category = {
      id: Date.now(),
      name: newCategory.name.trim(),
      description: newCategory.description.trim(),
      itemCount: 0
    };

    setCategories(prev => [...prev, category]);
    setNewCategory({ name: '', description: '' });
    setShowAddForm(false);
    setErrors({});
  };

  const handleEditCategory = (category) => {
    setEditingCategory({ ...category });
  };

  const handleUpdateCategory = () => {
    if (!editingCategory.name.trim()) {
      setErrors({ editName: safeT('modals.manageCategories.errors.nameRequired', {}, 'Category name is required') });
      return;
    }

    if (categories.some(cat => cat.id !== editingCategory.id && cat.name.toLowerCase() === editingCategory.name.toLowerCase())) {
      setErrors({ editName: safeT('modals.manageCategories.errors.nameExists', {}, 'Category already exists') });
      return;
    }

    setCategories(prev => prev.map(cat => 
      cat.id === editingCategory.id 
        ? { ...editingCategory, name: editingCategory.name.trim(), description: editingCategory.description.trim() }
        : cat
    ));
    setEditingCategory(null);
    setErrors({});
  };

  const handleDeleteCategory = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    if (category.itemCount > 0) {
      alert(safeT('modals.manageCategories.messages.cannotDelete', { name: category.name, count: category.itemCount }, `Cannot delete "${category.name}" because it contains ${category.itemCount} items. Please move or delete the items first.`));
      return;
    }

    if (confirm(safeT('modals.manageCategories.messages.confirmDelete', { name: category.name }, `Are you sure you want to delete the category "${category.name}"?`))) {
      setCategories(prev => prev.filter(cat => cat.id !== categoryId));
    }
  };

  const handleSave = () => {
    onSave(categories);
    onClose();
  };

  const handleClose = () => {
    setNewCategory({ name: '', description: '' });
    setEditingCategory(null);
    setShowAddForm(false);
    setErrors({});
    onClose();
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl sm:p-6">
                <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    onClick={handleClose}
                  >
                    <span className="sr-only">{safeT('common.close', {}, 'Close')}</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <div className="sm:flex sm:items-start">
                  <div className="w-full">
                    <Dialog.Title as="h3" className="text-page-title text-gray-900 mb-6">
                      {safeT('modals.manageCategories.title', {}, 'Manage Categories')}
                    </Dialog.Title>

                    {/* Add New Category Button */}
                    <div className="mb-6">
                      {!showAddForm ? (
                        <button
                          onClick={() => setShowAddForm(true)}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-button-text rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <PlusIcon className="h-4 w-4 mr-2" />
                          {safeT('modals.manageCategories.buttons.addNew', {}, 'Add New Category')}
                        </button>
                      ) : (
                        <div className="bg-gray-50 p-4 rounded-lg border">
                          <h4 className="text-card-title text-gray-900 mb-3">{safeT('modals.manageCategories.forms.addTitle', {}, 'Add New Category')}</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-form-label text-gray-700 mb-1">
                                {safeT('modals.manageCategories.fields.name', {}, 'Category Name')} *
                              </label>
                              <input
                                type="text"
                                value={newCategory.name}
                                onChange={(e) => {
                                  setNewCategory(prev => ({ ...prev, name: e.target.value }));
                                  if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
                                }}
                                className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                                  errors.name ? 'border-red-300' : ''
                                }`}
                                placeholder={safeT('modals.manageCategories.placeholders.name', {}, 'Enter category name')}
                              />
                              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                            </div>
                            <div>
                              <label className="block text-form-label text-gray-700 mb-1">
                                {safeT('modals.manageCategories.fields.description', {}, 'Description')}
                              </label>
                              <input
                                type="text"
                                value={newCategory.description}
                                onChange={(e) => setNewCategory(prev => ({ ...prev, description: e.target.value }))}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                placeholder={safeT('modals.manageCategories.placeholders.description', {}, 'Enter description (optional)')}
                              />
                            </div>
                          </div>
                          <div className="flex justify-end space-x-3 mt-4">
                            <button
                              onClick={() => {
                                setShowAddForm(false);
                                setNewCategory({ name: '', description: '' });
                                setErrors({});
                              }}
                              className="px-3 py-2 border border-gray-300 rounded-md text-button-text text-gray-700 bg-white hover:bg-gray-50"
                            >
                              {safeT('modals.manageCategories.buttons.cancel', {}, 'Cancel')}
                            </button>
                            <button
                              onClick={handleAddCategory}
                              className="px-3 py-2 border border-transparent rounded-md text-button-text text-white bg-blue-600 hover:bg-blue-700"
                            >
                              {safeT('modals.manageCategories.buttons.add', {}, 'Add Category')}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Categories List */}
                    <div className="bg-white shadow overflow-hidden sm:rounded-md">
                      <ul className="divide-y divide-gray-200">
                        {categories.map((category) => (
                          <li key={category.id}>
                            {editingCategory && editingCategory.id === category.id ? (
                              <div className="px-4 py-4 bg-gray-50">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                  <div>
                                    <label className="block text-form-label text-gray-700 mb-1">
                                      {safeT('modals.manageCategories.fields.name', {}, 'Category Name')} *
                                    </label>
                                    <input
                                      type="text"
                                      value={editingCategory.name}
                                      onChange={(e) => {
                                        setEditingCategory(prev => ({ ...prev, name: e.target.value }));
                                        if (errors.editName) setErrors(prev => ({ ...prev, editName: '' }));
                                      }}
                                      className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                                        errors.editName ? 'border-red-300' : ''
                                      }`}
                                    />
                                    {errors.editName && <p className="mt-1 text-sm text-red-600">{errors.editName}</p>}
                                  </div>
                                  <div>
                                    <label className="block text-form-label text-gray-700 mb-1">
                                      {safeT('modals.manageCategories.fields.description', {}, 'Description')}
                                    </label>
                                    <input
                                      type="text"
                                      value={editingCategory.description}
                                      onChange={(e) => setEditingCategory(prev => ({ ...prev, description: e.target.value }))}
                                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                    />
                                  </div>
                                </div>
                                <div className="flex justify-end space-x-3">
                                  <button
                                    onClick={() => {
                                      setEditingCategory(null);
                                      setErrors({});
                                    }}
                                    className="px-3 py-2 border border-gray-300 rounded-md text-button-text text-gray-700 bg-white hover:bg-gray-50"
                                  >
                                    {safeT('modals.manageCategories.buttons.cancel', {}, 'Cancel')}
                                  </button>
                                  <button
                                    onClick={handleUpdateCategory}
                                    className="px-3 py-2 border border-transparent rounded-md text-button-text text-white bg-blue-600 hover:bg-blue-700"
                                  >
                                    {safeT('modals.manageCategories.buttons.saveChanges', {}, 'Save Changes')}
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="px-4 py-4 flex items-center justify-between">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0">
                                    <TagIcon className="h-8 w-8 text-gray-400" />
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900">{category.name}</div>
                                    <div className="text-sm text-gray-500">{category.description}</div>
                                    <div className="text-xs text-gray-400 mt-1">
                                      {category.itemCount} {category.itemCount === 1 ? safeT('modals.manageCategories.itemCount.singular', {}, 'item') : safeT('modals.manageCategories.itemCount.plural', {}, 'items')}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => handleEditCategory(category)}
                                    className="p-2 text-gray-400 hover:text-gray-600"
                                    title={safeT('modals.manageCategories.tooltips.edit', {}, 'Edit category')}
                                  >
                                    <PencilIcon className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteCategory(category.id)}
                                    className="p-2 text-gray-400 hover:text-red-600"
                                    title={safeT('modals.manageCategories.tooltips.delete', {}, 'Delete category')}
                                    disabled={category.itemCount > 0}
                                  >
                                    <TrashIcon className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Form Actions */}
                    <div className="flex justify-end space-x-3 pt-6">
                      <button
                        type="button"
                        onClick={handleClose}
                        className="rounded-md border border-gray-300 bg-white px-4 py-2 text-button-text text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      >
                        {safeT('modals.manageCategories.buttons.cancel', {}, 'Cancel')}
                      </button>
                      <button
                        type="button"
                        onClick={handleSave}
                        className="rounded-md border border-transparent bg-blue-600 px-4 py-2 text-button-text text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      >
                        {safeT('modals.manageCategories.buttons.save', {}, 'Save Changes')}
                      </button>
                    </div>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default ManageCategoriesModal;