# NeuroPlay — Aprenda Redes Neurais Interagindo

Playground interativo para entender redes neurais de forma intuitiva **e** aprender os
termos técnicos no contexto: monte a arquitetura, treine ao vivo e veja a fronteira de
decisão, o fluxo de sinal e a curva de perda em tempo real.

## Stack

- React 18 + Vite + TypeScript
- Tailwind CSS + shadcn/ui (componentes em `src/components/ui`)
- Recharts (curva de perda) + Canvas 2D próprio (rede e dados)

## Rodando

```bash
npm install
npm run dev    # abre em http://localhost:5173
npm run build  # typecheck + build de produção
```

## Como funciona

- `src/engine/network.ts` — rede feedforward real (forward pass, backprop, mini-batch
  SGD, saída sigmoide + perda BCE). 100% client-side.
- `src/engine/datasets.ts` — geradores (gaussianas, círculo, XOR, espirais, meias-luas).
- `src/content/glossary.ts` — dicionário de termos técnicos (tooltips) + lições.
- `src/components/` — `NetworkCanvas` (pesos/sinais ao vivo), `DataCanvas` (fronteira
  de decisão), `TrainingChart`, `ControlPanel` (shadcn), `EducationPanel`.

## Experimentos sugeridos

1. XOR com 1 neurônio oculto → a rede consegue? (spoiler: não)
2. Taxa de aprendizado 0.6 → observe a perda oscilar
3. Espiral com `[8, 8]` tanh → 100% de acurácia; com `[4]` → underfitting
4. Ruído alto + rede grande → ilhas de overfitting na fronteira
