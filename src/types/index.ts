export type FlightStatus = 
  | 'on_time'
  | 'delayed'
  | 'cancelled'
  | 'boarding'
  | 'departed'
  | 'arrived'
  | 'scheduled'

export type UserRole = 'guest' | 'employee' | 'senior_shift' | 'admin'

export interface Airline {
  code: string
  name: string
  nameRu: string
  logo?: string
}

export interface Airport {
  code: string
  name: string
  nameRu: string
  city: string
  cityRu: string
  terminal?: string
}

export interface Flight {
  id: string
  flightNumber: string
  airline: Airline
  route: {
    from: Airport
    to: Airport
  }
  scheduledDeparture: Date
  actualDeparture?: Date
  scheduledArrival: Date
  actualArrival?: Date
  status: FlightStatus
  gate: string
  checkInDesks: string
  checkInStart: Date
  checkInEnd: Date
  boardingStart?: Date
  boardingEnd?: Date
  aircraftType: string
  aircraftRegistration?: string
  specialPassengers: SpecialPassengerCount[]
  delayMinutes?: number
}

export interface SpecialPassengerCount {
  category: SpecialPassengerCategory
  count: number
}

export type SpecialPassengerCategory = 
  | 'umka' // Unaccompanied Minor
  | 'prm'  // Passenger with Reduced Mobility
  | 'petc' // Pet in Cabin
  | 'depa' // Deported Passenger
  | 'vip'
  | 'medical'

export interface SpecialPassengerGuide {
  id: string
  category: SpecialPassengerCategory
  title: string
  titleRu: string
  description: string
  descriptionRu: string
  checklist: ChecklistItem[]
  icon: string
  /** Short ops tip shown under the title */
  tipRu?: string
}

export interface ChecklistItem {
  id: string
  text: string
  textRu: string
  /** Extra how-to for the agent */
  detailRu?: string
  /** Stage on the journey */
  phase?: 'prep' | 'desk' | 'gate' | 'after'
  completed: boolean
}


export interface Document {
  id: string
  name: string
  nameRu: string
  type: 'pdf' | 'doc' | 'docx' | 'txt'
  size: number
  url: string
  folder: string
  airline?: string
  uploadedAt: Date
  uploadedBy: string
}

export interface Contact {
  id: string
  name: string
  position: string
  shift: string
  phone: string
  email?: string
  status: 'on_shift' | 'off_shift'
  airline?: string
}

export interface CustomTab {
  id: string
  title: string
  titleRu: string
  icon: string
  type: 'text' | 'checklist' | 'table' | 'files' | 'links'
  content: any
  access: 'private' | 'shift' | 'all'
  createdBy: string
  createdAt: Date
  order: number
}

export interface User {
  id: string
  employeeNumber: string
  name: string
  role: UserRole
  airline?: string
  shift?: {
    start: Date
    end: Date
  }
  avatar?: string
}

export interface Notification {
  id: string
  type: 'flight' | 'gate' | 'boarding' | 'document' | 'system'
  title: string
  titleRu: string
  message: string
  messageRu: string
  flightNumber?: string
  timestamp: Date
  read: boolean
}
