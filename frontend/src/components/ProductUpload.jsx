import React, { useRef, useState } from 'react'
import { ImagePlus, X, Sparkles, Loader2, CloudUpload } from 'lucide-react'
import { suggestPrompts } from '../lib/api.js'

export default function ProductUpload({
  testMode, productImage, setProductImage,
  setProductImageFile, aiSuggestions, setAiSuggestions,
}) {
  const fileRef   = useRef()
  const [dragging, setDragging]   = useState(false)
  const [analyzing, setAnalyzing] = useState(false)

  function handleFile(file) {
    if (!file || !file.type.startsWith('image/')) return
    setProductImage(URL.createObjectURL(file))
    setProductImageFile(file)
    setAiSuggestions(null)
    analyzeImage(file)
  }

  async function analyzeImage(file) {
    setAnalyzing(true)
    try {
      setAiSuggestions(await suggestPrompts(file))
    } catch { /* silent — step 2 falls back to presets */ }
    finally { setAnalyzing(false) }
  }

  const dropProps = {
    onDragOver:  (e) => { e.preventDefault(); setDragging(true)  },
    onDragLeave: ()  => setDragging(false),
    onDrop: (e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]) },
  }

  return (
    <div className="max-w-lg mx-auto animate-slide-up">

      <div className="mb-6">
        <h2 className="text-xl font-normal text-[#E3E3E3] mb-1">Upload your product image</h2>
        <p className="text-sm text-[rgba(255,255,255,0.50)]">
          Nano Banana will silently suggest styles and prompts for the next step.
        </p>
      </div>

      {/* Drop zone */}
      <div
        {...dropProps}
        onClick={() => fileRef.current?.click()}
        className={[
          'border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-200',
          'flex flex-col items-center justify-center',
          dragging
            ? 'border-[#4285F4]/60 bg-[#4285F4]/5'
            : productImage
              ? 'border-white/[0.07] bg-[#111] p-4'
              : 'border-white/[0.10] bg-[#111] hover:border-white/[0.18] hover:bg-[#161616] p-16',
        ].join(' ')}
      >
        {productImage ? (
          <div className="relative w-full">
            <img
              src={productImage}
              alt="Product"
              className="w-full max-h-64 object-contain rounded-xl"
            />

            {/* Remove button */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                setProductImage(null); setProductImageFile(null); setAiSuggestions(null)
              }}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-[#212121] border border-[#373737]
                         flex items-center justify-center hover:border-[#555] transition-colors"
            >
              <X className="w-3.5 h-3.5 text-[#E3E3E3]" />
            </button>

            {/* Status pill */}
            <div className="absolute bottom-3 left-3">
              {analyzing ? (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-black/80 rounded-full border border-white/[0.10] text-xs text-white/65">
                  <Loader2 className="w-3 h-3 animate-spin text-[#4285F4]" />
                  Analyzing with Gemini…
                </div>
              ) : aiSuggestions ? (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-black/80 rounded-full border border-white/[0.10] text-xs text-[#34A853]">
                  <Sparkles className="w-3 h-3" />
                  Suggestions ready
                </div>
              ) : null}
            </div>
          </div>
        ) : (
          <>
            <CloudUpload className="w-10 h-10 text-[rgba(255,255,255,0.25)] mb-4" strokeWidth={1.5} />
            <p className="text-sm text-[#E3E3E3] mb-1">Drop image here or click to browse</p>
            <p className="text-xs text-[rgba(255,255,255,0.38)]">JPEG · PNG · WebP · Max 10 MB</p>
          </>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files[0])}
      />

      {testMode && (
        <p className="mt-4 text-xs text-[rgba(255,255,255,0.38)] text-center">
          Test mode — Gemini analysis uses mock data. No GCP calls.
        </p>
      )}
    </div>
  )
}
