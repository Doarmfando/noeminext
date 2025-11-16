'use client'

import React from 'react'
import Image from 'next/image'

const RestaurantLogo: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center gap-6 w-full px-4">
      {/* Logo principal del restaurante */}
      <div className="relative w-40 h-40">
        <Image
          src="/images/logo-blanco.png"
          alt="Restaurant Logo"
          fill
          sizes="160px"
          className="object-contain"
          priority
        />
      </div>

      {/* Logo secundario */}
      <div className="relative w-36 h-20">
        <Image
          src="/images/logo2.png"
          alt="Restaurant Brand"
          fill
          sizes="144px"
          className="object-contain"
        />
      </div>
    </div>
  )
}

export default RestaurantLogo
