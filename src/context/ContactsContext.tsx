import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Contact } from '../types'

const STORAGE_KEY = 'aerodesk_contacts'

interface ContactsContextType {
  contacts: Contact[]
  addContact: (data: Omit<Contact, 'id'>) => Contact
  updateContact: (id: string, data: Partial<Omit<Contact, 'id'>>) => void
  removeContact: (id: string) => void
}

const ContactsContext = createContext<ContactsContextType | undefined>(undefined)

function loadContacts(): Contact[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Contact[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function ContactsProvider({ children }: { children: ReactNode }) {
  const [contacts, setContacts] = useState<Contact[]>(() => loadContacts())

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts))
  }, [contacts])

  const addContact = useCallback((data: Omit<Contact, 'id'>) => {
    const next: Contact = { ...data, id: `c-${Date.now()}` }
    setContacts((prev) => [next, ...prev])
    return next
  }, [])

  const updateContact = useCallback((id: string, data: Partial<Omit<Contact, 'id'>>) => {
    setContacts((prev) => prev.map((c) => (c.id === id ? { ...c, ...data } : c)))
  }, [])

  const removeContact = useCallback((id: string) => {
    setContacts((prev) => prev.filter((c) => c.id !== id))
  }, [])

  const value = useMemo(
    () => ({ contacts, addContact, updateContact, removeContact }),
    [contacts, addContact, updateContact, removeContact]
  )

  return <ContactsContext.Provider value={value}>{children}</ContactsContext.Provider>
}

export function useContacts() {
  const ctx = useContext(ContactsContext)
  if (!ctx) throw new Error('useContacts must be used within ContactsProvider')
  return ctx
}
