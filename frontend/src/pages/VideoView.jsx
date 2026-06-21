import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Download, Share2, Check, Loader2, XCircle, QrCode } from 'lucide-react'
import QRCode from 'react-qr-code'
import { getVideo } from '../lib/api.js'

const STATUS_CFG = {
  pending:    { label: 'Queued',      color: '#FBBC05', bg: 'rgba(251,188,5,0.06)',    border: 'rgba(251,188,5,0.15)' },
  processing: { label: 'Generating',  color: '#4285F4', bg: 'rgba(66,133,244,0.06)',   border: 'rgba(66,133,244,0.15)' },
  completed:  { label: 'Ready',       color: '#34A853', bg: 'rgba(52,168,83,0.06)',    border: 'rgba(52,168,83,0.15)' },
  failed:     { label: 'Failed',      color: '#EA4335', bg: 'rgba(234,67,53,0.06)',    border: 'rgba(234,67,53,0.15)' },
}

export default function VideoView() {
  const { requestId } = useParams()
  const [video, setVideo]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  useEffect(() => { load() }, [requestId])

  useEffect(() => {
    if (video?.status !== 'processing' && video?.status !== 'pending') return
    const t = setInterval(async () => {
      try {
        const d = await getVideo(requestId)
        setVideo(d)
        if (d.status === 'completed' || d.status === 'failed') clearInterval(t)
      } catch {}
    }, 6000)
    return () => clearInterval(t)
  }, [video?.status, requestId])

  async function load() {
    try { setVideo(await getVideo(requestId)) }
    catch { setError('Video not found') }
    finally { setLoading(false) }
  }

  const pageUrl = window.location.href
  const s = video ? (STATUS_CFG[video.status] ?? STATUS_CFG.pending) : null

  if (loading) return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="w-10 h-10 border-2 border-[#4285F4] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-white/40">Loading…</p>
      </div>
    </div>
  )

  if (error || !video) return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center text-center px-6">
      <div>
        <XCircle className="w-14 h-14 text-[#EA4335] mx-auto mb-4" strokeWidth={1.5} />
        <h2 className="text-2xl font-bold text-white mb-2">Video not found</h2>
        <p className="text-white/45 text-sm mb-6">{error}</p>
        <Link to="/" className="btn-primary">
          <ArrowLeft className="w-4 h-4" /> Create a new video
        </Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0A0A0A]">

      {/* Header */}
      <div className="g-rainbow-bar" />
      <header className="bg-[#0A0A0A]/95 border-b border-white/[0.06] sticky top-0 z-50 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg width="32" height="32" viewBox="0 0 34 34" fill="none">
              <rect width="34" height="34" rx="9" fill="#111"/>
              <circle cx="17" cy="17" r="10" fill="none" stroke="#4285F4" strokeWidth="1" opacity="0.25"/>
              <circle cx="17" cy="17" r="7" fill="none" stroke="#4285F4" strokeWidth="1.5" opacity="0.6"/>
              <circle cx="17" cy="17" r="3.5" fill="#4285F4" opacity="0.9"/>
              <circle cx="17" cy="17" r="1.5" fill="white"/>
            </svg>
            <span className="text-[15px] font-semibold text-white tracking-tight">The Omni Portal</span>
          </div>
          <Link to="/" className="btn-outlined text-sm gap-2">
            <ArrowLeft className="w-3.5 h-3.5" /> Create new
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">

        {/* Title + badge */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">Generated video</h1>
          <div
            className="g-badge border text-xs"
            style={{ color: s.color, background: s.bg, borderColor: s.border }}
          >
            {video.status === 'processing' && <Loader2 className="w-3 h-3 animate-spin" />}
            {video.status === 'completed'  && <Check className="w-3 h-3" />}
            {s.label}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">

          {/* Video */}
          <div className="lg:col-span-2 space-y-4">
            <div className="aspect-video bg-[#0D0D0D] rounded-2xl overflow-hidden border border-white/[0.07] flex items-center justify-center">
              {video.status === 'completed' && video.video_url ? (
                <video
                  src={video.video_url}
                  controls autoPlay loop
                  className="w-full h-full object-contain"
                  poster={video.product_image_url}
                />
              ) : video.status === 'processing' || video.status === 'pending' ? (
                <div className="text-center space-y-3">
                  <div className="w-10 h-10 border-2 border-[#4285F4] border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-sm text-white/50">Omni is generating your video…</p>
                  {video.progress > 0 && (
                    <div className="w-40 mx-auto">
                      <div className="g-progress-track">
                        <div className="g-progress-fill" style={{ width: `${video.progress}%` }} />
                      </div>
                      <p className="text-xs text-white/28 mt-1.5 text-center">{video.progress}%</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center">
                  <XCircle className="w-10 h-10 text-[#EA4335] mx-auto mb-2" strokeWidth={1.5} />
                  <p className="text-sm text-[#EA4335]">Generation failed</p>
                  {video.error && <p className="text-xs text-white/35 mt-1">{video.error}</p>}
                </div>
              )}
            </div>

            {video.status === 'completed' && video.video_url && (
              <div className="flex gap-3">
                <a href={video.video_url} download className="btn-primary">
                  <Download className="w-4 h-4" /> Download
                </a>
                <button
                  onClick={() => navigator.share?.({ url: pageUrl })}
                  className="btn-outlined"
                >
                  <Share2 className="w-4 h-4" /> Share
                </button>
              </div>
            )}

            {video.prompt && (
              <div className="g-card">
                <p className="g-label">Prompt</p>
                <p className="text-sm text-white/60 leading-relaxed">{video.prompt}</p>
                {(video.style_id || video.theme_id) && (
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {video.style_id && (
                      <span className="g-chip text-xs cursor-default py-1">{video.style_id}</span>
                    )}
                    {video.theme_id && (
                      <span className="g-chip text-xs cursor-default py-1">{video.theme_id}</span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">

            {/* QR */}
            <div className="g-card text-center space-y-3">
              <div className="flex items-center gap-2 justify-center">
                <QrCode className="w-4 h-4 text-white/35" />
                <span className="text-sm font-medium text-white">Share via QR</span>
              </div>
              <div className="bg-white rounded-2xl p-3 inline-block">
                <QRCode value={pageUrl} size={148} />
              </div>
              <p className="text-xs text-white/30">Scan to open on any device</p>
            </div>

            {/* Request info */}
            <div className="g-card space-y-2.5">
              <p className="g-label">Details</p>
              <Row label="Request ID" value={requestId.slice(0,8) + '…'} mono />
              <Row label="Status"     value={s.label} color={s.color} />
              <Row label="Created"    value={formatDate(video.created_at)} />
            </div>

            {video.product_image_url && (
              <div className="g-card">
                <p className="g-label">Product</p>
                <img
                  src={video.product_image_url}
                  alt="Product"
                  className="w-full aspect-square object-contain rounded-xl bg-[#0D0D0D] border border-white/[0.05]"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value, mono, color }) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-white/35">{label}</span>
      <span
        className={mono ? 'font-mono text-xs text-white/65' : 'text-white/75'}
        style={color ? { color } : {}}
      >
        {value}
      </span>
    </div>
  )
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString()
}
