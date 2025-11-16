'use client'

import React from 'react'
import Image from 'next/image'
import { Phone } from 'lucide-react'

interface FooterBannerProps {
  logo: string
  logoAlt?: string
  companyName?: string
  contactLabel?: string
  phoneNumbers: string[]
  version: string
}

const FooterBanner: React.FC<FooterBannerProps> = ({
  logo,
  logoAlt = 'Company Logo',
  companyName = 'Fortex',
  contactLabel = 'Contacto:',
  phoneNumbers = [],
  version = '1.0.0',
}) => {
  return (
    <>
      <div className="absolute bottom-5 left-0 w-screen bg-[#F0F2F5]/90 backdrop-blur-sm py-4 px-6 flex items-center justify-between font-bold text-sm z-40 rounded-lg shadow-[0_4px_12px_rgba(0,0,0,0.15)] login-bottom-banner">
        {/* Logo + powered by + versión */}
        <div className="flex items-center gap-2.5">
          <div className="h-6 w-6 rounded-full flex items-center justify-center overflow-hidden relative">
            <Image
              src={logo}
              alt={logoAlt}
              fill
              sizes="24px"
              className="object-cover"
            />
          </div>
          <span className="text-[#2f50ac]">
            Powered by {companyName}{' '}
            <span className="text-gray-500 text-sm font-normal italic">v{version}</span>
          </span>
        </div>

        {/* Información de contacto */}
        <div className="flex items-center gap-4">
          <span className="text-gray-600 text-xs">{contactLabel}</span>
          <div className="flex items-center gap-3">
            {phoneNumbers.map((phone, index) => (
              <div key={index} className="flex items-center gap-1">
                <Phone className="w-3 h-3 text-[#2f50ac]" />
                <span className="text-[#2f50ac] text-xs">{phone}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 768px) {
          .login-bottom-banner {
            position: relative !important;
            bottom: 0;
            width: 90% !important;
            margin: 20px auto 0;
            text-align: center;
            font-size: 12px;
            flex-direction: column !important;
            gap: 10px !important;
          }
          :global(.login-bottom-banner > div) {
            flex-direction: column !important;
            gap: 6px !important;
            text-align: center;
            align-items: center;
          }
        }
      `}</style>
    </>
  )
}

export default FooterBanner
