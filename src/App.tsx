import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { TooltipProvider } from './components/ui/tooltip'
import { PlaygroundPage } from './pages/PlaygroundPage'
import { ChallengesPage } from './pages/ChallengesPage'
import { ChallengeRoomPage } from './pages/ChallengeRoomPage'

export default function App() {
  return (
    <TooltipProvider delayDuration={200}>
      <HashRouter>
        <Routes>
          <Route path="/" element={<PlaygroundPage />} />
          <Route path="/desafios" element={<ChallengesPage />} />
          <Route path="/desafios/:id" element={<ChallengeRoomPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </TooltipProvider>
  )
}
