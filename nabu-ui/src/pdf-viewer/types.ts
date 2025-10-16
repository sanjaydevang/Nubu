export type Tool = 'select' | 'highlight' | 'note' | 'draw' | 'eraser'
export type Color = 'yellow' | 'green' | 'blue' | 'red' | 'orange'

export interface Annotation {
  id?: string
  type: 'highlight' | 'note' | 'drawing'
  page: number
  color: Color
  timestamp?: string
}

export interface HighlightAnnotation extends Annotation {
  type: 'highlight'
  start: { x: number; y: number }
  end: { x: number; y: number }
}

export interface NoteAnnotation extends Annotation {
  type: 'note'
  x: number
  y: number
  text: string
}

export interface DrawingAnnotation extends Annotation {
  type: 'drawing'
  path: Array<{ x: number; y: number }>
}

export interface TextItem {
  text: string
  x: number
  y: number
  width: number
  height: number
  fontName: string
  fontSize: number
}

export interface PDFViewerConfig {
  pdfUrl: string
  sourceUrl?: string
  onPageChange?: (page: number, total: number) => void
  onFilenameChange?: (filename: string) => void
  onLoadingChange?: (loading: boolean) => void
  onError?: (error: string) => void
  onTextSelected?: (text: string) => void
  onAnnotationsChange?: (annotations: Map<number, Annotation[]>) => void
}

export interface SaveModalData {
  title: string
  tags: string[]
  notes?: string
}

