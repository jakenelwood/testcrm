import React from 'react';
import { Database } from '../../types/database.types';

type DeveloperNote = Database['public']['Tables']['developer_notes']['Row'];

interface DeveloperNoteDetailProps {
  note: DeveloperNote;
  onEdit?: () => void;
  onBack?: () => void;
}

const DeveloperNoteDetail: React.FC<DeveloperNoteDetailProps> = ({
  note,
  onEdit,
  onBack
}) => {
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      bug: 'bg-red-100 text-red-800',
      feature: 'bg-green-100 text-green-800',
      decision: 'bg-blue-100 text-blue-800',
      architecture: 'bg-purple-100 text-purple-800',
      refactor: 'bg-yellow-100 text-yellow-800',
      performance: 'bg-indigo-100 text-indigo-800',
      security: 'bg-pink-100 text-pink-800',
      documentation: 'bg-gray-100 text-gray-800'
    };

    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800'
    };

    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      open: 'bg-blue-100 text-blue-800',
      'in-progress': 'bg-yellow-100 text-yellow-800',
      resolved: 'bg-green-100 text-green-800',
      documented: 'bg-purple-100 text-purple-800'
    };

    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-start">
        <button
          onClick={onBack}
          className="text-blue-600 hover:text-blue-800"
        >
          &larr; Back to list
        </button>
        
        {onEdit && (
          <button
            onClick={onEdit}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Edit Note
          </button>
        )}
      </div>
      
      <div className="mt-6">
        <h1 className="text-2xl font-bold text-gray-900">{note.title}</h1>
        
        <div className="mt-2 flex flex-wrap gap-2">
          <span className={`px-2.5 py-0.5 rounded-full text-sm font-medium ${getCategoryColor(note.category)}`}>
            {note.category}
          </span>
          
          {note.priority && (
            <span className={`px-2.5 py-0.5 rounded-full text-sm font-medium ${getPriorityColor(note.priority)}`}>
              {note.priority}
            </span>
          )}
          
          {note.status && (
            <span className={`px-2.5 py-0.5 rounded-full text-sm font-medium ${getStatusColor(note.status)}`}>
              {note.status}
            </span>
          )}
        </div>
        
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-500">
          <div>
            <span className="font-medium text-gray-700">Created by:</span> {note.created_by}
          </div>
          
          <div>
            <span className="font-medium text-gray-700">Created at:</span> {formatDate(note.created_at)}
          </div>
          
          {note.assigned_to && (
            <div>
              <span className="font-medium text-gray-700">Assigned to:</span> {note.assigned_to}
            </div>
          )}
          
          {note.updated_at && (
            <div>
              <span className="font-medium text-gray-700">Updated at:</span> {formatDate(note.updated_at)}
            </div>
          )}
          
          {note.resolved_at && (
            <div>
              <span className="font-medium text-gray-700">Resolved at:</span> {formatDate(note.resolved_at)}
            </div>
          )}
        </div>
        
        <div className="mt-6">
          <h2 className="text-lg font-medium text-gray-900">Summary</h2>
          <p className="mt-2 text-gray-700">{note.summary}</p>
        </div>
        
        {note.description && (
          <div className="mt-6">
            <h2 className="text-lg font-medium text-gray-900">Description</h2>
            <p className="mt-2 text-gray-700 whitespace-pre-line">{note.description}</p>
          </div>
        )}
        
        {note.solution && (
          <div className="mt-6">
            <h2 className="text-lg font-medium text-gray-900">Solution</h2>
            <p className="mt-2 text-gray-700 whitespace-pre-line">{note.solution}</p>
          </div>
        )}
        
        {note.tags && note.tags.length > 0 && (
          <div className="mt-6">
            <h2 className="text-lg font-medium text-gray-900">Tags</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {note.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-gray-100 text-gray-800"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
        
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {note.related_table && (
            <div>
              <h2 className="text-lg font-medium text-gray-900">Related Table(s)</h2>
              <p className="mt-2 text-gray-700">{note.related_table}</p>
            </div>
          )}
          
          {note.related_feature && (
            <div>
              <h2 className="text-lg font-medium text-gray-900">Related Feature</h2>
              <p className="mt-2 text-gray-700">{note.related_feature}</p>
            </div>
          )}
        </div>
        
        {note.related_files && note.related_files.length > 0 && (
          <div className="mt-6">
            <h2 className="text-lg font-medium text-gray-900">Related Files</h2>
            <ul className="mt-2 list-disc list-inside text-gray-700">
              {note.related_files.map((file) => (
                <li key={file}>{file}</li>
              ))}
            </ul>
          </div>
        )}
        
        {note.technical_details && Object.keys(note.technical_details).length > 0 && (
          <div className="mt-6">
            <h2 className="text-lg font-medium text-gray-900">Technical Details</h2>
            <pre className="mt-2 p-4 bg-gray-50 rounded-md overflow-x-auto text-sm">
              {JSON.stringify(note.technical_details, null, 2)}
            </pre>
          </div>
        )}
        
        {note.decision_context && Object.keys(note.decision_context).length > 0 && (
          <div className="mt-6">
            <h2 className="text-lg font-medium text-gray-900">Decision Context</h2>
            <pre className="mt-2 p-4 bg-gray-50 rounded-md overflow-x-auto text-sm">
              {JSON.stringify(note.decision_context, null, 2)}
            </pre>
          </div>
        )}
        
        {note.implementation_notes && Object.keys(note.implementation_notes).length > 0 && (
          <div className="mt-6">
            <h2 className="text-lg font-medium text-gray-900">Implementation Notes</h2>
            <pre className="mt-2 p-4 bg-gray-50 rounded-md overflow-x-auto text-sm">
              {JSON.stringify(note.implementation_notes, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeveloperNoteDetail;
