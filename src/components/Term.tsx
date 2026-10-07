import { GLOSSARY } from '../content/glossary'
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip'

/** Palavra/trecho com tooltip explicando o termo técnico. */
export function Term({ id, children }: { id: string; children?: React.ReactNode }) {
  const t = GLOSSARY[id]
  if (!t) return <>{children}</>
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="cursor-help underline decoration-dotted decoration-primary/70 underline-offset-2 hover:text-primary">
          {children ?? t.term}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top">
        <p className="mb-0.5 font-semibold text-primary">{t.term}</p>
        <p>{t.short}</p>
        <p className="mt-1 opacity-70">Passe para o painel "Aprenda" para a explicação completa.</p>
      </TooltipContent>
    </Tooltip>
  )
}
