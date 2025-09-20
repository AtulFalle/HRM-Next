"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { 
  Eye, 
  Download, 
  FileText, 
  Image as ImageIcon,
  X
} from "lucide-react"

interface ImagePreviewProps {
  src: string
  alt: string
  fileName?: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
  showActions?: boolean
  onView?: () => void
  onDownload?: () => void
  onRemove?: () => void
  disabled?: boolean
}

const sizeClasses = {
  sm: 'w-32 h-24',
  md: 'w-48 h-36', 
  lg: 'w-64 h-48'
}

export function ImagePreview({
  src,
  alt,
  fileName,
  className,
  size = 'md',
  showActions = true,
  onView,
  onDownload,
  onRemove,
  disabled = false
}: ImagePreviewProps) {
  const [imageError, setImageError] = React.useState(false)
  const [isHovered, setIsHovered] = React.useState(false)

  const isImage = src.startsWith('data:image/') || src.match(/\.(jpg|jpeg|png|gif|webp)$/i)
  const isPdf = src.startsWith('data:application/pdf') || src.match(/\.pdf$/i)

  const handleView = () => {
    if (onView) {
      onView()
    } else {
      window.open(src, '_blank')
    }
  }

  const handleDownload = () => {
    if (onDownload) {
      onDownload()
    } else {
      const link = document.createElement('a')
      link.href = src
      link.download = fileName || alt || 'download'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  return (
    <div 
      className={cn(
        "relative group inline-block",
        sizeClasses[size],
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Main container */}
      <div className="relative w-full h-full bg-gray-50 border-2 border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300">
        
        {/* Image or file preview */}
        {isImage && !imageError ? (
          <img
            src={src}
            alt={alt}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
            <div className="text-center p-4">
              {isPdf ? (
                <FileText className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              ) : (
                <ImageIcon className="h-8 w-8 text-gray-500 mx-auto mb-2" />
              )}
              <p className="text-xs font-medium text-gray-700 truncate max-w-full">
                {fileName || alt}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {isPdf ? 'PDF Document' : 'File'}
              </p>
            </div>
          </div>
        )}

        {/* Hover overlay with actions */}
        {showActions && !disabled && (
          <div 
            className={cn(
              "absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center transition-all duration-300",
              isHovered ? "opacity-100" : "opacity-0"
            )}
          >
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={handleView}
                className="h-8 px-3 text-xs font-medium shadow-lg hover:shadow-xl transition-shadow"
              >
                <Eye className="h-3 w-3 mr-1" />
                View
              </Button>
              <Button
                size="sm"
                onClick={handleDownload}
                className="h-8 px-3 text-xs font-medium shadow-lg hover:shadow-xl transition-shadow"
              >
                <Download className="h-3 w-3 mr-1" />
                Download
              </Button>
            </div>
          </div>
        )}

        {/* Remove button (for editable contexts) */}
        {onRemove && !disabled && (
          <Button
            size="sm"
            variant="destructive"
            onClick={onRemove}
            className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg"
          >
            <X className="h-3 w-3" />
          </Button>
        )}

        {/* Loading state */}
        {!src && (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <div className="text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600 mx-auto mb-2"></div>
              <p className="text-xs text-gray-500">Loading...</p>
            </div>
          </div>
        )}
      </div>

      {/* File name below image */}
      {fileName && (
        <div className="mt-2 text-center">
          <p className="text-xs text-gray-600 truncate max-w-full" title={fileName}>
            {fileName}
          </p>
        </div>
      )}
    </div>
  )
}

// Convenience component for document previews
export function DocumentPreview(props: Omit<ImagePreviewProps, 'size'> & { size?: 'sm' | 'md' | 'lg' }) {
  return <ImagePreview {...props} />
}

// Convenience component for image previews
export function ImageThumbnail(props: Omit<ImagePreviewProps, 'size'> & { size?: 'sm' | 'md' | 'lg' }) {
  return <ImagePreview {...props} />
}
