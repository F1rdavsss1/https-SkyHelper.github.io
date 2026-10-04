import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { User } from '../types'

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  shiftOpen: boolean
  login: (employeeNumber: string, code: string) => Promise<{ ok: boolean; error?: string }>
  loginWithBiometric: () => Promise<{ ok: boolean; error?: string }>
  logout: () => void
  openShift: () => void
  closeShift: () => void
}

const DEMO_USER: User = {
  id: 'u1',
  employeeNumber: '12345',
  name: 'Петрова Мария С.',
  role: 'employee',
  airline: 'DP',
  shift: {
    start: new Date('2026-10-04T06:00:00'),
    end: new Date('2026-10-04T18:00:00'),
  },
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [shiftOpen, setShiftOpen] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('aerodesk_user')
    const shift = localStorage.getItem('aerodesk_shift')
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as User
        setUser({
          ...parsed,
          shift: parsed.shift
            ? {
                start: new Date(parsed.shift.start),
                end: new Date(parsed.shift.end),
              }
            : DEMO_USER.shift,
        })
        setShiftOpen(shift === 'open')
      } catch {
        localStorage.removeItem('aerodesk_user')
      }
    }
    setIsLoading(false)
  }, [])

  const login = async (employeeNumber: string, code: string) => {
    await new Promise((r) => setTimeout(r, 700))
    if (!employeeNumber.trim() || !code.trim()) {
      return { ok: false, error: 'Заполните табельный номер и код' }
    }
    if (code.length < 4) {
      return { ok: false, error: 'Неверный код доступа' }
    }
    // Demo: any employee number + code >= 4 digits works; 0000 fails
    if (code === '0000') {
      return { ok: false, error: 'Неверный код доступа' }
    }
    const nextUser = { ...DEMO_USER, employeeNumber: employeeNumber.trim() }
    setUser(nextUser)
    localStorage.setItem('aerodesk_user', JSON.stringify(nextUser))
    localStorage.setItem('aerodesk_onboarded', '1')
    return { ok: true }
  }

  const loginWithBiometric = async () => {
    await new Promise((r) => setTimeout(r, 500))
    const nextUser = DEMO_USER
    setUser(nextUser)
    localStorage.setItem('aerodesk_user', JSON.stringify(nextUser))
    return { ok: true }
  }

  const logout = () => {
    setUser(null)
    setShiftOpen(false)
    localStorage.removeItem('aerodesk_user')
    localStorage.removeItem('aerodesk_shift')
  }

  const openShift = () => {
    setShiftOpen(true)
    localStorage.setItem('aerodesk_shift', 'open')
  }

  const closeShift = () => {
    setShiftOpen(false)
    localStorage.setItem('aerodesk_shift', 'closed')
  }

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      shiftOpen,
      login,
      loginWithBiometric,
      logout,
      openShift,
      closeShift,
    }),
    [user, isLoading, shiftOpen]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
