'use client'

import { useEffect, useState } from 'react'
import {
  getApplications,
  saveApplication,
  updateApplicationStatus,
  deleteApplication,
  getProcessedStatesByStatus,
  generateId,
  todayDate,
} from '@/lib/storage'
import type { ApplicationEntry, ApplicationStatus, ProcessedState } from '@/lib/types'

const STATUSES: { value: ApplicationStatus; label: string; color: string }[] = [
  { value: 'applied', label: 'Applied', color: 'text-sky-400 border-sky-500/30 bg-sky-500/10' },
  { value: 'no_response', label: 'Did Not Hear Back', color: 'text-slate-400 border-slate-500/30 bg-slate-500/10' },
  { value: 'invited_interview', label: 'Invited for Interview', color: 'text-amber-400 border-amber-500/30 bg-amber-500/10' },
  { value: 'interviewing', label: 'Interviewing', color: 'text-amber-300 border-amber-400/30 bg-amber-400/10' },
  { value: 'offer', label: 'Offer', color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' },
  { value: 'rejected', label: 'Rejected', color: 'text-rose-400 border-rose-500/30 bg-rose-500/10' },
  { value: 'withdrawn', label: 'Withdrawn', color: 'text-slate-400 border-slate-500/30 bg-slate-500/10' },
]

function statusStyle(status: ApplicationStatus) {
  return STATUSES.find((s) => s.value === status)?.color ?? ''
}

function statusLabel(status: ApplicationStatus) {
  return STATUSES.find((s) => s.value === status)?.label ?? status
}

const EMPTY_FORM = {
  company: '',
  title: '',
  status: 'applied' as ApplicationStatus,
  applied_date: '',
  follow_up_date: '',
  contact_name: '',
  contact_email: '',
  job_url: '',
  notes: '',
}

export default function TrackerPage() {
  const [apps, setApps] = useState<ApplicationEntry[]>([])
  const [drafts, setDrafts] = useState<ProcessedState[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showDraftPicker, setShowDraftPicker] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<ApplicationStatus | 'all'>('all')
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc')

  useEffect(() => {
    Promise.all([getApplications(), getProcessedStatesByStatus('generated')]).then(([a, d]) => {
      setApps(a)
      setDrafts(d)
      setLoading(false)
    })
  }, [])

  function openAdd() {
    setForm({ ...EMPTY_FORM, applied_date: todayDate() })
    setEditingId(null)
    setShowDraftPicker(false)
    setShowForm(true)
  }

  function pickDraft(draft: ProcessedState) {
    setForm({
      ...EMPTY_FORM,
      applied_date: todayDate(),
      company: draft.company,
      title: draft.title,
      job_url: draft.url ?? '',
    })
    setShowDraftPicker(false)
  }

  function openEdit(app: ApplicationEntry) {
    setForm({
      company: app.company,
      title: app.title,
      status: app.status,
      applied_date: app.applied_date ?? '',
      follow_up_date: app.follow_up_date ?? '',
      contact_name: app.contact_name ?? '',
      contact_email: app.contact_email ?? '',
      job_url: app.job_url ?? '',
      notes: app.notes ?? '',
    })
    setEditingId(app.id)
    setShowForm(true)
    setExpandedId(null)
  }

  async function handleSave() {
    if (!form.company.trim() || !form.title.trim()) return
    setSaving(true)
    const now = new Date().toISOString()
    const entry: Omit<ApplicationEntry, 'user_id'> = {
      id: editingId ?? generateId(),
      company: form.company.trim(),
      title: form.title.trim(),
      status: form.status,
      applied_date: form.applied_date || undefined,
      follow_up_date: form.follow_up_date || undefined,
      contact_name: form.contact_name.trim() || undefined,
      contact_email: form.contact_email.trim() || undefined,
      job_url: form.job_url.trim() || undefined,
      notes: form.notes.trim() || undefined,
      created_at: now,
      updated_at: now,
    }
    await saveApplication(entry)
    const updated = await getApplications()
    setApps(updated)
    setSaving(false)
    setShowForm(false)
    setEditingId(null)
    setExpandedId(entry.id)
  }

  async function handleStatusChange(id: string, status: ApplicationStatus) {
    await updateApplicationStatus(id, status)
    setApps((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)))
  }

  async function handleDelete(id: string) {
    await deleteApplication(id)
    setApps((prev) => prev.filter((a) => a.id !== id))
    setConfirmDeleteId(null)
    setExpandedId(null)
  }

  const filtered = (filterStatus === 'all' ? apps : apps.filter((a) => a.status === filterStatus))
    .slice()
    .sort((a, b) => {
      const ta = new Date(a.created_at ?? 0).getTime()
      const tb = new Date(b.created_at ?? 0).getTime()
      return sortOrder === 'desc' ? tb - ta : ta - tb
    })

  const counts: Partial<Record<ApplicationStatus, number>> = {}
  for (const a of apps) counts[a.status] = (counts[a.status] ?? 0) + 1

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500 text-sm">Loading...</div>
      </div>
    )
  }

  return (
    <div className="px-4 pt-6 pb-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Application Tracker</h1>
          <p className="text-slate-500 text-sm mt-0.5">{apps.length} application{apps.length !== 1 ? 's' : ''} tracked</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSortOrder((o) => (o === 'desc' ? 'asc' : 'desc'))}
            className="text-xs text-slate-400 hover:text-white bg-white/10 hover:bg-white/15 border border-white/20 px-2.5 py-1.5 rounded-lg transition-colors"
            title={sortOrder === 'desc' ? 'Newest first' : 'Oldest first'}
          >
            {sortOrder === 'desc' ? 'Newest first' : 'Oldest first'}
          </button>
          <button
            onClick={openAdd}
            className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-sm font-medium px-3 py-2 rounded-lg transition-all shadow-lg shadow-violet-900/40"
          >
            + Add
          </button>
        </div>
      </div>

      {/* Status summary */}
      {apps.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {STATUSES.filter((s) => counts[s.value]).map((s) => (
            <button
              key={s.value}
              onClick={() => setFilterStatus(filterStatus === s.value ? 'all' : s.value)}
              className={`rounded-xl border px-2 py-1.5 text-center transition-colors ${
                filterStatus === s.value ? s.color : 'border-white/10 bg-[#111827]/80'
              }`}
            >
              <p className={`text-lg font-bold ${filterStatus === s.value ? '' : 'text-white'}`}>
                {counts[s.value]}
              </p>
              <p className={`text-[10px] ${filterStatus === s.value ? '' : 'text-slate-500'}`}>
                {s.label}
              </p>
            </button>
          ))}
        </div>
      )}

      {/* Add / Edit form */}
      {showForm && (
        <div className="rounded-2xl bg-[#111827]/80 border border-white/10 backdrop-blur-md shadow-lg shadow-black/40 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-white">{editingId ? 'Edit Application' : 'Add Application'}</p>
            {!editingId && drafts.length > 0 && (
              <button
                onClick={() => setShowDraftPicker((v) => !v)}
                className="text-xs text-violet-400 hover:text-violet-300 border border-violet-500/30 px-2.5 py-1 rounded-lg transition-colors"
              >
                {showDraftPicker ? 'Cancel' : 'Pick from Drafts'}
              </button>
            )}
          </div>

          {/* Draft picker */}
          {showDraftPicker && (
            <div className="rounded-xl bg-white/5 border border-white/10 overflow-hidden">
              <p className="text-xs text-slate-500 px-3 pt-2.5 pb-1.5">Select a draft to pre-fill</p>
              <div className="divide-y divide-white/5 max-h-48 overflow-y-auto">
                {drafts.map((draft) => (
                  <button
                    key={draft.id}
                    onClick={() => pickDraft(draft)}
                    className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-white/5 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-white text-sm truncate">{draft.title}</p>
                      <p className="text-slate-400 text-xs">{draft.company}</p>
                    </div>
                    {draft.match_pct !== undefined && (
                      <span className="text-emerald-400 text-xs ml-3 shrink-0">{draft.match_pct}%</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Company *</label>
              <input
                value={form.company}
                onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
                placeholder="Acme Corp"
                className="w-full bg-white/5 border border-white/10 focus:border-violet-500 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Title *</label>
              <input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Program Manager"
                className="w-full bg-white/5 border border-white/10 focus:border-violet-500 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as ApplicationStatus }))}
              className="w-full bg-white/5 border border-white/10 focus:border-violet-500 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
            >
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Date Applied</label>
              <input
                type="date"
                value={form.applied_date}
                onChange={(e) => setForm((f) => ({ ...f, applied_date: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 focus:border-violet-500 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Follow-up Date</label>
              <input
                type="date"
                value={form.follow_up_date}
                onChange={(e) => setForm((f) => ({ ...f, follow_up_date: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 focus:border-violet-500 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Contact Name</label>
              <input
                value={form.contact_name}
                onChange={(e) => setForm((f) => ({ ...f, contact_name: e.target.value }))}
                placeholder="Jane Smith"
                className="w-full bg-white/5 border border-white/10 focus:border-violet-500 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Contact Email</label>
              <input
                type="email"
                value={form.contact_email}
                onChange={(e) => setForm((f) => ({ ...f, contact_email: e.target.value }))}
                placeholder="jane@company.com"
                className="w-full bg-white/5 border border-white/10 focus:border-violet-500 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Job URL</label>
            <input
              value={form.job_url}
              onChange={(e) => setForm((f) => ({ ...f, job_url: e.target.value }))}
              placeholder="https://..."
              className="w-full bg-white/5 border border-white/10 focus:border-violet-500 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Interview prep notes, recruiter name, next steps..."
              rows={3}
              className="w-full bg-white/5 border border-white/10 focus:border-violet-500 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none resize-none"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving || !form.company.trim() || !form.title.trim()}
              className="flex-1 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-lg transition-all shadow-lg shadow-violet-900/40"
            >
              {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Add Application'}
            </button>
            <button
              onClick={() => { setShowForm(false); setEditingId(null) }}
              className="px-4 py-2.5 rounded-lg bg-white/10 hover:bg-white/15 border border-white/20 text-slate-400 hover:text-white text-sm transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Application list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-slate-500 text-sm">
            {apps.length === 0 ? 'No applications yet. Hit + Add to track your first one.' : 'No applications match this filter.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((app) => (
            <div key={app.id} className="rounded-2xl bg-[#111827]/80 border border-white/10 backdrop-blur-md shadow-lg shadow-black/40 overflow-hidden">
              <button
                onClick={() => setExpandedId(expandedId === app.id ? null : app.id)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-white text-sm font-medium truncate">{app.title}</p>
                  <p className="text-slate-400 text-xs">{app.company}</p>
                  {app.follow_up_date && (
                    <p className="text-amber-400 text-[10px] mt-0.5">
                      Follow up: {app.follow_up_date}
                    </p>
                  )}
                </div>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border shrink-0 ${statusStyle(app.status)}`}>
                  {statusLabel(app.status)}
                </span>
              </button>

              {expandedId === app.id && (
                <div className="px-4 pb-4 border-t border-white/5 pt-3 space-y-3">
                  {/* Quick status change */}
                  <div>
                    <p className="text-xs text-slate-500 mb-2">Update status</p>
                    <div className="flex flex-wrap gap-1.5">
                      {STATUSES.map((s) => (
                        <button
                          key={s.value}
                          onClick={() => handleStatusChange(app.id, s.value)}
                          className={`text-[10px] font-medium px-2.5 py-1 rounded-full border transition-colors ${
                            app.status === s.value ? s.color : 'border-white/10 text-slate-500 hover:text-white'
                          }`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {app.applied_date && <MetaItem label="Applied" value={app.applied_date} />}
                    {app.contact_name && <MetaItem label="Contact" value={app.contact_name} />}
                    {app.contact_email && <MetaItem label="Email" value={app.contact_email} />}
                    {app.job_url && (
                      <div className="col-span-2">
                        <p className="text-slate-500">URL</p>
                        <a href={app.job_url} target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:text-violet-300 truncate block">
                          {app.job_url}
                        </a>
                      </div>
                    )}
                  </div>

                  {app.notes && (
                    <div className="rounded-lg bg-white/5 px-3 py-2">
                      <p className="text-slate-400 text-xs whitespace-pre-wrap">{app.notes}</p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => openEdit(app)}
                      className="text-xs text-violet-400 hover:text-violet-300 border border-violet-500/30 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Edit
                    </button>
                    {confirmDeleteId === app.id ? (
                      <>
                        <button
                          onClick={() => handleDelete(app.id)}
                          className="text-xs bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-400 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          Confirm Delete
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="text-xs text-slate-400 hover:text-white px-2 py-1.5 rounded-lg transition-colors"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(app.id)}
                        className="text-xs bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-400 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-slate-500">{label}</p>
      <p className="text-slate-400">{value}</p>
    </div>
  )
}
