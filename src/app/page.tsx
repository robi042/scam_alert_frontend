'use client'

import dynamic from 'next/dynamic'
import { FormEvent, useEffect, useState } from 'react'
import type { MapArea } from '@/components/AffectedAreasMap'

const AffectedAreasMap = dynamic(
  () => import('@/components/AffectedAreasMap'),
  { ssr: false }
)

type CategoryCount = {
  categoryId: string
  name: string
  slug: string
  count: number
}

type Comment = {
  _id: string
  body: string
  createdAt: string
}

type Report = {
  _id: string
  phoneNumber: string
  totalReportsForNumber?: number
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  category: {
    _id: string
    name: string
    slug: string
  } | null
  description?: string
  reporterIP?: string
  createdAt: string
  likesCount?: number
  dislikesCount?: number
  commentsPreview?: Comment[]
  totalComments?: number
}

type Stats = {
  totalReports: number
  categoryCounts: CategoryCount[]
}

type Pagination = {
  page: number
  limit: number
  totalReports: number
}

type ListResponse = {
  stats: Stats
  pagination: Pagination
  data: Report[]
}

type Category = {
  _id: string
  name: string
  slug: string
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE as string
const MODULE_HEADER = process.env.NEXT_PUBLIC_MODULE_HEADER as string

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      module: MODULE_HEADER,
      ...(init?.headers || {}),
    },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `Request failed with ${res.status}`)
  }
  return res.json()
}

