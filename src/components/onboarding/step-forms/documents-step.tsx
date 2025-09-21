'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FileText, Upload, X, CheckCircle } from 'lucide-react'
import { ImagePreview } from '@/components/ui/image-preview'
import { toast } from 'sonner'

const documentsSchema = z.object({
  identityProof: z.string().min(1, 'Identity proof is required'),
  identityProofNumber: z.string().min(1, 'Identity proof number is required'),
  educationalCertificate: z.string().min(1, 'Educational certificate is required'),
  resume: z.string().min(1, 'Resume is required'),
  panCard: z.string().optional(),
  previousRelievingLetter: z.string().optional()
})

type DocumentsForm = z.infer<typeof documentsSchema>

interface DocumentsStepProps {
  stepId: string
  initialData?: Record<string, unknown>
  onSave: (stepId: string, data: Record<string, unknown>) => Promise<void>
  onCancel: () => void
  disabled?: boolean
}

export function DocumentsStep({ 
  stepId, 
  initialData = {}, 
  onSave, 
  onCancel,
  disabled = false
}: DocumentsStepProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, string>>({
    identityProof: (initialData?.identityProof as string) || '',
    identityProofNumber: (initialData?.identityProofNumber as string) || '',
    educationalCertificate: (initialData?.educationalCertificate as string) || '',
    resume: (initialData?.resume as string) || '',
    panCard: (initialData?.panCard as string) || '',
    previousRelievingLetter: (initialData?.previousRelievingLetter as string) || ''
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue
  } = useForm<DocumentsForm>({
    resolver: zodResolver(documentsSchema),
    defaultValues: {
      identityProof: (initialData?.identityProof as string) || '',
      identityProofNumber: (initialData?.identityProofNumber as string) || '',
      educationalCertificate: (initialData?.educationalCertificate as string) || '',
      resume: (initialData?.resume as string) || '',
      panCard: (initialData?.panCard as string) || '',
      previousRelievingLetter: (initialData?.previousRelievingLetter as string) || ''
    }
  })

  const handleFileUpload = async (field: string, file: File) => {
    try {
      // In a real application, you would upload to a file storage service
      // For now, we'll simulate with a base64 string
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        setUploadedFiles(prev => ({ ...prev, [field]: result }))
        setValue(field as keyof DocumentsForm, result)
        toast.success('File uploaded successfully')
      }
      reader.readAsDataURL(file)
    } catch (e) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      toast.error('Failed to upload file',(e as any).message);
    
    }
  }

  const removeFile = (field: string) => {
    setUploadedFiles(prev => ({ ...prev, [field]: '' }))
    setValue(field as keyof DocumentsForm, '')
  }

  const onSubmit = async (data: DocumentsForm) => {
    setIsSubmitting(true)
    try {
      await onSave(stepId, data)
      toast.success('Documents saved successfully')
    } catch (error) {
      console.error('Error saving documents:', error)
      toast.error('Failed to save documents')
    } finally {
      setIsSubmitting(false)
    }
  }

  const documentFields = [
    {
      key: 'identityProof',
      label: 'Identity Proof *',
      description: 'Upload Aadhaar Card, Passport, or Driving License',
      required: true
    },
    {
      key: 'identityProofNumber',
      label: 'Identity Proof Number *',
      description: 'Enter the number from your identity proof',
      required: true
    },
    {
      key: 'educationalCertificate',
      label: 'Educational Certificate *',
      description: 'Upload your highest degree certificate',
      required: true
    },
    {
      key: 'resume',
      label: 'Resume/CV *',
      description: 'Upload your updated resume',
      required: true
    },
    {
      key: 'panCard',
      label: 'PAN Card',
      description: 'Upload your PAN card (optional)',
      required: false
    },
    {
      key: 'previousRelievingLetter',
      label: 'Previous Relieving Letter',
      description: 'Upload relieving letter from previous employer (if applicable)',
      required: false
    }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Document Collection
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {documentFields.map((field) => (
            <div key={field.key} className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor={field.key} className="text-sm font-medium">
                  {field.label}
                </Label>
                {field.required && <span className="text-red-500 text-sm">*</span>}
              </div>
              
              <p className="text-sm text-gray-600">{field.description}</p>

              {field.key === 'identityProofNumber' ? (
                <Input
                  id={field.key}
                  {...register(field.key as keyof DocumentsForm)}
                  placeholder="Enter identity proof number"
                  disabled={disabled}
                />
              ) : (
                <div className="space-y-2">
                  {uploadedFiles[field.key] ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 border border-green-200 bg-green-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm text-green-800">File uploaded successfully</span>
                        </div>
                        {!disabled && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(field.key)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      
                      {/* Show preview for both disabled and enabled states */}
                      {uploadedFiles[field.key].startsWith('data:') && (
                        <div className="space-y-2">
                          <div className="text-sm font-medium text-gray-600">Preview:</div>
                          <ImagePreview
                            src={uploadedFiles[field.key]}
                            alt={field.label}
                            fileName={field.label}
                            size="sm"
                            showActions={!disabled}
                            onRemove={!disabled ? () => removeFile(field.key) : undefined}
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 hover:bg-gray-50 transition-colors duration-200">
                      <div className="space-y-3">
                        <div className="flex justify-center">
                          <div className="p-3 bg-gray-100 rounded-full">
                            <Upload className="h-6 w-6 text-gray-500" />
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-1">Upload {field.label}</p>
                          <p className="text-xs text-gray-500">Click to upload or drag and drop</p>
                          <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG, DOC, DOCX (Max 10MB)</p>
                        </div>
                        <Input
                          type="file"
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              handleFileUpload(field.key, file)
                            }
                          }}
                          className="hidden"
                          id={`file-${field.key}`}
                          disabled={disabled}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => document.getElementById(`file-${field.key}`)?.click()}
                          disabled={disabled}
                          className="mt-2"
                        >
                          Choose File
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {errors[field.key as keyof DocumentsForm] && (
                <p className="text-sm text-red-600">
                  {errors[field.key as keyof DocumentsForm]?.message}
                </p>
              )}
            </div>
          ))}

          {!disabled && (
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save & Continue'}
              </Button>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  )
}
