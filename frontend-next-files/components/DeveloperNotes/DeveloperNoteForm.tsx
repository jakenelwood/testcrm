import React, { useState } from 'react';
import supabase from '../../utils/supabase/client';
import { Database } from '../../types/database.types';

type DeveloperNote = Database['public']['Tables']['developer_notes']['Insert'];

interface DeveloperNoteFormProps {
  onSuccess?: () => void;
  initialData?: Partial<DeveloperNote>;
  mode?: 'create' | 'edit';
}

const CATEGORIES = [
  'bug',
  'feature',
  'decision',
  'architecture',
  'refactor',
  'performance',
  'security',
  'documentation'
];

const PRIORITIES = ['low', 'medium', 'high', 'critical'];
const STATUSES = ['open', 'in-progress', 'resolved', 'documented'];

const DeveloperNoteForm: React.FC<DeveloperNoteFormProps> = ({
  onSuccess,
  initialData = {},
  mode = 'create'
}) => {
  const [formData, setFormData] = useState<Partial<DeveloperNote>>({
    title: '',
    category: 'decision',
    tags: [],
    priority: 'medium',
    status: 'open',
    summary: '',
    description: '',
    solution: '',
    related_table: '',
    related_feature: '',
    related_files: [],
    technical_details: {},
    decision_context: {},
    implementation_notes: {},
    ...initialData
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState('');

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleJsonChange = (
    field: 'technical_details' | 'decision_context' | 'implementation_notes',
    value: string
  ) => {
    try {
      const parsedJson = value.trim() ? JSON.parse(value) : {};
      setFormData((prev) => ({ ...prev, [field]: parsedJson }));
      setError(null);
    } catch (err) {
      setError(`Invalid JSON in ${field}: ${err.message}`);
    }
  };

  const handleTagsChange = () => {
    if (tagInput.trim()) {
      const newTags = [...(formData.tags || []), tagInput.trim()];
      setFormData((prev) => ({ ...prev, tags: newTags }));
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    const newTags = (formData.tags || []).filter((t) => t !== tag);
    setFormData((prev) => ({ ...prev, tags: newTags }));
  };

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.value.split(',').map((file) => file.trim()).filter(Boolean);
    setFormData((prev) => ({ ...prev, related_files: files }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Get the current user
      const user = supabase.auth.user();

      // Prepare the data
      const noteData: DeveloperNote = {
        ...formData as DeveloperNote,
        created_by: user?.id || 'system'
      };

      // Submit to Supabase
      let result;
      if (mode === 'create') {
        result = await supabase.from('developer_notes').insert(noteData);
      } else {
        const { id, ...updateData } = noteData;
        result = await supabase
          .from('developer_notes')
          .update(updateData)
          .eq('id', id);
      }

      if (result.error) {
        throw result.error;
      }

      // Call the success callback
      if (onSuccess) {
        onSuccess();
      }

      // Reset the form if creating a new note
      if (mode === 'create') {
        setFormData({
          title: '',
          category: 'decision',
          tags: [],
          priority: 'medium',
          status: 'open',
          summary: '',
          description: '',
          solution: '',
          related_table: '',
          related_feature: '',
          related_files: [],
          technical_details: {},
          decision_context: {},
          implementation_notes: {}
        });
      }
    } catch (err) {
      setError(`Error saving developer note: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Title */}
        <div className="col-span-2">
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Title *
          </label>
          <input
            type="text"
            name="title"
            id="title"
            required
            value={formData.title || ''}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          />
        </div>

        {/* Category */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700">
            Category *
          </label>
          <select
            name="category"
            id="category"
            required
            value={formData.category || ''}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          >
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Priority */}
        <div>
          <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
            Priority
          </label>
          <select
            name="priority"
            id="priority"
            value={formData.priority || ''}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          >
            {PRIORITIES.map((priority) => (
              <option key={priority} value={priority}>
                {priority.charAt(0).toUpperCase() + priority.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Status */}
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700">
            Status
          </label>
          <select
            name="status"
            id="status"
            value={formData.status || ''}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          >
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Tags */}
        <div>
          <label htmlFor="tags" className="block text-sm font-medium text-gray-700">
            Tags
          </label>
          <div className="flex">
            <input
              type="text"
              id="tags"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleTagsChange())}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              placeholder="Add a tag and press Enter"
            />
            <button
              type="button"
              onClick={handleTagsChange}
              className="ml-2 mt-1 px-4 py-2 bg-blue-500 text-white rounded-md"
            >
              Add
            </button>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {(formData.tags || []).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="ml-1 text-blue-500 hover:text-blue-700"
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="col-span-2">
          <label htmlFor="summary" className="block text-sm font-medium text-gray-700">
            Summary *
          </label>
          <input
            type="text"
            name="summary"
            id="summary"
            required
            value={formData.summary || ''}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          />
        </div>

        {/* Description */}
        <div className="col-span-2">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            name="description"
            id="description"
            rows={4}
            value={formData.description || ''}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          />
        </div>

        {/* Solution */}
        <div className="col-span-2">
          <label htmlFor="solution" className="block text-sm font-medium text-gray-700">
            Solution
          </label>
          <textarea
            name="solution"
            id="solution"
            rows={4}
            value={formData.solution || ''}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          />
        </div>

        {/* Related Table */}
        <div>
          <label htmlFor="related_table" className="block text-sm font-medium text-gray-700">
            Related Table(s)
          </label>
          <input
            type="text"
            name="related_table"
            id="related_table"
            value={formData.related_table || ''}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            placeholder="e.g., leads, clients"
          />
        </div>

        {/* Related Feature */}
        <div>
          <label htmlFor="related_feature" className="block text-sm font-medium text-gray-700">
            Related Feature
          </label>
          <input
            type="text"
            name="related_feature"
            id="related_feature"
            value={formData.related_feature || ''}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            placeholder="e.g., authentication, reporting"
          />
        </div>

        {/* Related Files */}
        <div className="col-span-2">
          <label htmlFor="related_files" className="block text-sm font-medium text-gray-700">
            Related Files
          </label>
          <input
            type="text"
            name="related_files"
            id="related_files"
            value={(formData.related_files || []).join(', ')}
            onChange={handleFilesChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            placeholder="e.g., components/LeadForm.tsx, utils/validation.ts (comma-separated)"
          />
        </div>

        {/* Technical Details */}
        <div className="col-span-2">
          <label htmlFor="technical_details" className="block text-sm font-medium text-gray-700">
            Technical Details (JSON)
          </label>
          <textarea
            name="technical_details"
            id="technical_details"
            rows={4}
            value={JSON.stringify(formData.technical_details || {}, null, 2)}
            onChange={(e) => handleJsonChange('technical_details', e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 font-mono text-sm"
          />
        </div>

        {/* Decision Context */}
        <div className="col-span-2">
          <label htmlFor="decision_context" className="block text-sm font-medium text-gray-700">
            Decision Context (JSON)
          </label>
          <textarea
            name="decision_context"
            id="decision_context"
            rows={4}
            value={JSON.stringify(formData.decision_context || {}, null, 2)}
            onChange={(e) => handleJsonChange('decision_context', e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 font-mono text-sm"
          />
        </div>

        {/* Implementation Notes */}
        <div className="col-span-2">
          <label htmlFor="implementation_notes" className="block text-sm font-medium text-gray-700">
            Implementation Notes (JSON)
          </label>
          <textarea
            name="implementation_notes"
            id="implementation_notes"
            rows={4}
            value={JSON.stringify(formData.implementation_notes || {}, null, 2)}
            onChange={(e) => handleJsonChange('implementation_notes', e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 font-mono text-sm"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
        >
          {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create Note' : 'Update Note'}
        </button>
      </div>
    </form>
  );
};

export default DeveloperNoteForm;
