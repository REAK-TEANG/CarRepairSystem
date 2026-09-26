import { useRef } from 'react'
import { UploadSimple, X, Image as ImageIcon } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

/**
 * Reusable Image Upload Component with live Base64 preview & file picker.
 *
 * @param {Object} props
 * @param {string} props.value - Current image data URL or URL
 * @param {function} props.onChange - Callback with new image base64 data URL (or empty string)
 * @param {string} [props.label="Image Photo (Optional)"] - Field label
 * @param {'card'|'circle'} [props.shape='card'] - Preview frame shape
 * @param {string} [props.className] - Additional wrapper class names
 */
export default function ImageUpload({
  value = '',
  onChange,
  label = 'Image Photo (Optional)',
  uploadText = 'Upload Photo',
  shape = 'card',
  className = '',
}) {
  const fileInputRef = useRef(null)

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      onChange(event.target?.result || '')
    }
    reader.readAsDataURL(file)
  }

  const handleClear = () => {
    onChange('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className={`space-y-1.5 font-sans ${className}`}>
      {label && <Label className="block text-app-muted font-medium text-xs">{label}</Label>}

      {shape === 'circle' ? (
        <div className="flex items-center gap-3">
          {value ? (
            <div className="relative group">
              <img
                src={value}
                alt="Profile Preview"
                className="w-12 h-12 rounded-full object-cover border border-app-border"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                onClick={handleClear}
                className="absolute -top-1 -right-1 w-4 h-4 p-0 rounded-full shadow-sm"
                title="Remove photo"
              >
                <X size={10} weight="bold" />
              </Button>
            </div>
          ) : (
            <div className="w-12 h-12 rounded-full bg-app-input border border-dashed border-app-border flex items-center justify-center text-[10px] text-app-muted text-center flex-shrink-0">
              No Image
            </div>
          )}

          <div className="flex-1">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="block w-full text-xs text-app-muted file:mr-3 file:py-1.5 file:px-3 file:rounded-sm file:border-0 file:text-xs file:font-semibold file:bg-app-accent/10 file:text-app-accent hover:file:bg-app-accent/20 cursor-pointer"
            />
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-3">
          {value ? (
            <div className="relative w-24 h-16 rounded-sm overflow-hidden border border-app-border bg-app-hover flex-shrink-0 group">
              <img src={value} alt="Preview" className="w-full h-full object-cover" />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleClear}
                className="absolute top-1 right-1 w-5 h-5 p-0 bg-black/70 hover:bg-black text-white rounded-md transition-colors"
                title="Remove photo"
              >
                <X size={12} weight="bold" />
              </Button>
            </div>
          ) : (
            <div className="w-24 h-16 rounded-sm border border-dashed border-app-border bg-app-input flex flex-col items-center justify-center text-app-muted flex-shrink-0">
              <ImageIcon size={18} weight="light" />
              <span className="text-[9px] mt-0.5">No photo</span>
            </div>
          )}

          <div className="flex-1 space-y-1">
            <label className="flex items-center justify-center gap-1.5 px-3 py-2 border border-dashed border-app-border hover:border-app-accent rounded-sm bg-app-input hover:bg-app-hover active:scale-[0.98] cursor-pointer transition-colors text-xs text-app-muted hover:text-app-text">
              <UploadSimple size={14} weight="bold" className="text-app-accent" />
              <span>{value ? 'Change Photo' : uploadText}</span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
            <p className="text-[10px] text-app-muted">PNG, JPG or WebP. Max 10MB.</p>
          </div>
        </div>
      )}
    </div>
  )
}
