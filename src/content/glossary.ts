export interface GlossaryTerm {
  term: string
  short: string
  long: string
}

/** Dicionário de termos técnicos usados nos tooltips e no painel educativo. */
export const GLOSSARY: Record<string, GlossaryTerm> = {
  neuronio: {
    term: 'Neurônio',
    short: 'Unidade que soma entradas ponderadas e aplica uma função de ativação.',
    long: 'Cada neurônio calcula z = w₁x₁ + w₂x₂ + … + b e depois aplica uma função de ativação f(z). O valor de saída é repassado aos neurônios da próxima camada.',
  },
  peso: {
    term: 'Peso (weight)',
    short: 'Número que diz o quanto uma conexão influencia o neurônio seguinte.',
    long: 'Pesos são os parâmetros que a rede aprende. Peso positivo e grande = sinal passa forte; peso negativo = sinal é invertido/inibido. No canvas, linhas azuis são pesos positivos e laranjas, negativos. A espessura indica a magnitude.',
  },
  vies: {
    term: 'Viés (bias)',
    short: 'Valor somado à entrada do neurônio que desloca a ativação.',
    long: 'O viés permite que o neurônio "dispare" mesmo quando todas as entradas são zero. Geometricamente, ele desloca a fronteira de decisão. Sem viés, toda fronteira passaria pela origem.',
  },
  camada: {
    term: 'Camada (layer)',
    short: 'Conjunto de neurônios no mesmo nível da rede.',
    long: 'Camada de entrada recebe os dados; camadas ocultas transformam o sinal progressivamente; a camada de saída produz a resposta (aqui, a probabilidade da classe 1). Mais camadas = transformações mais complexas.',
  },
  ativacao: {
    term: 'Função de ativação',
    short: 'Função não-linear aplicada à saída de cada neurônio.',
    long: 'Sem não-linearidade, empilhar camadas seria equivalente a uma única camada linear. tanh esmaga valores em [-1, 1]; ReLU zera negativos e deixa positivos passarem; sigmoide comprime em [0, 1].',
  },
  forward: {
    term: 'Forward pass',
    short: 'O caminho do sinal da entrada até a saída da rede.',
    long: 'Cada camada multiplica as entradas pelos pesos, soma o viés e aplica a ativação. O resultado final é a predição. Observe as pulsações no canvas: elas representam esse fluxo.',
  },
  loss: {
    term: 'Função de perda (loss)',
    short: 'Número que mede o quanto a rede está errando.',
    long: 'Usamos entropia cruzada binária: ela penaliza muito quando a rede está "confiante e errada". O objetivo do treinamento é minimizar esse número. Acompanhe a curva de perda caindo no gráfico.',
  },
  backprop: {
    term: 'Backpropagation',
    short: 'Algoritmo que calcula como cada peso contribuiu para o erro.',
    long: 'Aplica a regra da cadeia do cálculo de trás para frente: distribui a "culpa" do erro camada por camada, produzindo um gradiente para cada peso. É só cálculo eficiente — nenhuma mágica.',
  },
  gradiente: {
    term: 'Gradiente',
    short: 'Vetor que aponta a direção em que o erro aumenta.',
    long: 'Para cada peso, o gradiente diz: "se aumentar este peso um pouco, o erro sobe/desce tanto". O treinamento anda na direção oposta ao gradiente para reduzir o erro.',
  },
  lr: {
    term: 'Taxa de aprendizado',
    short: 'Tamanho do passo em cada atualização dos pesos.',
    long: 'Taxa alta = aprende rápido mas pode "pular" o mínimo e divergir. Taxa baixa = estável mas lento. Experimente 0.001, 0.03 e 0.5 para sentir a diferença.',
  },
  epoca: {
    term: 'Época (epoch)',
    short: 'Uma passada completa por todos os dados de treino.',
    long: 'A cada época, cada ponto é mostrado à rede uma vez (em ordem embaralhada) e os pesos são ajustados. Centenas de épocas refinam a fronteira de decisão aos poucos.',
  },
  overfitting: {
    term: 'Overfitting',
    short: 'Quando a rede decora os dados em vez de generalizar.',
    long: 'Rede grande demais + dados com ruído = fronteira cheia de "ilhas" que acertam o treino mas errariam dados novos. Compare a fronteira suave (poucos neurônios) com a recortada (muitos neurônios).',
  },
  fronteira: {
    term: 'Fronteira de decisão',
    short: 'Linha que separa as regiões que a rede classifica como 0 ou 1.',
    long: 'O fundo colorido do gráfico de dados mostra o que a rede "pensa" de cada ponto do espaço. Treinar = mover essa fronteira até separar as classes.',
  },
}

export interface Lesson {
  id: string
  title: string
  body: string
  terms: string[]
}

export const LESSONS: Lesson[] = [
  {
    id: 'neuronio',
    title: '1 · O neurônio',
    body: 'Tudo começa aqui: cada neurônio faz uma soma ponderada das entradas (pesos × valores + viés) e passa o resultado por uma função de ativação. Passe o mouse sobre os neurônios do canvas e ajuste os sliders de camadas para ver a arquitetura mudar.',
    terms: ['neuronio', 'peso', 'vies', 'camada'],
  },
  {
    id: 'forward',
    title: '2 · Forward pass',
    body: 'Aperte o play e observe as pulsações atravessando a rede: esse é o sinal indo da entrada até a saída. Ao mesmo tempo, o fundo do gráfico de dados mostra a fronteira de decisão atual da rede.',
    terms: ['forward', 'ativacao', 'fronteira'],
  },
  {
    id: 'loss',
    title: '3 · Erro e perda',
    body: 'Cada predição é comparada com o rótulo real e a função de perda resume o erro em um número. O gráfico de perda mostra esse número caindo época após época — quanto menor, melhor a rede está classificando.',
    terms: ['loss', 'epoca'],
  },
  {
    id: 'backprop',
    title: '4 · Backpropagation',
    body: 'Depois de errar, a rede calcula a "culpa" de cada peso com a regra da cadeia e ajusta cada um na direção oposta ao gradiente, com passo proporcional à taxa de aprendizado. É assim, repetido milhares de vezes, que a rede aprende.',
    terms: ['backprop', 'gradiente', 'lr', 'peso'],
  },
  {
    id: 'experimentos',
    title: '5 · Experimentos guiados',
    body: '• Troque tanh por ReLU e observe a perda. • Suba a taxa para 0.5: a perda oscila? • Use 1 neurônio no XOR: a rede consegue? • Coloque 8 neurônios com ruído alto: surgem ilhas de overfitting? Cada experimento ensina um conceito.',
    terms: ['ativacao', 'lr', 'overfitting', 'fronteira'],
  },
]
