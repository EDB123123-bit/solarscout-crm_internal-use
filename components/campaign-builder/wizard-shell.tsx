import type { ReactNode } from 'react'

const STEP_LABELS = ['Naam', 'Contacten', 'Reeks', 'Controle']

type Props = {
  currentStep: number
  children: ReactNode
}

export function WizardShell({ currentStep, children }: Props) {
  return (
    <main className="mx-auto max-w-4xl space-y-6 p-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Nieuwe campagne</h1>
        <p className="text-sm text-muted-foreground">
          Stap {currentStep + 1} van {STEP_LABELS.length} — {STEP_LABELS[currentStep]}
        </p>
        <div className="flex gap-1.5 pt-2">
          {STEP_LABELS.map((_, i) => (
            <div
              key={i}
              className={
                'h-1.5 flex-1 rounded-full ' +
                (i <= currentStep ? 'bg-primary' : 'bg-muted')
              }
            />
          ))}
        </div>
      </div>
      {children}
    </main>
  )
}

export function resolveDotIndex(
  step: 'name' | 'import' | 'sequence' | 'template' | 'review',
): number {
  switch (step) {
    case 'name':     return 0
    case 'import':   return 1
    case 'sequence': return 2
    case 'template': return 2
    case 'review':   return 3
  }
}
