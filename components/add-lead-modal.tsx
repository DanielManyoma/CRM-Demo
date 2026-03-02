'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import type { Lead, LeadStatus, LeadSource } from '@/lib/types';

const STATUS_OPTIONS: LeadStatus[] = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'closed-won', 'closed-lost'];
const SOURCE_OPTIONS: LeadSource[] = ['website', 'referral', 'linkedin', 'cold-outreach', 'event', 'partner'];
const PRIORITY_OPTIONS: ('low' | 'medium' | 'high')[] = ['low', 'medium', 'high'];

function generateLeadId(existingLeads: Lead[]): string {
  const nums = existingLeads
    .map((l) => parseInt(l.id.replace(/\D/g, ''), 10))
    .filter((n) => !Number.isNaN(n));
  const max = nums.length ? Math.max(...nums) : 0;
  return `L-${String(max + 1).padStart(3, '0')}`;
}

const defaultForm = {
  companyName: '',
  contactName: '',
  email: '',
  phone: '',
  status: 'new' as LeadStatus,
  source: 'website' as LeadSource,
  value: '',
  priority: 'medium' as 'low' | 'medium' | 'high',
  notes: '',
};

interface AddLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (lead: Lead) => void;
  existingLeads: Lead[];
}

export function AddLeadModal({ isOpen, onClose, onSave, existingLeads }: AddLeadModalProps) {
  const [form, setForm] = useState(defaultForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: string, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!form.companyName.trim()) next.companyName = 'Company name is required';
    if (!form.contactName.trim()) next.contactName = 'Contact name is required';
    if (!form.email.trim()) next.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = 'Enter a valid email';
    if (!form.phone.trim()) next.phone = 'Phone is required';
    const valueNum = Number(form.value);
    if (form.value === '' || Number.isNaN(valueNum) || valueNum < 0) next.value = 'Enter a valid deal value';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const now = new Date();
    const lead: Lead = {
      id: generateLeadId(existingLeads),
      companyName: form.companyName.trim(),
      contactName: form.contactName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      status: form.status,
      source: form.source,
      value: Number(form.value),
      lastContact: now,
      createdAt: now,
      priority: form.priority,
      notes: form.notes.trim(),
      ownerId: 'agent-1',
    };
    onSave(lead);
    setForm(defaultForm);
    setErrors({});
    onClose();
  };

  const handleClose = () => {
    setForm(defaultForm);
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" aria-hidden onClick={handleClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-lead-title"
        className="relative w-full max-w-lg bg-[var(--surface)] rounded-xl border border-[var(--border)] shadow-xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <h2 id="add-lead-title" className="text-lg font-bold text-[var(--text-primary)]">
            Add Lead
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--border)]/50 hover:text-[var(--text-primary)] transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-auto">
          <div className="px-6 py-4 space-y-4">
            <div>
              <label htmlFor="companyName" className="block text-sm font-semibold text-[var(--text-secondary)] mb-1">
                Company name
              </label>
              <input
                id="companyName"
                type="text"
                value={form.companyName}
                onChange={(e) => handleChange('companyName', e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border bg-[var(--surface)] text-[var(--text-primary)] font-medium placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] ${
                  errors.companyName ? 'border-rose-400' : 'border-[var(--border)]'
                }`}
                placeholder="Acme Inc"
              />
              {errors.companyName && (
                <p className="mt-1 text-xs font-medium text-rose-600">{errors.companyName}</p>
              )}
            </div>
            <div>
              <label htmlFor="contactName" className="block text-sm font-semibold text-[var(--text-secondary)] mb-1">
                Contact name
              </label>
              <input
                id="contactName"
                type="text"
                value={form.contactName}
                onChange={(e) => handleChange('contactName', e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border text-slate-950 font-medium placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] ${
                  errors.contactName ? 'border-rose-400' : 'border-slate-300'
                }`}
                placeholder="Jane Smith"
              />
              {errors.contactName && (
                <p className="mt-1 text-xs font-medium text-rose-600">{errors.contactName}</p>
              )}
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-[var(--text-secondary)] mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border text-slate-950 font-medium placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] ${
                  errors.email ? 'border-rose-400' : 'border-slate-300'
                }`}
                placeholder="jane@acme.com"
              />
              {errors.email && (
                <p className="mt-1 text-xs font-medium text-rose-600">{errors.email}</p>
              )}
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-semibold text-[var(--text-secondary)] mb-1">
                Phone
              </label>
              <input
                id="phone"
                type="tel"
                value={form.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border text-slate-950 font-medium placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] ${
                  errors.phone ? 'border-rose-400' : 'border-slate-300'
                }`}
                placeholder="+1 (555) 000-0000"
              />
              {errors.phone && (
                <p className="mt-1 text-xs font-medium text-rose-600">{errors.phone}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="status" className="block text-sm font-semibold text-[var(--text-secondary)] mb-1">
                  Status
                </label>
                <select
                  id="status"
                  value={form.status}
                  onChange={(e) => handleChange('status', e.target.value as LeadStatus)}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] text-[var(--text-primary)] font-medium focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)]"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s.replace('-', ' ')}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="source" className="block text-sm font-semibold text-[var(--text-secondary)] mb-1">
                  Source
                </label>
                <select
                  id="source"
                  value={form.source}
                  onChange={(e) => handleChange('source', e.target.value as LeadSource)}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] text-[var(--text-primary)] font-medium focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)]"
                >
                  {SOURCE_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s.replace('-', ' ')}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="value" className="block text-sm font-semibold text-[var(--text-secondary)] mb-1">
                  Deal value ($)
                </label>
                <input
                  id="value"
                  type="number"
                  min={0}
                  step={1000}
                  value={form.value}
                  onChange={(e) => handleChange('value', e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border text-slate-950 font-medium placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] ${
                    errors.value ? 'border-rose-400' : 'border-slate-300'
                  }`}
                  placeholder="50000"
                />
                {errors.value && (
                  <p className="mt-1 text-xs font-medium text-rose-600">{errors.value}</p>
                )}
              </div>
              <div>
                <label htmlFor="priority" className="block text-sm font-semibold text-[var(--text-secondary)] mb-1">
                  Priority
                </label>
                <select
                  id="priority"
                  value={form.priority}
                  onChange={(e) => handleChange('priority', e.target.value as 'low' | 'medium' | 'high')}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] text-[var(--text-primary)] font-medium focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)]"
                >
                  {PRIORITY_OPTIONS.map((p) => (
                    <option key={p} value={p}>
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label htmlFor="notes" className="block text-sm font-semibold text-[var(--text-secondary)] mb-1">
                Notes
              </label>
              <textarea
                id="notes"
                value={form.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] text-[var(--text-primary)] font-medium placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] resize-none"
                placeholder="Optional notes..."
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 px-6 py-4 border-t border-[var(--border)] bg-[var(--border)]/20">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2.5 rounded-lg text-sm font-semibold text-[var(--text-primary)] bg-[var(--surface)] border border-[var(--border)] hover:opacity-90 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2.5 rounded-lg text-sm font-bold text-white bg-[var(--accent)] hover:opacity-90 transition-colors shadow-sm hover:shadow-md"
            >
              Add Lead
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
