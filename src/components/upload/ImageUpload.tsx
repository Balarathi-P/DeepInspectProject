import React, { useState } from 'react'
import { useAuthContext } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { Upload, Brain, Eye, Download, Loader, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export function ImageUpload() {
  const { profile } = useAuthContext()
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<any>(null)
  const [sectionInput, setSectionInput] = useState('')

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file')
        return
      }

      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB')
        return
      }

      setSelectedImage(file)
      const reader = new FileReader()
      reader.onload = (e) => setPreviewUrl(e.target?.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleAnalyze = async () => {
    if (!selectedImage) return;
    setAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedImage);
      formData.append('section', sectionInput);
      const response = await fetch('http://localhost:8000/api/crack-mask', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error('Analysis failed');
      const data = await response.json();
      setAnalysisResult({ maskUrl: data.mask_url });
      toast.success('Analysis completed successfully!');
    } catch (error: any) {
      toast.error('Analysis failed: ' + error.message);
      console.error('Analysis error:', error);
    } finally {
      setAnalyzing(false);
    }
  }

  // This is where you would integrate your trained ML model
  const callMLModel = async (imageFile: File) => {
    // Example integration with your trained model:
    
    const formData = new FormData()
    formData.append('image', imageFile)

    try {
      // Replace with your ML model endpoint
      const response = await fetch('/api/ml-analysis', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('ML analysis failed')
      }

      return await response.json()
    } catch (error) {
      console.error('ML model error:', error)
      throw error
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Critical': return 'text-red-600 bg-red-50'
      case 'High': return 'text-orange-600 bg-orange-50'
      case 'Medium': return 'text-yellow-600 bg-yellow-50'
      case 'Low': return 'text-green-600 bg-green-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getStatusBadgeColor = (severity: string) => {
    switch (severity) {
      case 'Critical': return 'bg-red-100 text-red-800'
      case 'High': return 'bg-orange-100 text-orange-800'
      case 'Medium': return 'bg-yellow-100 text-yellow-800'
      case 'Low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-blue-900">Upload Tunnel Image</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">Image Upload</h3>
          
          <div className="border-2 border-dashed border-blue-300 rounded-lg p-8 text-center mb-4 hover:border-blue-400 hover:bg-blue-50 transition-colors">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              id="imageUpload"
            />
            <label htmlFor="imageUpload" className="cursor-pointer">
              <Upload className="w-12 h-12 text-blue-500 mx-auto mb-4" />
              <p className="text-lg font-medium text-blue-900">Click to upload image</p>
              <p className="text-sm text-gray-600">JPG, PNG, or GIF up to 10MB</p>
            </label>
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Section Name/ID</label>
              <input
                type="text"
                value={sectionInput}
                onChange={e => setSectionInput(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Enter section name or ID"
              />
            </div>
          </div>
          
          {previewUrl && (
            <div>
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full h-64 object-cover rounded-lg mb-4 border"
              />
              <button
                onClick={handleAnalyze}
                disabled={analyzing}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-all hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {analyzing ? (
                  <div className="flex items-center justify-center">
                    <Loader className="w-5 h-5 animate-spin mr-2" />
                    Analyzing...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <Brain className="w-5 h-5 mr-2" />
                    Run ML Analysis
                  </div>
                )}
              </button>
            </div>
          )}
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">Analysis Results</h3>
          
          {analysisResult ? (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-900 flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Crack Mask Result
                </h4>
                <img src={analysisResult.maskUrl} alt="Crack Mask" className="w-full h-64 object-contain rounded-lg border mt-4" />
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-12">
              <Brain className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>Upload an image and run analysis to see results</p>
            </div>
          )}
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-lg p-6">
    {/* Upload history removed since images are not saved */}
      </div>
    </div>
  )
}