import React, { useEffect, useState } from 'react';
import supabase from '../../utils/supabase/client';
import { Database } from '../../types/database.types';

type DeveloperNote = Database['public']['Tables']['developer_notes']['Row'];

interface DeveloperNotesListProps {
  filter?: {
    category?: string;
    status?: string;
    tag?: string;
    search?: string;
  };
  onSelectNote?: (note: DeveloperNote) => void;
}

const DeveloperNotesList: React.FC<DeveloperNotesListProps> = ({
  filter = {},
  onSelectNote
}) => {
  const [notes, setNotes] = useState<DeveloperNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNotes = async () => {
      setLoading(true);
      setError(null);

      try {
        let query = supabase
          .from<DeveloperNote>('developer_notes')
          .select('*')
          .order('created_at', { ascending: false });

        // Apply filters
        if (filter.category) {
          query = query.eq('category', filter.category);
        }

        if (filter.status) {
          query = query.eq('status', filter.status);
        }

        if (filter.tag) {
          query = query.contains('tags', [filter.tag]);
        }

        if (filter.search) {
          query = query.or(
            `summary.ilike.%${filter.search}%,description.ilike.%${filter.search}%,title.ilike.%${filter.search}%`
          );
        }

        const { data, error: fetchError } = await query;

        if (fetchError) {
          throw fetchError;
        }

        setNotes(data || []);
      } catch (err) {
        setError(`Error fetching developer notes: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchNotes();
  }, [filter]);

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

  if (loading) {
    return <div className="text-center py-4">Loading developer notes...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">
        No developer notes found. Create one to get started!
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {notes.map((note) => (
        <div
          key={note.id}
          className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => onSelectNote && onSelectNote(note)}
        >
          <div className="flex justify-between items-start">
            <h3 className="text-lg font-medium text-gray-900">{note.title}</h3>
            <div className="flex space-x-2">
              <span className={`px-2 py-1 rounded-full text-xs ${getCategoryColor(note.category)}`}>
                {note.category}
              </span>
              {note.priority && (
                <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(note.priority)}`}>
                  {note.priority}
                </span>
              )}
              {note.status && (
                <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(note.status)}`}>
                  {note.status}
                </span>
              )}
            </div>
          </div>

          <p className="mt-2 text-gray-600">{note.summary}</p>

          {note.tags && note.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {note.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="mt-3 text-sm text-gray-500 flex justify-between">
            <div>
              {note.related_feature && (
                <span className="mr-3">Feature: {note.related_feature}</span>
              )}
              {note.related_table && (
                <span>Table: {note.related_table}</span>
              )}
            </div>
            <div>
              {new Date(note.created_at).toLocaleDateString()}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DeveloperNotesList;
