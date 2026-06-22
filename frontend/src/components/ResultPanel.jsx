import {
  Check,
  Copy,
  Download,
  ExternalLink,
  Loader2,
  MapPin,
  Quote,
  RotateCcw,
  Share2,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import QRCode from 'react-qr-code';
import { Link } from 'react-router-dom';
import { getStatus } from '../lib/api.js';

const LANG_NAMES = {
  en: 'English',
  hi: 'Hindi',
  ta: 'Tamil',
  te: 'Telugu',
  kn: 'Kannada',
  ml: 'Malayalam',
  bn: 'Bengali',
  mr: 'Marathi',
  gu: 'Gujarati',
  pa: 'Punjabi',
};

export default function ResultPanel({
  requestData: initial,
  selectedTemplate,
  dialogueText,
  selectedLanguage,
  onReset,
}) {
  const [data, setData] = useState(initial);
  const [copied, setCopied] = useState(false);

  const isDone = data.status === 'completed' || data.status === 'failed';
  const videoUrl = data.video_url;
  const qrUrl = data.qr_code_url;
  const videoPageUrl = data.video_page_url || `${window.location.origin}/video/${data.request_id}`;

  useEffect(() => {
    if (isDone) return;
    const t = setInterval(async () => {
      try {
        const updated = await getStatus(data.request_id);
        setData(updated);
        if (updated.status === 'completed' || updated.status === 'failed') clearInterval(t);
      } catch {}
    }, 5000);
    return () => clearInterval(t);
  }, [data.request_id, isDone]);

  function copyLink() {
    navigator.clipboard.writeText(videoPageUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* Header */}
      <div className="g-rainbow-bar" />
      <header className="bg-[#0A0A0A]/95 border-b border-white/[0.06] sticky top-0 z-50 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg width="32" height="32" viewBox="0 0 34 34" fill="none">
              <rect width="34" height="34" rx="9" fill="#111" />
              <circle
                cx="17"
                cy="17"
                r="10"
                fill="none"
                stroke="#4285F4"
                strokeWidth="1"
                opacity="0.25"
              />
              <circle
                cx="17"
                cy="17"
                r="7"
                fill="none"
                stroke="#4285F4"
                strokeWidth="1.5"
                opacity="0.6"
              />
              <circle cx="17" cy="17" r="3.5" fill="#4285F4" opacity="0.9" />
              <circle cx="17" cy="17" r="1.5" fill="white" />
            </svg>
            <span className="text-[15px] font-semibold text-white tracking-tight">
              The Omni Portal
            </span>
          </div>
          <button onClick={onReset} className="btn-outlined text-sm gap-2">
            <RotateCcw className="w-3.5 h-3.5" /> Create another
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Status banner */}
        <StatusBanner status={data.status} progress={data.progress} requestId={data.request_id} />

        <div className="grid lg:grid-cols-3 gap-8 mt-6">
          {/* Left: Video + details */}
          <div className="lg:col-span-2 space-y-4">
            {/* Video player */}
            <div className="relative aspect-video bg-[#0D0D0D] rounded-2xl overflow-hidden border border-white/[0.07]">
              {videoUrl ? (
                <>
                  <video
                    src={videoUrl}
                    controls
                    autoPlay
                    loop
                    className="w-full h-full object-contain"
                  />
                  {!isDone && (
                    <div className="absolute bottom-3 left-3 right-3">
                      <div className="bg-[#0A0A0A]/88 backdrop-blur-sm rounded-xl px-3 py-2.5 border border-white/[0.08]">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs text-white/55 flex items-center gap-1.5">
                            <Loader2 className="w-3 h-3 inline animate-spin text-[#4285F4]" />
                            Generating your video with Omni…
                          </span>
                          <span className="text-xs text-white/35 tabular-nums">
                            {data.progress ?? 0}%
                          </span>
                        </div>
                        <div className="g-progress-track">
                          <div
                            className="g-progress-fill"
                            style={{ width: `${data.progress ?? 5}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                  <div className="w-12 h-12 border-2 border-[#4285F4] border-t-transparent rounded-full animate-spin" />
                  <div className="text-center">
                    <p className="text-sm text-white/65 font-medium">
                      Omni is generating your video
                    </p>
                    <p className="text-xs text-white/30 mt-1">
                      {data.progress ?? 0}% · Takes 3–8 minutes
                    </p>
                  </div>
                  {(data.progress ?? 0) > 0 && (
                    <div className="w-48">
                      <div className="g-progress-track">
                        <div className="g-progress-fill" style={{ width: `${data.progress}%` }} />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 flex-wrap">
              {videoUrl && isDone && (
                <a href={videoUrl} download className="btn-primary">
                  <Download className="w-4 h-4" /> Download video
                </a>
              )}
              <button
                onClick={() => navigator.share?.({ url: videoPageUrl, title: 'My Omni Video' })}
                className="btn-outlined"
              >
                <Share2 className="w-4 h-4" /> Share
              </button>
              <Link to={`/video/${data.request_id}`} className="btn-outlined">
                <ExternalLink className="w-4 h-4" /> Full page
              </Link>
            </div>

            {/* Scenario card */}
            {selectedTemplate && selectedTemplate.id !== 'custom' && (
              <div className="rounded-2xl border border-white/[0.07] bg-[#111] overflow-hidden">
                <div className="h-0.5 w-full" style={{ background: selectedTemplate.accent }} />
                <div className="p-4 space-y-2">
                  <p className="g-label">Scenario</p>
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">{selectedTemplate.emoji}</span>
                    <span className="text-sm font-semibold text-white">
                      {selectedTemplate.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-white/38">
                    <MapPin
                      className="w-3 h-3 flex-shrink-0"
                      style={{ color: selectedTemplate.accent }}
                    />
                    {selectedTemplate.location}
                  </div>
                </div>
              </div>
            )}

            {/* Dialogue card */}
            {dialogueText?.trim() && (
              <div className="rounded-2xl border border-white/[0.07] bg-[#111] overflow-hidden">
                <div className="h-0.5 w-full bg-[#4285F4]" />
                <div className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="g-label">Dialogue</p>
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full border border-white/[0.08] text-white/38">
                      {LANG_NAMES[selectedLanguage] ?? selectedLanguage}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Quote className="w-4 h-4 flex-shrink-0 text-[#4285F4] mt-0.5" />
                    <p
                      className="text-sm text-white/75 leading-relaxed italic"
                      lang={selectedLanguage}
                    >
                      {dialogueText}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Prompt card */}
            <div className="g-card">
              <p className="g-label">Prompt</p>
              <p className="text-sm text-white/55 leading-relaxed">{data.prompt}</p>
            </div>
          </div>

          {/* Right: QR + details */}
          <div className="space-y-4">
            {/* QR code */}
            <div className="g-card text-center space-y-4">
              <div>
                <p className="text-sm font-semibold text-white mb-1">Scan to view &amp; download</p>
                <p className="text-xs text-white/35">
                  {isDone
                    ? 'Video is ready on any device'
                    : 'QR ready — video generates in background'}
                </p>
              </div>

              {qrUrl ? (
                <img
                  src={qrUrl}
                  alt="QR code"
                  className="w-44 h-44 mx-auto rounded-2xl border border-white/[0.07]"
                />
              ) : (
                <div className="bg-white rounded-2xl p-3 inline-block">
                  <QRCode value={videoPageUrl} size={160} />
                </div>
              )}

              {/* Copy link */}
              <div className="flex gap-2 text-left">
                <input value={videoPageUrl} readOnly className="g-input flex-1 py-2 text-xs" />
                <button
                  onClick={copyLink}
                  className={[
                    'px-3 py-2 rounded-xl text-xs border transition-all duration-150 flex-shrink-0',
                    copied
                      ? 'bg-[#34A853]/15 border-[#34A853]/35 text-[#34A853]'
                      : 'border-white/[0.12] text-white/40 hover:border-white/[0.20]',
                  ].join(' ')}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              {copied && <p className="text-xs text-[#34A853] -mt-1">Copied!</p>}
            </div>

            {/* Request details */}
            <div className="g-card space-y-2.5">
              <p className="g-label">Details</p>
              <Row label="Request ID" value={data.request_id?.slice(0, 12) + '…'} mono />
              <Row label="Status" value={data.status} status={data.status} />
              <Row label="Progress" value={`${data.progress ?? 0}%`} />
              <Row label="Created" value={formatDate(data.created_at)} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBanner({ status, progress, requestId }) {
  const cfg = {
    pending: {
      bg: 'rgba(251,188,5,0.06)',
      border: 'rgba(251,188,5,0.15)',
      color: '#FBBC05',
      msg: 'Request queued',
    },
    processing: {
      bg: 'rgba(66,133,244,0.06)',
      border: 'rgba(66,133,244,0.15)',
      color: '#4285F4',
      msg: 'Generating video with Omni…',
    },
    completed: {
      bg: 'rgba(52,168,83,0.06)',
      border: 'rgba(52,168,83,0.15)',
      color: '#34A853',
      msg: 'Your video is ready',
    },
    failed: {
      bg: 'rgba(234,67,53,0.06)',
      border: 'rgba(234,67,53,0.15)',
      color: '#EA4335',
      msg: 'Generation failed',
    },
  }[status] ?? {
    bg: 'rgba(255,255,255,0.04)',
    border: 'rgba(255,255,255,0.08)',
    color: '#EBEBEB',
    msg: status,
  };

  return (
    <div
      className="flex items-center gap-3 px-5 py-3.5 rounded-2xl border"
      style={{ background: cfg.bg, borderColor: cfg.border }}
    >
      {status === 'processing' && (
        <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" style={{ color: cfg.color }} />
      )}
      {status === 'completed' && (
        <Check className="w-4 h-4 flex-shrink-0" style={{ color: cfg.color }} />
      )}
      <div className="flex-1">
        <p className="text-sm font-semibold" style={{ color: cfg.color }}>
          {cfg.msg}
        </p>
        <p className="text-xs text-white/30 font-mono mt-0.5">{requestId}</p>
      </div>
      {status === 'processing' && (
        <span className="text-sm font-semibold tabular-nums" style={{ color: cfg.color }}>
          {progress ?? 0}%
        </span>
      )}
    </div>
  );
}

function Row({ label, value, mono, status }) {
  const statusColor = {
    completed: '#34A853',
    failed: '#EA4335',
    processing: '#4285F4',
    pending: '#FBBC05',
  }[status];

  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-white/35">{label}</span>
      <span
        className={mono ? 'font-mono text-xs text-white/75' : 'text-white/80'}
        style={statusColor ? { color: statusColor } : {}}
      >
        {value}
      </span>
    </div>
  );
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString();
}
