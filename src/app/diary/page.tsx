"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card, EmptyState } from "@/components/ui/Card";
import { Input, Select, Textarea, Modal } from "@/components/ui/Input";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { formatDate } from "@/lib/utils";
import { recordActivity } from "@/lib/gamification";

interface DiaryEntry {
  id: string;
  title: string;
  content: string;
  date: string;
  location: string | null;
  mood: string | null;
  imageUrl: string | null;
}

const moodOptions = [
  { value: "great", label: "🤩 Great" },
  { value: "good", label: "😊 Good" },
  { value: "okay", label: "🙂 Okay" },
  { value: "bad", label: "😕 Not great" },
];

const moodBadge: Record<string, string> = {
  great: "🤩",
  good: "😊",
  okay: "🙂",
  bad: "😕",
};

export default function DiaryPage() {
  const { showToast } = useToast();
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSignedIn, setIsSignedIn] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", content: "", location: "", mood: "good", imageUrl: "" });
  const [isSaving, setIsSaving] = useState(false);

  const loadEntries = useCallback(async () => {
    try {
      const response = await fetch("/api/diary");
      if (response.status === 401) {
        setIsSignedIn(false);
        return;
      }
      if (!response.ok) throw new Error();
      const data = await response.json();
      setEntries(data.entries);
      setIsSignedIn(true);
    } catch {
      showToast("Could not load diary entries", "error");
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const saveEntry = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      showToast("Title and content are required", "error");
      return;
    }
    setIsSaving(true);
    try {
      const response = await fetch("/api/diary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          content: form.content,
          location: form.location || undefined,
          mood: form.mood,
          imageUrl: form.imageUrl || undefined,
        }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || "save failed");
      }
      showToast("Memory saved! 📖", "success");
      recordActivity("diaryEntries");
      setIsModalOpen(false);
      setForm({ title: "", content: "", location: "", mood: "good", imageUrl: "" });
      await loadEntries();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to save entry", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const removeEntry = async () => {
    if (!deleteTarget) return;
    try {
      const response = await fetch(`/api/diary?id=${encodeURIComponent(deleteTarget)}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error();
      showToast("Entry removed", "success");
      await loadEntries();
    } catch {
      showToast("Failed to delete entry", "error");
    } finally {
      setDeleteTarget(null);
    }
  };

  if (!isSignedIn) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <EmptyState
          icon="🔒"
          title="Sign in to write your travel diary"
          description="Keep your trip memories, photos and feelings in one place."
          action={
            <Link href="/auth/login">
              <Button>Sign In</Button>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">📖 Travel Diary</h1>
          <p className="text-gray-500 mt-1">Capture your Bangladesh memories — words, photos and moods</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>+ New Entry</Button>
      </div>

      {isLoading ? (
        <p className="text-center text-gray-500 py-8">Loading your diary…</p>
      ) : entries.length === 0 ? (
        <EmptyState
          icon="📝"
          title="No diary entries yet"
          description="Start writing about your adventures — places, food, people and feelings."
          action={<Button onClick={() => setIsModalOpen(true)}>Write your first entry</Button>}
        />
      ) : (
        <div className="grid md:grid-cols-2 gap-5">
          {entries.map((entry) => (
            <Card key={entry.id} hover className="flex flex-col">
              {entry.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={entry.imageUrl}
                  alt={entry.title}
                  className="w-full h-40 object-cover rounded-lg mb-3 bg-gray-100"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              )}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {entry.mood && <span className="text-lg">{moodBadge[entry.mood]}</span>}
                    <h3 className="font-semibold text-gray-900 truncate">{entry.title}</h3>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {formatDate(entry.date)}
                    {entry.location && ` • ${entry.location}`}
                  </p>
                </div>
                <button
                  onClick={() => setDeleteTarget(entry.id)}
                  className="text-xs text-red-400 hover:text-red-600 shrink-0"
                  aria-label={`Delete ${entry.title}`}
                >
                  Delete
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-3 line-clamp-4 whitespace-pre-line">{entry.content}</p>
            </Card>
          ))}
        </div>
      )}

      {/* New entry modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="New Diary Entry">
        <div className="space-y-3">
          <Input
            label="Title"
            placeholder="e.g., Sunrise at Kuakata Beach"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            maxLength={140}
          />
          <Textarea
            label="Your story"
            placeholder="What happened today? Funny moments, food you tried, people you met…"
            rows={5}
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            maxLength={5000}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Location (optional)"
              placeholder="e.g., Cox's Bazar"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              maxLength={120}
            />
            <Select
              label="Mood"
              value={form.mood}
              onChange={(e) => setForm({ ...form, mood: e.target.value })}
              options={moodOptions}
            />
          </div>
          <Input
            label="Photo URL (optional)"
            type="url"
            placeholder="https://example.com/photo.jpg"
            value={form.imageUrl}
            onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
          />
          <p className="text-xs text-gray-400">
            💡 Tip: paste any public photo link (Google Photos, Imgur, etc.)
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveEntry} isLoading={isSaving}>
              Save Entry
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog
        open={deleteTarget !== null}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={removeEntry}
        title="Delete this entry?"
        message="This diary entry will be permanently removed."
        confirmLabel="Delete"
        danger
      />
    </div>
  );
}

