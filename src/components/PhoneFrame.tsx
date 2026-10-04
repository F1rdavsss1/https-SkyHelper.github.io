import type { ReactNode } from 'react'

interface PhoneFrameProps {
  children: ReactNode
}

/** Desktop preview shell mimicking iPhone 14 (390×844). On narrow screens: full bleed. */
export function PhoneFrame({ children }: PhoneFrameProps) {
  return (
    <div className="min-h-dvh w-full flex items-center justify-center bg-gradient-to-br from-navy-950 via-[#121a28] to-navy-900 p-0 md:p-8">
      {/* Mobile: full screen */}
      <div className="md:hidden w-full min-h-dvh app-bg relative overflow-hidden">
        {children}
      </div>

      {/* Desktop: iPhone 14 frame */}
      <div className="hidden md:block">
        <div className="mb-4 text-center">
          <p className="text-sm font-medium text-lavender-300/90 tracking-wide">
            AeroDesk · iPhone 14 preview
          </p>
        </div>
        <div className="phone-frame bg-[#f4f2f9] dark:bg-navy-950">
          <div className="phone-notch" aria-hidden />
          <div className="absolute inset-0 overflow-y-auto overflow-x-hidden overscroll-contain">
            {children}
          </div>
          <div className="phone-home-indicator" aria-hidden />
        </div>
      </div>
    </div>
  )
}
