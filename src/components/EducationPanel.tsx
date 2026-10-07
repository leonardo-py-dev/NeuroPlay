import { BookOpenText } from 'lucide-react'
import { GLOSSARY, LESSONS } from '../content/glossary'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip'

function TermChip({ id }: { id: string }) {
  const t = GLOSSARY[id]
  if (!t) return null
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button className="rounded-full border border-primary/40 bg-primary/10 px-2.5 py-1 text-xs text-foreground transition-colors hover:bg-primary/25">
          {t.term}
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-sm">
        <p className="mb-1 font-semibold text-primary">{t.term}</p>
        <p className="text-xs leading-relaxed">{t.long}</p>
      </TooltipContent>
    </Tooltip>
  )
}

/** Painel educativo: lições + glossário de termos técnicos. */
export function EducationPanel() {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <BookOpenText className="h-4 w-4 text-primary" />
        Aprenda enquanto brinca
      </div>
      <Tabs defaultValue={LESSONS[0].id} className="w-full">
        <TabsList className="grid h-auto grid-cols-5 gap-0.5 p-1">
          {LESSONS.map((l, i) => (
            <TabsTrigger key={l.id} value={l.id} className="px-1 text-xs">
              {i + 1}
            </TabsTrigger>
          ))}
        </TabsList>
        {LESSONS.map((l) => (
          <TabsContent key={l.id} value={l.id} className="space-y-3">
            <p className="text-sm font-medium">{l.title}</p>
            <p className="text-[13px] leading-relaxed text-muted-foreground">{l.body}</p>
            <div className="flex flex-wrap gap-1.5">
              {l.terms.map((t) => (
                <TermChip key={t} id={t} />
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
      <p className="text-[11px] leading-relaxed text-muted-foreground">
        Dica: os termos <span className="underline decoration-dotted">pontilhados</span> em qualquer
        lugar da página mostram explicações rápidas ao passar o mouse.
      </p>
    </div>
  )
}
