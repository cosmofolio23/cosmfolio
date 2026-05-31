/**
 * Theme Manager Component
 * Phase 3: Task 3.4 - Design system and theme management UI
 */

import React, { useState, useEffect } from 'react';
import {
  Palette,
  Plus,
  Edit2,
  Trash2,
  Copy,
  Download,
  Star,
  ChevronDown,
} from 'lucide-react';
import { APIClient, apiClient } from '@/lib/api';

interface StylePack {
  id: string;
  name: string;
  description?: string;
  colors: Record<string, string>;
  is_default: boolean;
  is_custom: boolean;
}

interface Theme {
  id: string;
  name: string;
  color_scheme: 'light' | 'dark' | 'custom';
  is_active: boolean;
}

export const ThemeManager: React.FC<{ portfolioId: string }> = ({ portfolioId }) => {
  // State
  const [stylePacks, setStylePacks] = useState<StylePack[]>([]);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPack, setSelectedPack] = useState<StylePack | null>(null);
  const [showPresets, setShowPresets] = useState(false);

  

  // Load data
  useEffect(() => {
    loadStylePacks();
    loadThemes();
  }, [portfolioId]);

  const loadStylePacks = async () => {
    try {
      const response = await apiClient.get(
        `/portfolios/${portfolioId}/style-packs`
      );
      setStylePacks(response.data.custom_packs || []);
    } catch (error) {
      console.error('Failed to load style packs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadThemes = async () => {
    try {
      const response = await apiClient.get(
        `/portfolios/${portfolioId}/themes`
      );
      setThemes(response.data.themes || []);
    } catch (error) {
      console.error('Failed to load themes:', error);
    }
  };

  const handleSetDefault = async (packId: string) => {
    try {
      await apiClient.post(
        `/portfolios/${portfolioId}/style-packs/${packId}/set-default`
      );
      loadStylePacks();
    } catch (error) {
      console.error('Failed to set default pack:', error);
    }
  };

  const handleDeletePack = async (packId: string) => {
    if (!window.confirm('Delete this style pack?')) return;

    try {
      await apiClient.delete(
        `/portfolios/${portfolioId}/style-packs/${packId}`
      );
      loadStylePacks();
    } catch (error) {
      console.error('Failed to delete pack:', error);
    }
  };

  const handleDuplicatePack = async (pack: StylePack) => {
    const newName = prompt(`Duplicate as:`, `${pack.name} (Copy)`);
    if (!newName) return;

    try {
      await apiClient.post(
        `/portfolios/${portfolioId}/style-packs/${pack.id}/duplicate?new_name=${encodeURIComponent(newName)}`
      );
      loadStylePacks();
    } catch (error) {
      console.error('Failed to duplicate pack:', error);
    }
  };

  const handleExportCSS = async (packId: string) => {
    try {
      const response = await apiClient.get(
        `/portfolios/${portfolioId}/style-packs/${packId}/export-css`
      );

      // Create download link
      const element = document.createElement('a');
      element.setAttribute('href', `data:text/css;charset=utf-8,${encodeURIComponent(response.data.content)}`);
      element.setAttribute('download', response.data.file_name);
      element.style.display = 'none';
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    } catch (error) {
      console.error('Failed to export:', error);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading themes...</div>;
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="border-b bg-white p-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Palette size={24} className="text-blue-600" />
            <h1 className="text-2xl font-bold">Theme Manager</h1>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus size={18} />
            New Theme
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {/* Presets Section */}
        <div className="mb-8">
          <button
            onClick={() => setShowPresets(!showPresets)}
            className="flex items-center gap-2 text-lg font-semibold mb-4 cursor-pointer"
          >
            <ChevronDown
              size={20}
              className={`transition ${showPresets ? 'rotate-180' : ''}`}
            />
            Built-in Presets
          </button>

          {showPresets && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {['Minimal White', 'Dark Studio', 'Scandinavian', 'Corporate'].map(
                (preset) => (
                  <PresetCard key={preset} name={preset} />
                )
              )}
            </div>
          )}
        </div>

        {/* Custom Packs */}
        <div>
          <h2 className="text-lg font-semibold mb-4">My Themes</h2>

          {stylePacks.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed">
              <Palette className="mx-auto mb-4 text-gray-400" size={48} />
              <p className="text-gray-500">No custom themes yet</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 text-blue-600 hover:underline"
              >
                Create one now
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stylePacks.map((pack) => (
                <StylePackCard
                  key={pack.id}
                  pack={pack}
                  onSetDefault={handleSetDefault}
                  onDelete={handleDeletePack}
                  onDuplicate={handleDuplicatePack}
                  onExport={handleExportCSS}
                  onEdit={() => setSelectedPack(pack)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <CreateThemeModal
          portfolioId={portfolioId}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            loadStylePacks();
            setShowCreateModal(false);
          }}
        />
      )}

      {/* Edit Modal */}
      {selectedPack && (
        <EditThemeModal
          pack={selectedPack}
          portfolioId={portfolioId}
          onClose={() => setSelectedPack(null)}
          onSuccess={() => {
            loadStylePacks();
            setSelectedPack(null);
          }}
        />
      )}
    </div>
  );
};

// Preset Card Component
const PresetCard: React.FC<{ name: string }> = ({ name }) => {
  return (
    <div className="bg-white rounded-lg border p-4 hover:shadow-md transition cursor-pointer">
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold">{name}</h3>
        <Star size={18} className="text-yellow-500" />
      </div>
      <p className="text-sm text-gray-600 mb-4">Preset theme</p>
      <button className="w-full px-3 py-2 bg-blue-100 text-blue-600 text-sm rounded hover:bg-blue-200">
        Apply
      </button>
    </div>
  );
};

// Style Pack Card Component
interface StylePackCardProps {
  pack: StylePack;
  onSetDefault: (id: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (pack: StylePack) => void;
  onExport: (id: string) => void;
  onEdit: () => void;
}

const StylePackCard: React.FC<StylePackCardProps> = ({
  pack,
  onSetDefault,
  onDelete,
  onDuplicate,
  onExport,
  onEdit,
}) => {
  return (
    <div className="bg-white rounded-lg border p-4 hover:shadow-md transition">
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold">{pack.name}</h3>
        <button
          onClick={() => onSetDefault(pack.id)}
          className={`p-1 rounded ${pack.is_default ? 'bg-yellow-100 text-yellow-600' : 'text-gray-400 hover:text-yellow-600'}`}
        >
          <Star size={18} fill={pack.is_default ? 'currentColor' : 'none'} />
        </button>
      </div>

      {/* Color Swatches */}
      <div className="flex gap-2 mb-4">
        {Object.entries(pack.colors).slice(0, 4).map(([name, color]) => (
          <div
            key={name}
            className="w-8 h-8 rounded border"
            style={{ backgroundColor: color }}
            title={name}
          />
        ))}
      </div>

      {pack.description && (
        <p className="text-sm text-gray-600 mb-4">{pack.description}</p>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-3 border-t">
        <button
          onClick={onEdit}
          className="flex-1 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded flex items-center justify-center gap-1"
        >
          <Edit2 size={14} />
          Edit
        </button>
        <button
          onClick={() => onDuplicate(pack)}
          className="flex-1 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded flex items-center justify-center gap-1"
        >
          <Copy size={14} />
          Copy
        </button>
        <button
          onClick={() => onExport(pack.id)}
          className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded"
        >
          <Download size={14} />
        </button>
        <button
          onClick={() => onDelete(pack.id)}
          className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
};

// Create Theme Modal
interface CreateThemeModalProps {
  portfolioId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateThemeModal: React.FC<CreateThemeModalProps> = ({
  portfolioId,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    primaryColor: '#000000',
    secondaryColor: '#666666',
    accentColor: '#0066cc',
    backgroundColor: '#ffffff',
    textColor: '#333333',
  });

  

  const handleSubmit = async () => {
    try {
      await apiClient.post(`/portfolios/${portfolioId}/style-packs`, formData);
      onSuccess();
    } catch (error) {
      console.error('Failed to create theme:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white">
          <h2 className="text-xl font-bold">Create New Theme</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Name & Description */}
          <div>
            <label className="block text-sm font-semibold mb-2">Theme Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:border-blue-500"
              placeholder="My Custom Theme"
            />
          </div>

          {/* Color Grid */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { key: 'primaryColor', label: 'Primary' },
              { key: 'secondaryColor', label: 'Secondary' },
              { key: 'accentColor', label: 'Accent' },
              { key: 'backgroundColor', label: 'Background' },
              { key: 'textColor', label: 'Text' },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="block text-sm font-semibold mb-2">{label}</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={formData[key as keyof typeof formData] as string}
                    onChange={(e) =>
                      setFormData({ ...formData, [key]: e.target.value })
                    }
                    className="w-12 h-10 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData[key as keyof typeof formData] as string}
                    className="flex-1 px-2 py-1 text-sm border rounded"
                    readOnly
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Create Theme
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Edit Theme Modal
interface EditThemeModalProps {
  pack: StylePack;
  portfolioId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const EditThemeModal: React.FC<EditThemeModalProps> = ({
  pack,
  portfolioId,
  onClose,
  onSuccess,
}) => {
  const [name, setName] = useState(pack.name);
  const [description, setDescription] = useState(pack.description || '');

  

  const handleSubmit = async () => {
    try {
      await apiClient.put(
        `/portfolios/${portfolioId}/style-packs/${pack.id}?name=${encodeURIComponent(name)}&description=${encodeURIComponent(description)}`
      );
      onSuccess();
    } catch (error) {
      console.error('Failed to update theme:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold">Edit Theme</h2>
          <button onClick={onClose} className="text-gray-500">✕</button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:border-blue-500"
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThemeManager;
