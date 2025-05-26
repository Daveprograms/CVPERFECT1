import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'react-hot-toast'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

interface ResumeSnapshotProps {
  content: string
}

export function ResumeSnapshot({ content }: ResumeSnapshotProps) {
  const [loading, setLoading] = useState(false)
  const snapshotRef = useRef<HTMLDivElement>(null)

  const handleDownload = async (format: 'pdf' | 'docx') => {
    if (!snapshotRef.current) return

    try {
      setLoading(true)

      if (format === 'pdf') {
        const canvas = await html2canvas(snapshotRef.current, {
          scale: 2,
          useCORS: true,
          logging: false
        })

        const imgData = canvas.toDataURL('image/png')
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4'
        })

        const imgProps = pdf.getImageProperties(imgData)
        const pdfWidth = pdf.internal.pageSize.getWidth()
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width

        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
        pdf.save('resume.pdf')
      } else {
        // For DOCX, we'll use a simple text-based approach
        const blob = new Blob([content], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = 'resume.docx'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
      }

      toast.success(`Resume downloaded as ${format.toUpperCase()}`)
    } catch (error) {
      console.error('Download error:', error)
      toast.error('Failed to download resume')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Resume Preview</h2>
        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleDownload('pdf')}
            disabled={loading}
            className="bg-primary text-white px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
            ) : (
              'Download PDF'
            )}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleDownload('docx')}
            disabled={loading}
            className="bg-secondary text-primary px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-primary"></div>
            ) : (
              'Download DOCX'
            )}
          </motion.button>
        </div>
      </div>

      <div
        ref={snapshotRef}
        className="bg-white p-8 rounded-lg shadow-lg border"
        style={{ minHeight: '297mm', width: '210mm', margin: '0 auto' }}
      >
        <div className="prose max-w-none">
          <pre className="whitespace-pre-wrap font-sans">{content}</pre>
        </div>
      </div>
    </div>
  )
} 