export default function HomePage() {
  const [reportPhone, setReportPhone] = useState('')
  const [searchPhone, setSearchPhone] = useState('')
  const [description, setDescription] = useState('')
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [range, setRange] = useState<string>('')
  const [page, setPage] = useState<number>(1)
  const [limit] = useState<number>(10)
  const [listData, setListData] = useState<ListResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [mapAreas, setMapAreas] = useState<MapArea[]>([])
  const [mapLoading, setMapLoading] = useState(true)
  const [expandedComments, setExpandedComments] = useState<Record<string, Comment[]>>({})
  const [loadingMoreComments, setLoadingMoreComments] = useState<Record<string, boolean>>({})
  const [commentText, setCommentText] = useState<Record<string, string>>({})
  const [submittingComment, setSubmittingComment] = useState<Record<string, boolean>>({})
  const [engagementLoading, setEngagementLoading] = useState<Record<string, boolean>>({})

  useEffect(() => {
    fetchJson<{ categories: Category[] }>(`${API_BASE}/categories`)
      .then((data) => {
        setCategories(data.categories)
        if (data.categories.length && !selectedCategory) {
          setSelectedCategory(data.categories[0]._id)
        }
      })
      .catch((e) => {
        console.error(e)
      })

    loadList('', '', 1)
    fetchJson<{ areas: MapArea[] }>(`${API_BASE}/reports/map-data`)
      .then((data) => setMapAreas(data.areas || []))
      .catch((e) => console.error('Map data failed', e))
      .finally(() => setMapLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadList = async (
    phoneFilter: string,
    rangeFilter: string,
    pageValue: number
  ) => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (phoneFilter) params.append('phone', phoneFilter)
      if (rangeFilter) params.append('range', rangeFilter)
      params.append('page', String(pageValue))
      params.append('limit', String(limit))
      const query = params.toString() ? `?${params.toString()}` : ''
      const data = await fetchJson<ListResponse>(`${API_BASE}/reports${query}`)
      setListData(data)
    } catch (e: any) {
      console.error(e)
      setError('Failed to load reports.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!reportPhone || !selectedCategory) {
      setError('Phone number and category are required.')
      return
    }
    setSubmitting(true)
    setError(null)
    setSuccess(null)
    try {
      await fetchJson(`${API_BASE}/reports`, {
        method: 'POST',
        body: JSON.stringify({
          phoneNumber: reportPhone,
          categoryId: selectedCategory,
          description,
        }),
      })
      setSuccess('Report submitted successfully.')
      setReportPhone('')
      setDescription('')
      setSearchPhone(reportPhone)
      setPage(1)
      await loadList(reportPhone, range, 1)
    } catch (e: any) {
      console.error(e)
      setError('Failed to submit report.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault()
    setPage(1)
    await loadList(searchPhone, range, 1)
  }

  const handleLike = async (reportId: string) => {
    setEngagementLoading((prev) => ({ ...prev, [reportId]: true }))
    try {
      await fetchJson(`${API_BASE}/reports/${reportId}/like`, { method: 'POST' })
      if (listData?.data) {
        setListData({
          ...listData,
          data: listData.data.map((r) =>
            r._id === reportId ? { ...r, likesCount: (r.likesCount ?? 0) + 1 } : r
          ),
        })
      }
    } catch (e) {
      console.error(e)
    } finally {
      setEngagementLoading((prev) => ({ ...prev, [reportId]: false }))
    }
  }

  const handleDislike = async (reportId: string) => {
    setEngagementLoading((prev) => ({ ...prev, [reportId]: true }))
    try {
      await fetchJson(`${API_BASE}/reports/${reportId}/dislike`, { method: 'POST' })
      if (listData?.data) {
        setListData({
          ...listData,
          data: listData.data.map((r) =>
            r._id === reportId ? { ...r, dislikesCount: (r.dislikesCount ?? 0) + 1 } : r
          ),
        })
      }
    } catch (e) {
      console.error(e)
    } finally {
      setEngagementLoading((prev) => ({ ...prev, [reportId]: false }))
    }
  }

  const handleAddComment = async (reportId: string) => {
    const body = commentText[reportId]?.trim()
    if (!body) return
    setSubmittingComment((prev) => ({ ...prev, [reportId]: true }))
    try {
      await fetchJson(`${API_BASE}/reports/${reportId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ body }),
      })
      setCommentText((prev) => ({ ...prev, [reportId]: '' }))
      setExpandedComments((prev) => {
        const next = { ...prev }
        delete next[reportId]
        return next
      })
      await loadList(searchPhone, range, page)
    } catch (e) {
      console.error(e)
    } finally {
      setSubmittingComment((prev) => ({ ...prev, [reportId]: false }))
    }
  }

  const handleSeeMoreComments = async (reportId: string, r: Report) => {
    const displayed = expandedComments[reportId] ?? r.commentsPreview ?? []
    const nextPage = Math.floor(displayed.length / 2) + 1
    setLoadingMoreComments((prev) => ({ ...prev, [reportId]: true }))
    try {
      const res = await fetchJson<{
        comments: Comment[]
        pagination: { totalComments: number }
      }>(`${API_BASE}/reports/${reportId}/comments?page=${nextPage}&limit=2`)
      setExpandedComments((prev) => ({
        ...prev,
        [reportId]: [...displayed, ...res.comments],
      }))
      if (listData?.data) {
        setListData({
          ...listData,
          data: listData.data.map((item) =>
            item._id === reportId ? { ...item, totalComments: res.pagination.totalComments } : item
          ),
        })
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingMoreComments((prev) => ({ ...prev, [reportId]: false }))
    }
  }

  return (
    <main>
      <div className="app-shell">
        <header className="app-header">
          <div>
            <h1 className="app-title">Scam Alert</h1>
            <p className="app-subtitle">
              Report suspicious phone numbers and see how many others have
              reported them. Crowdsourced protection against scams.
            </p>
          </div>
          <div className="badge-live">
            <span className="badge-dot" />
            Live community reports
          </div>
        </header>

        <div className="app-grid">
          <div className="app-grid-left">
            <section className="glass card-left">
              <h2 className="card-title">Report a Scam Number</h2>
              <p className="card-subtitle">
                Your report is anonymous. We only store the phone, category and a
                short description.
              </p>

              <form onSubmit={handleSubmit}>
              <div className="field">
                <label className="field-label">Phone number</label>
                <input
                  type="tel"
                  value={reportPhone}
                  onChange={(e) => {
                    const value = e.target.value
                    setReportPhone(value)
                  }}
                  placeholder="017XXXXXXXX"
                  className="input"
                />
              </div>

              <div className="field">
                <label className="field-label">Scam category</label>
                <select
                  className="select"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label className="field-label">
                  What happened? <span style={{ color: '#6b7280' }}>(optional)</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Example: Asked me to share an OTP for bKash..."
                  className="textarea"
                />
              </div>

              {error && (
                <p className="status-error">{error}</p>
              )}
              {success && (
                <p className="status-success">{success}</p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="btn-primary"
              >
                {submitting ? 'Submitting…' : 'Submit report'}
              </button>
            </form>
            </section>

            <section className="glass map-section">
              <h2 className="map-section-title">Affected areas (last 30 days)</h2>
              <p className="map-section-subtitle">
                Reports with location data; each marker shows how many people reported from that area.
              </p>
              {mapLoading ? (
                <div className="map-placeholder">
                  <span>Loading map…</span>
                </div>
              ) : mapAreas.length === 0 ? (
                <div className="map-placeholder">
                  <span>No location-based reports in the last 30 days.</span>
                </div>
              ) : (
                <AffectedAreasMap areas={mapAreas} />
              )}
            </section>
          </div>

          <section className="glass card-right">
            <div className="number-header" style={{ marginBottom: 12 }}>
              <div>
                <h2 className="card-title">Reported Activity</h2>
                {listData && (
                  <span className="numbers-pill">
                    {listData.stats.totalReports} reports
                  </span>
                )}
              </div>
              <form className="search-row" onSubmit={handleSearch}>
                <input
                  type="tel"
                  placeholder="Search by phone"
                  value={searchPhone}
                  onChange={(e) => setSearchPhone(e.target.value)}
                  className="input"
                />
                <select
                  className="select"
                  value={range}
                  onChange={async (e) => {
                    const value = e.target.value
                    setRange(value)
                    setPage(1)
                    await loadList(searchPhone, value, 1)
                  }}
                >
                  <option value="">All time</option>
                  <option value="today">Today</option>
                  <option value="this_week">This week</option>
                  <option value="this_month">This month</option>
                </select>
                <button type="submit" className="btn-secondary">
                  Search
                </button>
              </form>
            </div>

            {listData && listData.stats.categoryCounts.length > 0 && (
              <div style={{ marginBottom: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {listData.stats.categoryCounts.map((c) => (
                  <span key={c.categoryId} className="pill">
                    <span className="badge-dot" />
                    {c.name || c.slug.replace('_', ' ')} · {c.count}
                  </span>
                ))}
              </div>
            )}

            <div style={{ minHeight: 220 }}>
              {loading && <p className="empty-text">Loading reports…</p>}
              {!loading && (!listData || listData.data.length === 0) && (
                <p className="empty-text">No reports yet. Be the first to report a scam number.</p>
              )}

              {!loading && listData && listData.data.length > 0 && (
                <>
                  <div className="reports-list">
                    {listData.data.map((r) => (
                      <div
                        key={r._id}
                        className="report-card"
                      >
                        <div className="report-header">
                          <div>
                            <div className="report-header-row">
                              <p className="number-phone">{r.phoneNumber}</p>
                              {r.riskLevel && (
                                <span className={`risk-badge risk-${r.riskLevel.toLowerCase()}`}>
                                  {r.riskLevel}
                                </span>
                              )}
                            </div>
                            <p className="number-meta">
                              {r.category?.name || r.category?.slug || 'Unknown category'}
                              {r.totalReportsForNumber != null && (
                                <span className="report-count-meta">
                                  {' '}· {r.totalReportsForNumber} report{r.totalReportsForNumber !== 1 ? 's' : ''}
                                </span>
                              )}
                            </p>
                          </div>
                          <p className="report-time">
                            {new Date(r.createdAt).toLocaleString()}
                          </p>
                        </div>
                        {r.description && (
                          <p className="report-text">{r.description}</p>
                        )}
                        <div className="report-actions">
                          <button
                            type="button"
                            className="action-btn like-btn"
                            onClick={() => handleLike(r._id)}
                            disabled={engagementLoading[r._id]}
                            title="Like"
                          >
                            <span className="action-icon" aria-hidden>👍</span>
                            <span>{r.likesCount ?? 0}</span>
                          </button>
                          <button
                            type="button"
                            className="action-btn dislike-btn"
                            onClick={() => handleDislike(r._id)}
                            disabled={engagementLoading[r._id]}
                            title="Dislike"
                          >
                            <span className="action-icon" aria-hidden>👎</span>
                            <span>{r.dislikesCount ?? 0}</span>
                          </button>
                          <span className="action-label">
                            <span className="action-icon" aria-hidden>💬</span>
                            {r.totalComments ?? 0} comment{(r.totalComments ?? 0) !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="report-comments">
                          {(expandedComments[r._id] ?? r.commentsPreview ?? []).map((c) => (
                            <div key={c._id} className="comment-item">
                              <p className="comment-body">{c.body}</p>
                              <span className="comment-time">
                                {new Date(c.createdAt).toLocaleString()}
                              </span>
                            </div>
                          ))}
                          {(r.totalComments ?? 0) > (expandedComments[r._id] ?? r.commentsPreview ?? []).length && (
                            <button
                              type="button"
                              className="see-more-comments"
                              onClick={() => handleSeeMoreComments(r._id, r)}
                              disabled={loadingMoreComments[r._id]}
                            >
                              {loadingMoreComments[r._id]
                                ? 'Loading…'
                                : `See more (${(r.totalComments ?? 0) - (expandedComments[r._id] ?? r.commentsPreview ?? []).length} more)`}
                            </button>
                          )}
                          <div className="comment-form">
                            <input
                              type="text"
                              placeholder="Write a comment…"
                              className="comment-input"
                              value={commentText[r._id] ?? ''}
                              onChange={(e) =>
                                setCommentText((prev) => ({ ...prev, [r._id]: e.target.value }))
                              }
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault()
                                  handleAddComment(r._id)
                                }
                              }}
                            />
                            <button
                              type="button"
                              className="comment-submit"
                              onClick={() => handleAddComment(r._id)}
                              disabled={submittingComment[r._id] || !(commentText[r._id]?.trim())}
                            >
                              {submittingComment[r._id] ? '…' : 'Comment'}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div
                    style={{
                      marginTop: 10,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: 11,
                      color: '#9ca3af',
                    }}
                  >
                    <span>
                      Page {listData.pagination.page} of{' '}
                      {Math.max(
                        1,
                        Math.ceil(
                          listData.pagination.totalReports / listData.pagination.limit
                        )
                      )}
                    </span>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        type="button"
                        className="btn-secondary"
                        disabled={listData.pagination.page <= 1}
                        onClick={async () => {
                          if (listData.pagination.page <= 1) return
                          const newPage = listData.pagination.page - 1
                          setPage(newPage)
                          await loadList(searchPhone, range, newPage)
                        }}
                      >
                        Prev
                      </button>
                      <button
                        type="button"
                        className="btn-secondary"
                        disabled={
                          listData.pagination.page * listData.pagination.limit >=
                          listData.pagination.totalReports
                        }
                        onClick={async () => {
                          if (
                            listData.pagination.page * listData.pagination.limit >=
                            listData.pagination.totalReports
                          )
                            return
                          const newPage = listData.pagination.page + 1
                          setPage(newPage)
                          await loadList(searchPhone, range, newPage)
                        }}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </section>
        </div>

        <footer
          style={{
            marginTop: 16,
            fontSize: 11,
            color: '#6b7280',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 6,
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>© {new Date().getFullYear()} Scam Alert. All rights reserved.</span>
          <span>
            Built by{' '}
            <a
              href="https://rabiul-hasan-robi.vercel.app/"
              target="_blank"
              rel="noreferrer"
              style={{ color: '#a5b4fc' }}
            >
              Md. Rabiul Hasan
            </a>{' '}
            ·{' '}
            <a
              href="https://www.linkedin.com/in/rabiul-hasan-robi/"
              target="_blank"
              rel="noreferrer"
              style={{ color: '#a5b4fc' }}
            >
              LinkedIn
            </a>{' '}
            ·{' '}
            <a
              href="https://www.facebook.com/officialrabiulrobi/"
              target="_blank"
              rel="noreferrer"
              style={{ color: '#a5b4fc' }}
            >
              Facebook
            </a>
          </span>
        </footer>
      </div>
    </main>
  )
}

