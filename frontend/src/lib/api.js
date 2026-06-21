import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
})

export async function suggestPrompts(imageFile) {
  const form = new FormData()
  form.append('file', imageFile)
  const { data } = await api.post('/generate/prompts', form)
  return data
}

export async function generateVideo({
  prompt,
  styleId,
  themeId,
  characterPresetId,
  audioPresetId,
  productImage,
  characterImage,
  audioFile,
}) {
  const form = new FormData()
  form.append('prompt', prompt)
  form.append('style_id', styleId)
  form.append('theme_id', themeId)
  if (characterPresetId) form.append('character_preset_id', characterPresetId)
  if (audioPresetId) form.append('audio_preset_id', audioPresetId)
  if (productImage) form.append('product_image', productImage)
  if (characterImage) form.append('character_image', characterImage)
  if (audioFile) form.append('audio_file', audioFile)

  const { data } = await api.post('/generate/video', form, { timeout: 60000 })
  return data
}

export async function getStatus(requestId) {
  const { data } = await api.get(`/generate/status/${requestId}`)
  return data
}

export async function getVideo(requestId) {
  const { data } = await api.get(`/videos/${requestId}`)
  return data
}

export async function getPresetCharacters() {
  const { data } = await api.get('/assets/presets/characters')
  return data.characters
}

export async function getPresetAudio() {
  const { data } = await api.get('/assets/presets/audio')
  return data.audio
}

export async function uploadImage(file, assetType = 'product', requestId = null) {
  const form = new FormData()
  form.append('file', file)
  form.append('asset_type', assetType)
  if (requestId) form.append('request_id', requestId)
  const { data } = await api.post('/assets/upload/image', form)
  return data
}

export async function uploadAudio(file, requestId = null) {
  const form = new FormData()
  form.append('file', file)
  if (requestId) form.append('request_id', requestId)
  const { data } = await api.post('/assets/upload/audio', form)
  return data
}

export default api
