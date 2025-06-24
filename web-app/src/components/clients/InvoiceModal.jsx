import React, { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const InvoiceModal = ({ isOpen, onClose, onSave, client }) => {
  const today = new Date().toISOString().split('T')[0]; // Today's date in YYYY-MM-DD format

  const [formData, setFormData] = useState({
    invoiceNumber: '',
    date: today,
    dueDate: '',
    amount: '',
    description: '',
    items: [{ description: '', quantity: 1, price: '', total: '' }],
  });

  // Update form when modal opens
  useEffect(() => {
    if (isOpen && client) {
      const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;

      // Calculate default due date (30 days)
      const dueDateObj = new Date();
      dueDateObj.setDate(dueDateObj.getDate() + 30);
      const dueDate = dueDateObj.toISOString().split('T')[0];

      setFormData({
        invoiceNumber,
        date: today,
        dueDate,
        amount: '',
        description: `Invoice for ${client.name}`,
        items: [{ description: 'Service', quantity: 1, price: '', total: '' }],
      });
    }
  }, [isOpen, client, today]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...formData.items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value,
    };

    // Update total if quantity or price changes
    if (field === 'quantity' || field === 'price') {
      const quantity =
        field === 'quantity'
          ? parseFloat(value) || 0
          : parseFloat(updatedItems[index].quantity) || 0;
      const price =
        field === 'price' ? parseFloat(value) || 0 : parseFloat(updatedItems[index].price) || 0;
      updatedItems[index].total = (quantity * price).toFixed(2);
    }

    setFormData((prev) => ({
      ...prev,
      items: updatedItems,
    }));

    // Update total amount
    const total = updatedItems.reduce((sum, item) => sum + (parseFloat(item.total) || 0), 0);
    setFormData((prev) => ({
      ...prev,
      amount: total.toFixed(2),
    }));
  };

  const addItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, { description: '', quantity: 1, price: '', total: '' }],
    }));
  };

  const removeItem = (index) => {
    if (formData.items.length > 1) {
      const updatedItems = formData.items.filter((_, i) => i !== index);

      setFormData((prev) => ({
        ...prev,
        items: updatedItems,
      }));

      // Update total amount
      const total = updatedItems.reduce((sum, item) => sum + (parseFloat(item.total) || 0), 0);
      setFormData((prev) => ({
        ...prev,
        amount: total.toFixed(2),
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Basic validation
    if (!formData.invoiceNumber || !formData.date || !formData.dueDate || !formData.amount) {
      alert('Please fill in all required fields');
      return;
    }

    onSave({
      ...formData,
      clientId: client?.id,
      clientName: client?.name,
    });
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-20" onClose={onClose}>
        <Transition.Child
          as={Fragment}
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
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-lg bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex justify-between items-center mb-4 border-b pb-4">
                  <Dialog.Title as="h3" className="text-lg font-medium text-gray-900">
                    Create Invoice for {client?.name}
                  </Dialog.Title>
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-500"
                    onClick={onClose}
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Invoice Number <span className="text-red-500">*</span>
                      </label>
                      <div className="relative flex items-center">
                        <input
                          type="text"
                          name="invoiceNumber"
                          value={formData.invoiceNumber}
                          onChange={handleChange}
                          className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
                          readOnly
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Total Amount <span className="text-red-500">*</span>
                      </label>
                      <div className="relative flex items-center">
                        <input
                          type="text"
                          name="amount"
                          value={formData.amount}
                          onChange={handleChange}
                          className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
                          readOnly
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Issue Date <span className="text-red-500">*</span>
                      </label>
                      <div className="relative flex items-center">
                        <input
                          type="date"
                          name="date"
                          value={formData.date}
                          onChange={handleChange}
                          className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Due Date <span className="text-red-500">*</span>
                      </label>
                      <div className="relative flex items-center">
                        <input
                          type="date"
                          name="dueDate"
                          value={formData.dueDate}
                          onChange={handleChange}
                          className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mb-5">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <div className="relative flex items-center">
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows="2"
                        className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium text-gray-700">Item Details</h4>
                      <button
                        type="button"
                        onClick={addItem}
                        className="text-sm bg-gray-100 py-1 px-2 rounded text-gray-600 hover:bg-gray-200 transition-colors"
                      >
                        + Add Item
                      </button>
                    </div>

                    <div className="overflow-x-auto border rounded-lg">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th
                              scope="col"
                              className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase"
                            >
                              Description
                            </th>
                            <th
                              scope="col"
                              className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase w-20"
                            >
                              Qty
                            </th>
                            <th
                              scope="col"
                              className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase w-32"
                            >
                              Price
                            </th>
                            <th
                              scope="col"
                              className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase w-32"
                            >
                              Total
                            </th>
                            <th scope="col" className="px-3 py-2 w-12"></th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {formData.items.map((item, index) => (
                            <tr key={index}>
                              <td className="px-3 py-2">
                                <div className="relative flex items-center">
                                  <input
                                    type="text"
                                    value={item.description}
                                    onChange={(e) =>
                                      handleItemChange(index, 'description', e.target.value)
                                    }
                                    className="w-full pl-10 px-3 py-2 border border-gray-300 rounded text-sm"
                                    placeholder="Item description"
                                  />
                                </div>
                              </td>
                              <td className="px-3 py-2">
                                <div className="relative flex items-center">
                                  <input
                                    type="number"
                                    min="1"
                                    value={item.quantity}
                                    onChange={(e) =>
                                      handleItemChange(index, 'quantity', e.target.value)
                                    }
                                    className="w-full pl-10 px-3 py-2 border border-gray-300 rounded text-sm text-right"
                                  />
                                </div>
                              </td>
                              <td className="px-3 py-2">
                                <div className="relative flex items-center">
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={item.price}
                                    onChange={(e) =>
                                      handleItemChange(index, 'price', e.target.value)
                                    }
                                    className="w-full pl-10 px-3 py-2 border border-gray-300 rounded text-sm text-right"
                                  />
                                </div>
                              </td>
                              <td className="px-3 py-2">
                                <div className="relative flex items-center">
                                  <input
                                    type="text"
                                    value={item.total}
                                    readOnly
                                    className="w-full pl-10 px-3 py-2 bg-gray-50 border border-gray-300 rounded text-sm text-right"
                                  />
                                </div>
                              </td>
                              <td className="px-3 py-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => removeItem(index)}
                                  className="text-red-500 hover:text-red-700 disabled:text-gray-400"
                                  disabled={formData.items.length <= 1}
                                >
                                  <XMarkIcon className="h-4 w-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4 border-t">
                    <button
                      type="button"
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                      onClick={onClose}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 rounded-md text-sm font-medium text-white hover:bg-blue-500"
                    >
                      Create Invoice
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default InvoiceModal;