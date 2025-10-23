import { useState } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { upsertExercise } from '../services/database/exercises';

type ParsedExercise = {
  name: string;
  category: string;
  primary_muscles?: string[];
  secondary_muscles?: string[];
  equipment?: string[];
  tags?: string[];
  aliases?: string[];
  cues?: string[];
  video_url?: string | null;
  image_url?: string | null;
};

export default function ExerciseImportScreen() {
  const [rawText, setRawText] = useState('');
  const [items, setItems] = useState<ParsedExercise[]>([]);
  const [importedCount, setImportedCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isEnabled = import.meta.env.DEV;

  const parse = () => {
    setImportedCount(null);
    setError(null);
    try {
      // Try JSON first
      const data = JSON.parse(rawText);
      if (Array.isArray(data)) {
        setItems(normalize(data as ParsedExercise[]));
        return;
      }
      throw new Error('JSON must be an array of exercises');
    } catch (e) {
      setError('Failed to parse JSON. Ensure it is a JSON array.');
    }
  };

  const normalize = (arr: ParsedExercise[]): ParsedExercise[] => {
    const norm = (s: string) => s.trim().toLowerCase();
    const eqMap: Record<string, string> = {
      'barbell': 'barbell',
      'dumbbell': 'dumbbell',
      'db': 'dumbbell',
      'ez': 'ez curl bar',
      'ez bar': 'ez curl bar',
      'ez curl bar': 'ez curl bar',
      'machine': 'machines',
      'machines': 'machines',
      'band': 'bands',
      'bands': 'bands'
    };

    return arr.map((e) => ({
      ...e,
      equipment: (e.equipment || []).map(x => eqMap[norm(x)] || x)
    }));
  };

  const doImport = () => {
    if (!isEnabled) {
      setError('Import is disabled in production builds');
      return;
    }
    let count = 0;
    for (const it of items) {
      try {
        upsertExercise({
          name: it.name,
          category: it.category,
          primary_muscles: it.primary_muscles || [],
          secondary_muscles: it.secondary_muscles || [],
          equipment: it.equipment || [],
          tags: it.tags || [],
          aliases: it.aliases || [],
          video_url: it.video_url || null,
          image_url: it.image_url || null,
          is_custom: false
        });
        count++;
      } catch (err) {
        console.error('Failed to import exercise', it.name, err);
      }
    }
    setImportedCount(count);
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Exercise Import</h1>
        {!isEnabled && (
          <span className="text-sm text-gray-600">Disabled in production</span>
        )}
      </div>

      <Card className="p-4">
        <div className="mb-2 text-sm text-gray-600">Paste a JSON array of exercises (see docs for shape)</div>
        <textarea
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          className="w-full h-56 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder='[ { "name": "Barbell Back Squat", "category": "squat", "equipment": ["barbell"] } ]'
        />
        <div className="flex gap-2 mt-3">
          <Button variant="outline" onClick={parse}>Preview</Button>
          <Button onClick={doImport} disabled={!isEnabled || items.length === 0}>Import {items.length > 0 ? `(${items.length})` : ''}</Button>
        </div>
        {error && <div className="text-error mt-3 text-sm">{error}</div>}
        {importedCount !== null && (
          <div className="text-success mt-3 text-sm">Imported {importedCount} exercises.</div>
        )}
      </Card>

      {items.length > 0 && (
        <Card className="p-4 mt-4">
          <div className="font-semibold mb-3">Preview ({items.length})</div>
          <div className="space-y-2 max-h-64 overflow-auto">
            {items.map((it, idx) => (
              <div key={idx} className="text-sm text-gray-700">
                <span className="font-medium">{it.name}</span> — {it.category}
                {it.equipment && it.equipment.length > 0 && (
                  <span className="ml-2 text-gray-500">[{it.equipment.join(', ')}]</span>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}


