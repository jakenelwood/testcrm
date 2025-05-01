import React, { useState } from 'react';
import { DeveloperNoteForm, DeveloperNotesList, DeveloperNoteDetail } from '../../components/DeveloperNotes';
import { Database } from '../../types/database.types';

type DeveloperNote = Database['public']['Tables']['developer_notes']['Row'];

const DeveloperNotesPage: React.FC = () => {
  const [view, setView] = useState<'list' | 'detail' | 'create' | 'edit'>('list');
  const [selectedNote, setSelectedNote] = useState<DeveloperNote | null>(null);
  const [filter, setFilter] = useState({
    category: '',
    status: '',
    search: ''
  });

  const handleSelectNote = (note: DeveloperNote) => {
    setSelectedNote(note);
    setView('detail');
  };

  const handleCreateSuccess = () => {
    setView('list');
  };

  const handleEditSuccess = () => {
    setView('detail');
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilter((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Developer Notes</h1>
        
        {view === 'list' && (
          <button
            onClick={() => setView('create')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Create Note
          </button>
        )}
      </div>

      {view === 'list' && (
        <>
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  id="category"
                  name="category"
                  value={filter.category}
                  onChange={handleFilterChange}
                  className="block w-full border border-gray-300 rounded-md shadow-sm p-2"
                >
                  <option value="">All Categories</option>
                  <option value="bug">Bug</option>
                  <option value="feature">Feature</option>
                  <option value="decision">Decision</option>
                  <option value="architecture">Architecture</option>
                  <option value="refactor">Refactor</option>
                  <option value="performance">Performance</option>
                  <option value="security">Security</option>
                  <option value="documentation">Documentation</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={filter.status}
                  onChange={handleFilterChange}
                  className="block w-full border border-gray-300 rounded-md shadow-sm p-2"
                >
                  <option value="">All Statuses</option>
                  <option value="open">Open</option>
                  <option value="in-progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="documented">Documented</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                  Search
                </label>
                <input
                  type="text"
                  id="search"
                  name="search"
                  value={filter.search}
                  onChange={handleFilterChange}
                  placeholder="Search notes..."
                  className="block w-full border border-gray-300 rounded-md shadow-sm p-2"
                />
              </div>
            </div>
          </div>
          
          <DeveloperNotesList
            filter={filter}
            onSelectNote={handleSelectNote}
          />
        </>
      )}

      {view === 'detail' && selectedNote && (
        <DeveloperNoteDetail
          note={selectedNote}
          onEdit={() => setView('edit')}
          onBack={() => setView('list')}
        />
      )}

      {view === 'create' && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Create Developer Note</h2>
            <button
              onClick={() => setView('list')}
              className="text-blue-600 hover:text-blue-800"
            >
              &larr; Back to list
            </button>
          </div>
          
          <DeveloperNoteForm
            onSuccess={handleCreateSuccess}
            mode="create"
          />
        </div>
      )}

      {view === 'edit' && selectedNote && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Edit Developer Note</h2>
            <button
              onClick={() => setView('detail')}
              className="text-blue-600 hover:text-blue-800"
            >
              &larr; Back to detail
            </button>
          </div>
          
          <DeveloperNoteForm
            initialData={selectedNote}
            onSuccess={handleEditSuccess}
            mode="edit"
          />
        </div>
      )}
    </div>
  );
};

export default DeveloperNotesPage;
