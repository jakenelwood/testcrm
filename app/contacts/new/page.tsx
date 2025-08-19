"use client";

import { useState } from 'react';

export default function NewContactPage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  return (
    <main className="max-w-xl mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-4">New Contact</h1>
      <form className="space-y-3">
        <div>
          <label className="block text-sm mb-1" htmlFor="firstName">First Name</label>
          <input id="firstName" name="firstName" className="border rounded px-3 py-2 w-full" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm mb-1" htmlFor="lastName">Last Name</label>
          <input id="lastName" name="lastName" className="border rounded px-3 py-2 w-full" value={lastName} onChange={(e) => setLastName(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm mb-1" htmlFor="email">Email</label>
          <input id="email" name="email" type="email" className="border rounded px-3 py-2 w-full" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm mb-1" htmlFor="phone">Phone</label>
          <input id="phone" name="phone" className="border rounded px-3 py-2 w-full" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <button type="submit" className="border rounded px-3 py-2">Create</button>
      </form>
    </main>
  );
}

