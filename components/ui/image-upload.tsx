'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react'

interface ImageUploadProps {
  value?: string
  onChange: (url: string) => void
  onRemove?: () => void
  placeholder?: string
  className?: string
}

export function ImageUpload({
  value,
  onChange,
  onRemove,
  placeholder = 'Upload an image',
  className = '',
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setError(null)
    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Upload failed')
      }

      const data = await response.json()
      onChange(data.url)
    } catch (err) {
      console.error('Upload error:', err)
      setError(err instanceof Error ? err.message : 'Failed to upload image')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemove = () => {
    onChange('')
    onRemove?.()
    setError(null)
  }

  if (value) {
    return (
      <div className={`relative group ${className}`}>
        <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-border bg-surface">
          <Image
            src={value}
            alt="Uploaded image"
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={handleRemove}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Remove
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleUpload}
        className="hidden"
        id="image-upload"
        disabled={isUploading}
      />
      <label htmlFor="image-upload">
        <div className="cursor-pointer">
          <div className="flex items-center justify-center w-full aspect-video rounded-lg border-2 border-dashed border-border hover:border-primary-light dark:hover:border-primary-dark bg-surface hover:bg-surface-alt dark:hover:bg-surface-alt-dark transition-colors">
            <div className="text-center p-6">
              {isUploading ? (
                <>
                  <Loader2 className="mx-auto h-8 w-8 animate-spin text-text-secondary" />
                  <p className="mt-2 text-sm text-text-secondary">Uploading...</p>
                </>
              ) : (
                <>
                  <ImageIcon className="mx-auto h-8 w-8 text-text-secondary" />
                  <p className="mt-2 text-sm font-medium">{placeholder}</p>
                  <p className="mt-1 text-xs text-text-secondary">
                    Click to upload • Max 5MB
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </label>
      {error && (
        <p className="mt-2 text-sm text-error dark:text-error-dark">{error}</p>
      )}
    </div>
  )
}