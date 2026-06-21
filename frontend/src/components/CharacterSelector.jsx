import React, { useRef, useState, useCallback } from 'react'
import Webcam from 'react-webcam'
import clsx from 'clsx'
import { Camera, Upload, RefreshCcw, Check, X } from 'lucide-react'

const PRESET_CHARS = [
  { id: 'char_01', name: 'Business Pro', gender: 'M', avatar: '👨‍💼', bg: '#1A237E', img: '/assets/characters/char_01.svg' },
  { id: 'char_02', name: 'Business Pro', gender: 'F', avatar: '👩‍💼', bg: '#4A148C', img: '/assets/characters/char_02.svg' },
  { id: 'char_03', name: 'Creative',     gender: 'M', avatar: '👨‍🎨', bg: '#BF360C', img: '/assets/characters/char_03.svg' },
  { id: 'char_04', name: 'Creative',     gender: 'F', avatar: '👩‍🎨', bg: '#880E4F', img: '/assets/characters/char_04.svg' },
  { id: 'char_05', name: 'Tech',         gender: '',  avatar: '🧑‍💻', bg: '#1B5E20', img: '/assets/characters/char_05.svg' },
  { id: 'char_06', name: 'Influencer',   gender: '',  avatar: '🌟',   bg: '#E65100', img: '/assets/characters/char_06.svg' },
]

const TABS = [
  { id: 'preset', label: 'Presets',  Icon: null },
  { id: 'camera', label: 'Camera',   Icon: Camera },
  { id: 'upload', label: 'Upload',   Icon: Upload },
]

