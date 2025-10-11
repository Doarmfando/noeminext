'use client'

import React from 'react'
import Image from 'next/image'

interface LeftPanelProps {
  panelImage: string
  altText?: string
  children?: React.ReactNode
}

const LeftPanel: React.FC<LeftPanelProps> = ({
  panelImage,
  altText = 'Left Panel',
  children
}) => {
  return (
    <>
      <div className="w-[16%] h-screen ml-5 relative overflow-hidden rounded-tl-3xl rounded-bl-none z-20 left-panel">
        {/* Imagen de fondo que cubre todo el panel */}
        <Image
          src={panelImage}
          alt={altText}
          fill
          className="object-cover"
          priority
        />

        {/* Overlay para mantener el color azul si la imagen es transparente o necesita tinte */}
        <div className="absolute inset-0 bg-[#214480]/20 mix-blend-multiply"></div>

        {/* Contenedor para el contenido (logo, etc.) */}
        <div className="relative z-10 flex items-start justify-center pt-16 h-full">
          {children}
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 768px) {
          .left-panel {
            width: 100% !important;
            height: auto !important;
            margin-left: 0 !important;
            border-radius: 0 !important;
            min-height: 150px;
          }

          .left-panel .relative.z-10 {
            justify-content: center !important;
            padding: 20px 0 !important;
            align-items: center !important;
          }
        }
      `}</style>
    </>
  )
}

export default LeftPanel
