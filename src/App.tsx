import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { NotificationsProvider } from './context/NotificationsContext'
import { FlightsProvider } from './context/FlightsContext'
import { ContactsProvider } from './context/ContactsContext'
import { BottomNav } from './components/BottomNav'
import { Home } from './pages/Home'
import { Flights } from './pages/Flights'
import { FlightDetails } from './pages/FlightDetails'
import { SpecialPassengers } from './pages/SpecialPassengers'
import { PassengerGuide } from './pages/PassengerGuide'
import { Documents } from './pages/Documents'
import { Contacts } from './pages/Contacts'
import { Settings } from './pages/Settings'
import { More } from './pages/More'
import { Notifications } from './pages/Notifications'
import { MyTabs } from './pages/MyTabs'
import { KnowledgeHub, KnowledgeSection } from './pages/Knowledge'
import { cn } from './lib/utils'

function Shell() {
  const location = useLocation()
  const hideNav =
    location.pathname.startsWith('/flights/') ||
    location.pathname.startsWith('/special-passengers/') ||
    location.pathname.startsWith('/knowledge/') ||
    location.pathname === '/notifications'

  return (
    <div className={cn('relative min-h-dvh app-bg', !hideNav && 'md:pl-56')}>
      <Outlet />
      {!hideNav && <BottomNav />}
    </div>
  )
}

function App() {
  return (
    <ThemeProvider>
      <NotificationsProvider>
        <ContactsProvider>
          <FlightsProvider>
            <Routes>
              <Route element={<Shell />}>
                <Route path="/" element={<Home />} />
                <Route path="/flights" element={<Flights />} />
                <Route path="/flights/:id" element={<FlightDetails />} />
                <Route path="/documents" element={<Documents />} />
                <Route path="/contacts" element={<Contacts />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/more" element={<More />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/tabs" element={<MyTabs />} />
                <Route path="/special-passengers" element={<SpecialPassengers />} />
                <Route path="/special-passengers/:id" element={<PassengerGuide />} />
                <Route path="/knowledge" element={<KnowledgeHub />} />
                <Route path="/knowledge/:sectionId/:guideId" element={<KnowledgeSection />} />
                <Route path="/knowledge/:sectionId" element={<KnowledgeSection />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </FlightsProvider>
        </ContactsProvider>
      </NotificationsProvider>
    </ThemeProvider>
  )
}

export default App