export default function CharacterSelector({
  selectedCharacter, setSelectedCharacter,
  characterImageFile, setCharacterImageFile,
}) {
  const fileRef    = useRef()
  const webcamRef  = useRef()
  const [tab, setTab]                     = useState('preset')
  const [cameraActive, setCameraActive]   = useState(false)
  const [captured, setCaptured]           = useState(null)
  const [uploadPreview, setUploadPreview] = useState(null)

  const capture = useCallback(() => {
    const src = webcamRef.current?.getScreenshot()
    if (!src) return
    setCaptured(src)
    setCameraActive(false)
    fetch(src).then(r => r.blob()).then(blob => {
      setCharacterImageFile(new File([blob], 'capture.jpg', { type: 'image/jpeg' }))
      setSelectedCharacter(null)
    })
  }, [webcamRef])

  function handleUpload(file) {
    if (!file?.type.startsWith('image/')) return
    setUploadPreview(URL.createObjectURL(file))
    setCharacterImageFile(file)
    setSelectedCharacter(null)
    setCaptured(null)
  }

  function resetCustom() {
    setCaptured(null); setUploadPreview(null)
    setCharacterImageFile(null); setCameraActive(false)
  }

  function switchTab(id) {
    setTab(id)
    resetCustom()
    setSelectedCharacter(null)
  }

  const hasCustom = !!captured || !!uploadPreview

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <span className="g-step-label">Step 3 of 5</span>
        <h2 className="g-step-title">Choose your presenter</h2>
        <p className="g-step-sub">Select a preset avatar or use your own photo via camera or upload.</p>
      </div>

      {/* Tabs */}
      <div className="g-tab-bar mb-6">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => switchTab(id)}
            className={clsx('g-tab flex items-center gap-1.5', tab === id && 'g-tab-active')}
          >
            {Icon && <Icon className="w-3.5 h-3.5" />}
            {label}
          </button>
        ))}
      </div>

      {/* Preset grid */}
      {tab === 'preset' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {PRESET_CHARS.map((c) => {
            const selected = selectedCharacter?.id === c.id
            return (
              <button
                key={c.id}
                onClick={() => { setSelectedCharacter(c); resetCustom() }}
                className={clsx(
                  'g-card-hover flex flex-col items-center gap-3 text-center p-4',
                  selected && 'g-card-selected',
                )}
              >
                {/* Avatar: SVG image with emoji fallback */}
                <div className="relative w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0"
                  style={{ background: c.bg }}>
                  <img
                    src={c.img}
                    alt={`${c.name} ${c.gender}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                      e.currentTarget.nextSibling.style.display = 'flex'
                    }}
                  />
                  <div
                    className="absolute inset-0 items-center justify-center text-3xl"
                    style={{ display: 'none' }}
                  >
                    {c.avatar}
                  </div>
                  {selected && (
                    <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-[#4285F4] flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" strokeWidth={3} />
                    </div>
                  )}
                </div>
                <div className="min-w-0 w-full">
                  <div className="text-sm text-white font-medium leading-tight">{c.name}</div>
                  {c.gender && (
                    <div className="text-xs text-white/38 mt-0.5">{c.gender === 'M' ? 'Male' : 'Female'}</div>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* Camera */}
      {tab === 'camera' && (
        <div className="max-w-sm mx-auto text-center space-y-4">
          {!captured && !cameraActive && (
            <div className="g-card py-12 space-y-4">
              <div className="w-16 h-16 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mx-auto">
                <Camera className="w-7 h-7 text-white/30" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-white font-medium mb-1">Use your camera</p>
                <p className="text-sm text-white/40">Take a photo to use as the presenter</p>
              </div>
              <button onClick={() => setCameraActive(true)} className="btn-tonal">Open camera</button>
            </div>
          )}

          {cameraActive && (
            <div className="space-y-3">
              <div className="rounded-2xl overflow-hidden border border-white/[0.08]">
                <Webcam
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  className="w-full"
                  mirrored
                  videoConstraints={{ facingMode: 'user' }}
                />
              </div>
              <div className="flex gap-2 justify-center">
                <button onClick={capture} className="btn-primary">
                  <Camera className="w-4 h-4" /> Capture
                </button>
                <button onClick={() => setCameraActive(false)} className="btn-outlined">
                  <X className="w-4 h-4" /> Cancel
                </button>
              </div>
            </div>
          )}

          {captured && (
            <div className="space-y-3">
              <div className="rounded-2xl overflow-hidden border border-white/[0.08]">
                <img src={captured} alt="Captured" className="w-full" />
              </div>
              <div className="flex items-center justify-center gap-1.5 text-[#34A853] text-sm">
                <Check className="w-4 h-4" /> Photo captured
              </div>
              <button
                onClick={() => { setCaptured(null); setCameraActive(true) }}
                className="btn-text"
              >
                <RefreshCcw className="w-3.5 h-3.5" /> Retake
              </button>
            </div>
          )}
        </div>
      )}

      {/* Upload */}
      {tab === 'upload' && (
        <div
          className="max-w-sm mx-auto rounded-2xl border border-dashed border-white/[0.10] bg-[#111] text-center cursor-pointer hover:border-white/[0.20] hover:bg-[#161616] transition-all duration-200"
          onClick={() => fileRef.current?.click()}
        >
          {!uploadPreview ? (
            <div className="py-14 px-6 space-y-3">
              <div className="w-14 h-14 rounded-full bg-white/[0.04] border border-white/[0.07] flex items-center justify-center mx-auto">
                <Upload className="w-6 h-6 text-white/28" strokeWidth={1.5} />
              </div>
              <p className="text-white font-medium">Upload character image</p>
              <p className="text-xs text-white/35">JPEG · PNG · WebP · Max 10 MB</p>
            </div>
          ) : (
            <div className="py-6 px-6 space-y-3">
              <img src={uploadPreview} alt="Character" className="w-28 h-28 object-cover rounded-2xl mx-auto border border-white/[0.08]" />
              <div className="flex items-center justify-center gap-1.5 text-[#34A853] text-sm">
                <Check className="w-4 h-4" /> Image ready
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); resetCustom() }}
                className="btn-text text-xs"
              >
                Change image
              </button>
            </div>
          )}
          <input ref={fileRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => handleUpload(e.target.files[0])} />
        </div>
      )}

      {/* Selection confirmation */}
      {(selectedCharacter || hasCustom) && (
        <div className="mt-6 flex items-center gap-2 text-[#34A853] text-sm">
          <Check className="w-4 h-4 flex-shrink-0" />
          <span>
            {selectedCharacter
              ? `${selectedCharacter.name}${selectedCharacter.gender ? ' (' + (selectedCharacter.gender === 'M' ? 'Male' : 'Female') + ')' : ''} selected`
              : captured ? 'Camera photo selected' : 'Uploaded image selected'}
          </span>
        </div>
      )}
    </div>
  )
}
