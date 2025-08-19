'use client'

import { useEffect, useState } from 'react';

interface UIContact {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  lifecycleStage?: string;
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<UIContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');

  const fetchContacts = async (search?: string) => {
    setLoading(true);
    try {
      const qs = search ? `?search=${encodeURIComponent(search)}` : '';
      const res = await fetch(`/api/contacts${qs}`);
      if (res.ok) {
        const data = await res.json();
        setContacts(data.data || []);
      } else {
        setContacts([]);
      }
    } catch (err) {
      setContacts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  return (
    <main className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-4">Contacts</h1>

      <div className="mb-4 flex gap-2">
        <input
          className="border rounded px-3 py-2 w-full"
          placeholder="Search contacts..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button className="border rounded px-3" onClick={() => fetchContacts(q)}>Search</button>
      </div>

      {loading && <p className="text-sm text-muted-foreground">Loading…</p>}

      {contacts.length === 0 && (
        <div className="empty-state" data-testid="empty-contacts">
          <p className="text-sm text-muted-foreground">No contacts yet.</p>
        </div>
      )}

      {!loading && contacts.length > 0 && (
        <ul className="space-y-2 contact-list" data-testid="contacts-list">
          {contacts.map((c) => (
            <li key={c.id} data-testid="contact-item" className="border rounded p-3">
              <div className="font-medium">{[c.firstName, c.lastName].filter(Boolean).join(' ') || 'Unnamed'}</div>
              <div className="text-xs text-muted-foreground">{c.email || '—'}</div>
              {c.lifecycleStage && (
                <span data-lifecycle-stage={c.lifecycleStage} className="inline-block mt-1 text-[10px] bg-muted px-2 py-0.5 rounded">
                  {c.lifecycleStage}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

