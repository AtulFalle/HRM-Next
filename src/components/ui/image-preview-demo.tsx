"use client"

import { ImagePreview, DocumentPreview, ImageThumbnail } from './image-preview'

// Demo component showing different sizes and use cases
export function ImagePreviewDemo() {
  const sampleImage = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPlNhbXBsZSBJbWFnZTwvdGV4dD4KPC9zdmc+"
  const samplePdf = "data:application/pdf;base64,JVBERi0xLjQKJcfsj6IKNSAwIG9iago8PAovVHlwZSAvUGFnZQovUGFyZW50IDMgMCBSCi9SZXNvdXJjZXMgPDwKL0ZvbnQgPDwKL0YxIDYgMCBSCj4+Cj4+Ci9NZWRpYUJveCBbMCAwIDYxMiA3OTJdCi9Db250ZW50cyA3IDAgUgo+PgplbmRvYmoKNiAwIG9iago8PAovVHlwZSAvRm9udAovU3VidHlwZSAvVHlwZTEKL0Jhc2VGb250IC9IZWx2ZXRpY2EKPj4KZW5kb2JqCjcgMCBvYmoKPDwKL0xlbmd0aCA0NAo+PgpzdHJlYW0KQlQKL0YxIDEyIFRmCjcyIDcyMCBUZAooU2FtcGxlIFBERikgVGoKRVQKZW5kc3RyZWFtCmVuZG9iagp4cmVmCjAgOAowMDAwMDAwMDAwIDY1NTM1IGYKMDAwMDAwMDAwOSAwMDAwMCBuCjAwMDAwMDAwNTggMDAwMDAgbgowMDAwMDAwMTE1IDAwMDAwIG4KMDAwMDAwMDI2MSAwMDAwMCBuCjAwMDAwMDAzODcgMDAwMDAgbgowMDAwMDAwNDQ0IDAwMDAwIG4KMDAwMDAwMDUwMiAwMDAwMCBuCnRyYWlsZXIKPDwKL1NpemUgOAovUm9vdCAxIDAgUgo+PgpzdGFydHhyZWYKNTk1CiUlRU9G"

  return (
    <div className="p-8 space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-4">ImagePreview Component Demo</h2>
        
        {/* Different sizes */}
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">Different Sizes</h3>
            <div className="flex gap-4 items-end">
              <div className="text-center">
                <ImagePreview src={sampleImage} alt="Small" size="sm" />
                <p className="text-xs text-gray-500 mt-1">Small (sm)</p>
              </div>
              <div className="text-center">
                <ImagePreview src={sampleImage} alt="Medium" size="md" />
                <p className="text-xs text-gray-500 mt-1">Medium (md)</p>
              </div>
              <div className="text-center">
                <ImagePreview src={sampleImage} alt="Large" size="lg" />
                <p className="text-xs text-gray-500 mt-1">Large (lg)</p>
              </div>
            </div>
          </div>

          {/* Document previews */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Document Previews</h3>
            <div className="flex gap-4">
              <div className="text-center">
                <DocumentPreview src={samplePdf} alt="PDF Document" fileName="sample.pdf" size="md" />
                <p className="text-xs text-gray-500 mt-1">PDF Document</p>
              </div>
              <div className="text-center">
                <ImageThumbnail src={sampleImage} alt="Image Thumbnail" fileName="image.jpg" size="md" />
                <p className="text-xs text-gray-500 mt-1">Image Thumbnail</p>
              </div>
            </div>
          </div>

          {/* Disabled state */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Disabled State (No Actions)</h3>
            <div className="flex gap-4">
              <ImagePreview 
                src={sampleImage} 
                alt="Disabled" 
                size="md" 
                showActions={false}
                disabled={true}
              />
            </div>
          </div>

          {/* With custom actions */}
          <div>
            <h3 className="text-lg font-semibold mb-3">With Custom Actions</h3>
            <div className="flex gap-4">
              <ImagePreview 
                src={sampleImage} 
                alt="Custom Actions" 
                size="md"
                onView={() => alert('Custom view action!')}
                onDownload={() => alert('Custom download action!')}
                onRemove={() => alert('Custom remove action!')}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
