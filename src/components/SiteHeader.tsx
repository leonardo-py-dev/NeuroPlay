import { NavLink } from 'react-router-dom'
import { BrainCircuit, FlaskConical, Gamepad2 } from 'lucide-react'
import { cn } from '../lib/utils'

export function SiteHeader({ right }: { right?: React.ReactNode }) {
  return (
    <header className="border-b border-border bg-card/50">
      <div className="container flex flex-wrap items-center gap-3 py-3">
        <NavLink to="/" className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <BrainCircuit className="h-6 w-6" />
          </span>
          <div>
            <h1 className="text-lg font-bold leading-tight">NeuroPlay</h1>
            <p className="text-xs text-muted-foreground">aprenda redes neurais interagindo</p>
          </div>
        </NavLink>
        <nav className="ml-4 flex gap-1 rounded-lg bg-muted p-1 text-sm">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              cn(
                'flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium transition-colors',
                isActive ? 'bg-background text-foreground shadow' : 'text-muted-foreground hover:text-foreground',
              )
            }
          >
            <FlaskConical className="h-4 w-4" /> Playground
          </NavLink>
          <NavLink
            to="/desafios"
            className={({ isActive }) =>
              cn(
                'flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium transition-colors',
                isActive ? 'bg-background text-foreground shadow' : 'text-muted-foreground hover:text-foreground',
              )
            }
          >
            <Gamepad2 className="h-4 w-4" /> Desafios
          </NavLink>
        </nav>
        {right && <div className="ml-auto flex flex-wrap gap-2">{right}</div>}
      </div>
    </header>
  )
}
