'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { Search, X, ChevronDown } from 'lucide-react'

interface Option {
  id: string
  nombre: string
  [key: string]: any // Para propiedades adicionales como categoria, etc.
}

interface SearchableSelectProps {
  options: Option[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  label?: string
  required?: boolean
  renderOption?: (option: Option) => React.ReactNode
  getSecondaryText?: (option: Option) => string
  emptyMessage?: string
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Buscar...',
  disabled = false,
  label,
  required = false,
  renderOption,
  getSecondaryText,
  emptyMessage = 'No se encontraron resultados',
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const optionRefs = useRef<(HTMLDivElement | null)[]>([])

  // Encontrar la opción seleccionada
  const selectedOption = useMemo(
    () => options.find(opt => opt.id === value),
    [options, value]
  )

  // Filtrar opciones basado en búsqueda (con caché mediante useMemo)
  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) return options

    const term = searchTerm.toLowerCase().trim()
    return options.filter(option => {
      const nombre = option.nombre.toLowerCase()
      const secondaryText = getSecondaryText?.(option)?.toLowerCase() || ''
      return nombre.includes(term) || secondaryText.includes(term)
    })
  }, [options, searchTerm, getSecondaryText])

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Scroll automático al elemento destacado
  useEffect(() => {
    if (isOpen && optionRefs.current[highlightedIndex]) {
      optionRefs.current[highlightedIndex]?.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth',
      })
    }
  }, [highlightedIndex, isOpen])

  // Manejar navegación con teclado
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === 'ArrowDown') {
        e.preventDefault()
        setIsOpen(true)
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex(prev =>
          prev < filteredOptions.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex(prev => (prev > 0 ? prev - 1 : 0))
        break
      case 'Enter':
        e.preventDefault()
        if (filteredOptions[highlightedIndex]) {
          handleSelect(filteredOptions[highlightedIndex])
        }
        break
      case 'Escape':
        e.preventDefault()
        setIsOpen(false)
        setSearchTerm('')
        break
    }
  }

  const handleSelect = (option: Option) => {
    onChange(option.id)
    setIsOpen(false)
    setSearchTerm('')
    setHighlightedIndex(0)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange('')
    setSearchTerm('')
    setHighlightedIndex(0)
  }

  const handleOpen = () => {
    if (!disabled) {
      setIsOpen(true)
      // Focus en el input cuando se abre
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      {/* Campo principal - Input si está abierto, Display si está cerrado */}
      {!isOpen ? (
        // Modo cerrado: Mostrar valor seleccionado
        <div
          onClick={handleOpen}
          className={`
            relative w-full px-3 py-2 border rounded-lg cursor-pointer transition-colors
            ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white hover:border-gray-400'}
            border-gray-300
          `}
        >
          <div className="flex items-center justify-between gap-2">
            <span className={selectedOption ? 'text-gray-900' : 'text-gray-500'}>
              {selectedOption ? selectedOption.nombre : placeholder}
            </span>
            <div className="flex items-center gap-1">
              {value && !disabled && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              )}
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </div>
          </div>
        </div>
      ) : (
        // Modo abierto: Mostrar input de búsqueda
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={e => {
              setSearchTerm(e.target.value)
              setHighlightedIndex(0)
            }}
            onKeyDown={handleKeyDown}
            placeholder="Buscar..."
            className="w-full pl-9 pr-10 py-2 border-2 border-blue-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 rotate-180 w-4 h-4 text-gray-400" />
        </div>
      )}

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg overflow-hidden">

          {/* Lista de opciones */}
          <div className="max-h-60 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500 text-sm">
                {emptyMessage}
              </div>
            ) : (
              filteredOptions.map((option, index) => (
                <div
                  key={option.id}
                  ref={el => { optionRefs.current[index] = el }}
                  onClick={() => handleSelect(option)}
                  className={`
                    px-4 py-2 cursor-pointer transition-colors
                    ${
                      highlightedIndex === index
                        ? 'bg-blue-50 text-blue-900'
                        : 'hover:bg-gray-50'
                    }
                    ${value === option.id ? 'bg-blue-100 font-medium' : ''}
                  `}
                >
                  {renderOption ? (
                    renderOption(option)
                  ) : (
                    <div>
                      <div className="font-medium text-sm">{option.nombre}</div>
                      {getSecondaryText && (
                        <div className="text-xs text-gray-500 mt-0.5">
                          {getSecondaryText(option)}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer con información */}
          {filteredOptions.length > 0 && (
            <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
              {filteredOptions.length} {filteredOptions.length === 1 ? 'resultado' : 'resultados'}
              {searchTerm && ` para "${searchTerm}"`}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
