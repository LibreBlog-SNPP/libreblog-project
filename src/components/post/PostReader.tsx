'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import Button from '@/components/ui/Button'

interface PostReaderProps {
  content: string
  enablePagination?: boolean
  showTableOfContents?: boolean
  currentPage?: number
  onPageChange?: (page: number) => void
}

export default function PostReader({ content, enablePagination = false, showTableOfContents = true, currentPage: externalPage, onPageChange }: PostReaderProps) {
  const [internalPage, setInternalPage] = useState(1)
  const currentPage = externalPage ?? internalPage
  
  const handlePageChange = (page: number) => {
    if (onPageChange) {
      onPageChange(page)
    } else {
      setInternalPage(page)
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const [isExpanded, setIsExpanded] = useState(false)
  const [pages, setPages] = useState<string[]>([])
  const [wordCount, setWordCount] = useState(0)

  useEffect(() => {
    // Contar palabras
    const words = content.split(/\s+/).filter(w => w.length > 0).length
    setWordCount(words)

    // Dividir por páginas si está habilitado
    if (enablePagination) {
      const pageBreak = '---PAGE---'
      const splitPages = content.split(pageBreak).map(p => p.trim())
      setPages(splitPages)
    } else {
      setPages([content])
    }
  }, [content, enablePagination])

  // Componente personalizado para headers con IDs
  const components = {
    h1: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => {
      const text = String(children)
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      return <h1 id={id} {...props}>{children}</h1>
    },
    h2: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => {
      const text = String(children)
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      return <h2 id={id} {...props}>{children}</h2>
    },
    h3: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => {
      const text = String(children)
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      return <h3 id={id} {...props}>{children}</h3>
    },
    h4: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => {
      const text = String(children)
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      return <h4 id={id} {...props}>{children}</h4>
    },
    h5: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => {
      const text = String(children)
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      return <h5 id={id} {...props}>{children}</h5>
    },
    h6: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => {
      const text = String(children)
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      return <h6 id={id} {...props}>{children}</h6>
    },
  }

  const currentContent = pages[currentPage - 1] || content
  const shouldShowFold = wordCount > 2000 && !enablePagination && !isExpanded
  const displayContent = shouldShowFold 
    ? currentContent.split(' ').slice(0, 1000).join(' ') + '...'
    : currentContent

  const readingTime = Math.ceil(wordCount / 200)

  return (
    <div className="space-y-6">
      {/* Metadata */}
      <div className="flex items-center gap-4 text-sm text-[#dedff1]">
        <span>{wordCount.toLocaleString()} palabras</span>
        <span>•</span>
        <span>{readingTime} min de lectura</span>
        {enablePagination && pages.length > 1 && (
          <>
            <span>•</span>
            <span>Página {currentPage} de {pages.length}</span>
          </>
        )}
      </div>

      {/* Contenido */}
      <article 
        className="prose prose-invert max-w-none
          prose-headings:text-[#dedff1] prose-headings:font-bold
          prose-h1:text-3xl prose-h1:mb-4 prose-h1:mt-8
          prose-h2:text-2xl prose-h2:mb-3 prose-h2:mt-6
          prose-h3:text-xl prose-h3:mb-2 prose-h3:mt-4
          prose-p:text-[#dedff1]/90 prose-p:leading-relaxed prose-p:mb-4
          prose-a:text-[#5f638f] prose-a:no-underline hover:prose-a:underline
          prose-strong:text-[#dedff1] prose-strong:font-semibold
          prose-code:text-[#5f638f] prose-code:bg-[#0c2b4d]/50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
          prose-pre:bg-[#0c2b4d] prose-pre:border prose-pre:border-[#5f638f]/20
          prose-blockquote:border-l-4 prose-blockquote:border-[#5f638f] prose-blockquote:pl-4 prose-blockquote:italic
          prose-ul:list-disc prose-ul:pl-6 prose-ol:list-decimal prose-ol:pl-6
          prose-li:text-[#dedff1]/90 prose-li:mb-2
          prose-img:rounded-lg prose-img:shadow-lg
        "
      >
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
          {displayContent}
        </ReactMarkdown>
      </article>

      {/* Botón "Continuar leyendo" */}
      {shouldShowFold && (
        <div className="flex justify-center pt-6">
          <Button
            onClick={() => setIsExpanded(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-[#5f638f] to-[#36234e] hover:from-[#36234e] hover:to-[#0c2b4d]"
          >
            <ChevronDown className="w-4 h-4" />
            Continuar leyendo ({Math.ceil((wordCount - 1000) / 200)} min más)
          </Button>
        </div>
      )}

      {/* Paginación */}
      {enablePagination && pages.length > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8 border-t border-[#5f638f]/20">
          <div className="flex items-center gap-2">
            <Button
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Anterior</span>
            </Button>

            <div className="flex items-center gap-2">
              {currentPage > 3 && (
                <>
                  <button
                    onClick={() => handlePageChange(1)}
                    className="w-8 h-8 rounded-full bg-[#0c2b4d] text-[#dedff1]/60 hover:bg-[#5f638f]/30 transition-all text-sm"
                  >
                    1
                  </button>
                  <span className="text-[#dedff1]/60">...</span>
                </>
              )}
              
              {Array.from({ length: pages.length }, (_, idx) => idx + 1)
                .filter(page => 
                  page === currentPage ||
                  page === currentPage - 1 ||
                  page === currentPage + 1 ||
                  (currentPage <= 2 && page <= 3) ||
                  (currentPage >= pages.length - 1 && page >= pages.length - 2)
                )
                .map(page => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`
                      w-8 h-8 rounded-full transition-all text-sm
                      ${currentPage === page
                        ? 'bg-gradient-to-r from-[#5f638f] to-[#36234e] text-white font-semibold'
                        : 'bg-[#0c2b4d] text-[#dedff1]/60 hover:bg-[#5f638f]/30'
                      }
                    `}
                  >
                    {page}
                  </button>
                ))}
              
              {currentPage < pages.length - 2 && (
                <>
                  <span className="text-[#dedff1]/60">...</span>
                  <button
                    onClick={() => handlePageChange(pages.length)}
                    className="w-8 h-8 rounded-full bg-[#0c2b4d] text-[#dedff1]/60 hover:bg-[#5f638f]/30 transition-all text-sm"
                  >
                    {pages.length}
                  </button>
                </>
              )}
            </div>

            <Button
              onClick={() => handlePageChange(Math.min(pages.length, currentPage + 1))}
              disabled={currentPage === pages.length}
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
            >
              <span className="hidden sm:inline">Siguiente</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="text-sm text-[#dedff1]">
            Página {currentPage} de {pages.length}
          </div>
        </div>
      )}
    </div>
  )
}
