// As 20 casas do perímetro do tabuleiro "Cidades Inteligentes" (sentido horário a partir do Início)
export const BOARD_SPACES = [
  {
    index: 0,
    nome: "Início",
    tipo: "inicio",
    x: 8.5,
    y: 91.5,
    descricao: "Ponto de partida! A cada volta completa passando pelo Início, você ganha 1 peça do Quebra-Cabeça Cidades Inteligentes (total de 3 peças)."
  },
  {
    index: 1,
    nome: "Progresso ou Regresso",
    tipo: "progresso_regresso",
    x: 8.5,
    y: 74.9,
    descricao: "Sorteie uma carta do monte de Progresso Sustentável ou Regresso Ambiental!"
  },
  {
    index: 2,
    nome: "Progresso ou Regresso",
    tipo: "progresso_regresso",
    x: 8.5,
    y: 58.3,
    descricao: "Sorteie uma carta do monte de Progresso Sustentável ou Regresso Ambiental!"
  },
  {
    index: 3,
    nome: "Espaço STEAM+",
    tipo: "steam",
    x: 8.5,
    y: 41.7,
    descricao: "Inovação e Tecnologia Sustentável! Sua cidade investiu em pesquisa STEAM e você ganhou +2 Créditos Verdes!"
  },
  {
    index: 4,
    nome: "Carta de Ação",
    tipo: "acao",
    x: 8.5,
    y: 25.1,
    descricao: "Hora de agir! Responda ao desafio de Quiz, Criatividade, Debate ou Ação Cidadã para ganhar Créditos Verdes!"
  },
  {
    index: 5,
    nome: "Momento de Descanso",
    tipo: "descanso",
    x: 8.5,
    y: 8.5,
    descricao: "Momento de descanso sob o arco-íris! Respire ar puro na cidade sustentável."
  },
  {
    index: 6,
    nome: "Carta de Ação",
    tipo: "acao",
    x: 25.1,
    y: 8.5,
    descricao: "Hora de agir! Responda ao desafio de Quiz, Criatividade, Debate ou Ação Cidadã para ganhar Créditos Verdes!"
  },
  {
    index: 7,
    nome: "Passeio no Parque",
    tipo: "parque",
    x: 41.7,
    y: 8.5,
    descricao: "Você chegou ao parque! Aproveite o passeio na área verde (conta como +1 rodada de descanso)."
  },
  {
    index: 8,
    nome: "Progresso ou Regresso",
    tipo: "progresso_regresso",
    x: 58.3,
    y: 8.5,
    descricao: "Sorteie uma carta do monte de Progresso Sustentável ou Regresso Ambiental!"
  },
  {
    index: 9,
    nome: "Pedal Sustentável",
    tipo: "bike_avance3",
    x: 74.9,
    y: 8.5,
    descricao: "Você andou de bike e não emitiu nenhum CO₂! Avance 3 casas!"
  },
  {
    index: 10,
    nome: "Momento de Descanso",
    tipo: "descanso",
    x: 91.5,
    y: 8.5,
    descricao: "Momento de descanso! Aprecie os espaços públicos planejados da cidade."
  },
  {
    index: 11,
    nome: "Carta de Ação",
    tipo: "acao",
    x: 91.5,
    y: 25.1,
    descricao: "Hora de agir! Responda ao desafio de Quiz, Criatividade, Debate ou Ação Cidadã para ganhar Créditos Verdes!"
  },
  {
    index: 12,
    nome: "Descarte Incorreto",
    tipo: "lixo_volte2",
    x: 91.5,
    y: 41.7,
    descricao: "Você não descartou o lixo corretamente. Volte 2 casas!"
  },
  {
    index: 13,
    nome: "Espaço STEAM+",
    tipo: "steam",
    x: 91.5,
    y: 58.3,
    descricao: "Inovação e Tecnologia Sustentável! Sua cidade investiu em soluções inteligentes e você ganhou +2 Créditos Verdes!"
  },
  {
    index: 14,
    nome: "Progresso ou Regresso",
    tipo: "progresso_regresso",
    x: 91.5,
    y: 74.9,
    descricao: "Sorteie uma carta do monte de Progresso Sustentável ou Regresso Ambiental!"
  },
  {
    index: 15,
    nome: "Momento de Descanso",
    tipo: "descanso",
    x: 91.5,
    y: 91.5,
    descricao: "Momento de descanso! Aproveite a tranquilidade de uma cidade bem planejada."
  },
  {
    index: 16,
    nome: "Compartilhando Saberes",
    tipo: "estudo_jogue_novamente",
    x: 74.9,
    y: 91.5,
    descricao: "Você estudou sobre as cidades inteligentes e está compartilhando sobre o assunto com outras pessoas! Ganhe +2 Créditos Verdes e jogue novamente!"
  },
  {
    index: 17,
    nome: "Carta de Ação",
    tipo: "acao",
    x: 58.3,
    y: 91.5,
    descricao: "Hora de agir! Responda ao desafio de Quiz, Criatividade, Debate ou Ação Cidadã para ganhar Créditos Verdes!"
  },
  {
    index: 18,
    nome: "Progresso ou Regresso",
    tipo: "progresso_regresso",
    x: 41.7,
    y: 91.5,
    descricao: "Sorteie uma carta do monte de Progresso Sustentável ou Regresso Ambiental!"
  },
  {
    index: 19,
    nome: "Carta de Ação",
    tipo: "acao",
    x: 25.1,
    y: 91.5,
    descricao: "Hora de agir! Responda ao desafio de Quiz, Criatividade, Debate ou Ação Cidadã para ganhar Créditos Verdes!"
  }
];

// As 40 Cartas Oficiais de Progresso Sustentável (20) e Regresso Ambiental (20) — Páginas 5, 6 e 7 do PDF
export const PROGRESSO_REGRESSO_CARDS = [
  // 20 Cartas de Progresso
  { id: "P1", subtipo: "Progresso", creditos: 2, texto: "A biblioteca da sua cidade criou um programa de inclusão digital." },
  { id: "P2", subtipo: "Progresso", creditos: 3, texto: "A prefeitura instalou painéis solares em escolas e hospitais." },
  { id: "P3", subtipo: "Progresso", creditos: 2, texto: "Sua cidade criou ciclovias interligadas a pontos de ônibus e metrô." },
  { id: "P4", subtipo: "Progresso", creditos: 3, texto: "Seu bairro implementou um programa de compostagem e coleta seletiva." },
  { id: "P5", subtipo: "Progresso", creditos: 1, texto: "Wi-Fi gratuito foi instalado em praças e centros comunitários." },
  { id: "P6", subtipo: "Progresso", creditos: 2, texto: "Um novo sistema de iluminação pública inteligente reduziu o consumo de energia e aumentou a segurança." },
  { id: "P7", subtipo: "Progresso", creditos: 3, texto: "A prefeitura proibiu construções em áreas de proteção ambiental." },
  { id: "P8", subtipo: "Progresso", creditos: 2, texto: "Foram instalados postos de recarga para carros elétricos na cidade." },
  { id: "P9", subtipo: "Progresso", creditos: 2, texto: "A cidade implementou um programa de educação ambiental nas escolas." },
  { id: "P10", subtipo: "Progresso", creditos: 2, texto: "Empresas e residências aderiram a sistemas de captação de água da chuva." },
  { id: "P11", subtipo: "Progresso", creditos: 3, texto: "A cidade criou corredores ecológicos com árvores e jardins verticais." },
  { id: "P12", subtipo: "Progresso", creditos: 3, texto: "Novos prédios sustentáveis foram construídos com reaproveitamento de materiais." },
  { id: "P13", subtipo: "Progresso", creditos: 3, texto: "A cidade começou a usar energia eólica em seus edifícios públicos." },
  { id: "P14", subtipo: "Progresso", creditos: 2, texto: "Um sistema de carona solidária foi implementado, reduzindo o trânsito." },
  { id: "P15", subtipo: "Progresso", creditos: 3, texto: "Hortas comunitárias foram criadas para incentivar alimentação saudável e sustentável." },
  { id: "P16", subtipo: "Progresso", creditos: 3, texto: "A cidade investiu em capacitação profissional para empregos na economia verde." },
  { id: "P17", subtipo: "Progresso", creditos: 4, texto: "A cidade revitalizou áreas poluídas, tornando-as espaços verdes." },
  { id: "P18", subtipo: "Progresso", creditos: 2, texto: "Foi realizada uma campanha de conscientização ambiental em escolas e empresas." },
  { id: "P19", subtipo: "Progresso", creditos: 3, texto: "A cidade criou pontos de descarte e reciclagem de lixo eletrônico." },
  { id: "P20", subtipo: "Progresso", creditos: 2, texto: "Sua cidade substituiu parte da frota de ônibus por veículos elétricos. Agora o transporte público é mais limpo e silencioso." },

  // 20 Cartas de Regresso
  { id: "R1", subtipo: "Regresso", creditos: -4, texto: "Uma área verde foi queimada para dar lugar a um estacionamento." },
  { id: "R2", subtipo: "Regresso", creditos: -3, texto: "Indústrias foram flagradas despejando resíduos químicos nos rios da cidade." },
  { id: "R3", subtipo: "Regresso", creditos: -2, texto: "O incentivo ao uso de carros individuais causou congestionamentos e poluição." },
  { id: "R4", subtipo: "Regresso", creditos: -3, texto: "O número de ônibus foi reduzido, dificultando a mobilidade dos cidadãos." },
  { id: "R5", subtipo: "Regresso", creditos: -3, texto: "A coleta seletiva foi desativada na cidade." },
  { id: "R6", subtipo: "Regresso", creditos: -2, texto: "A cidade não investiu em reúso da água e sofre com racionamento." },
  { id: "R7", subtipo: "Regresso", creditos: -2, texto: "As empresas da cidade não aderiram à redução de plásticos descartáveis." },
  { id: "R8", subtipo: "Regresso", creditos: -3, texto: "O excesso de concreto e a falta de áreas verdes aumentaram a temperatura urbana." },
  { id: "R9", subtipo: "Regresso", creditos: -2, texto: "A cidade não investiu em calçadas acessíveis e ciclovias." },
  { id: "R10", subtipo: "Regresso", creditos: -2, texto: "O barulho excessivo nas ruas causa impactos na saúde da população." },
  { id: "R11", subtipo: "Regresso", creditos: -3, texto: "A cidade não investiu em infraestrutura para pessoas com deficiência." },
  { id: "R12", subtipo: "Regresso", creditos: -3, texto: "A cidade usa água potável para lavagem de ruas e rega de jardins." },
  { id: "R13", subtipo: "Regresso", creditos: -2, texto: "Os serviços públicos continuam burocráticos e ineficientes." },
  { id: "R14", subtipo: "Regresso", creditos: -2, texto: "As decisões urbanas não levaram em conta a participação da população." },
  { id: "R15", subtipo: "Regresso", creditos: -4, texto: "A cidade falhou em investir no transporte público e a frota de veículos individuais aumentou, elevando os níveis de poluição e congestionamento." },
  { id: "R16", subtipo: "Regresso", creditos: -3, texto: "A cidade não investiu em tecnologia para gestão sustentável dos serviços urbanos." },
  { id: "R17", subtipo: "Regresso", creditos: -3, texto: "Árvores foram cortadas sem planejamento, aumentando o calor na cidade." },
  { id: "R18", subtipo: "Regresso", creditos: -4, texto: "O sistema de drenagem não foi modernizado, causando alagamentos nas chuvas." },
  { id: "R19", subtipo: "Regresso", creditos: -4, texto: "A cidade cresceu sem planejamento, aumentando os problemas ambientais." },
  { id: "R20", subtipo: "Regresso", creditos: -2, texto: "Lâmpadas incandescentes continuam sendo usadas, desperdiçando energia." }
];

// As 48 Cartas de Ação do PDF (Quiz, Criatividade, Debate e Ação Cidadã — Páginas 7, 8, 9 e 10)
export const ACAO_CARDS = [
  // 13 Cartas de Quiz (+4 créditos verdes)
  {
    id: "Q1",
    categoria: "Quiz",
    creditos: 4,
    pergunta: "Qual é a principal fonte de energia renovável usada no Brasil?",
    opcoes: [
      "A) Energia Hidrelétrica (gerada pela força da água nos rios).",
      "B) Energia Nuclear gerada por urânio enriquecido.",
      "C) Queima de carvão mineral em termelétricas."
    ],
    correta: 0,
    explicacao: "Resposta oficial do cartão: Hidrelétrica! O Brasil possui grande rede hidrográfica e gera a maior parte de sua eletricidade em usinas hidrelétricas."
  },
  {
    id: "Q2",
    categoria: "Quiz",
    creditos: 4,
    pergunta: "O que é uma cidade inteligente?",
    opcoes: [
      "A) Uma cidade que substitui todas as árvores por prédios automatizados.",
      "B) Um local que usa tecnologia e inovação para gerir recursos e melhorar a qualidade de vida das pessoas.",
      "C) Uma cidade onde apenas carros movidos a gasolina podem circular."
    ],
    correta: 1,
    explicacao: "Resposta oficial do cartão: Um local que usa tecnologia e inovação para a gestão de recursos (energia, água, transporte) e melhorar a qualidade de vida das pessoas."
  },
  {
    id: "Q3",
    categoria: "Quiz",
    creditos: 4,
    pergunta: "O que é a mobilidade urbana sustentável?",
    opcoes: [
      "A) Uso de meios de transporte de energia limpa, planejamento urbano e tecnologia para a gestão de trânsito inteligente.",
      "B) Aumentar o número de carros individuais com motores a diesel nas avenidas.",
      "C) Proibir os cidadãos de caminharem ou usarem bicicletas nas ruas."
    ],
    correta: 0,
    explicacao: "Resposta oficial do cartão: Uso de meios de transporte de energia limpa, planejamento urbano e tecnologia para a gestão de trânsito inteligente."
  },
  {
    id: "Q4",
    categoria: "Quiz",
    creditos: 4,
    pergunta: "O que é a energia solar fotovoltaica?",
    opcoes: [
      "A) Energia obtida por meio da queima de gás natural.",
      "B) Energia obtida por meio da luz do sol convertida em eletricidade.",
      "C) Energia gerada pelo movimento das marés oceânicas."
    ],
    correta: 1,
    explicacao: "Resposta oficial do cartão: Energia obtida por meio da luz do sol!"
  },
  {
    id: "Q5",
    categoria: "Quiz",
    creditos: 4,
    pergunta: "Qual é o principal benefício da coleta seletiva?",
    opcoes: [
      "A) Misturar todos os resíduos para ocuparem mais espaço nos lixões.",
      "B) Reduz a poluição e permite a reciclagem dos materiais.",
      "C) Aumentar o consumo de embalagens plásticas descartáveis."
    ],
    correta: 1,
    explicacao: "Resposta oficial do cartão: Reduz a poluição e permite a reciclagem!"
  },
  {
    id: "Q6",
    categoria: "Quiz",
    creditos: 4,
    pergunta: "O que significa descarbonização das cidades?",
    opcoes: [
      "A) Redução das emissões de carbono (CO₂) na atmosfera.",
      "B) Pintar os prédios da cidade de cor escura para reter calor.",
      "C) Incentivar a abertura de novas usinas a carvão mineral."
    ],
    correta: 0,
    explicacao: "Resposta oficial do cartão: Redução das emissões de carbono!"
  },
  {
    id: "Q7",
    categoria: "Quiz",
    creditos: 4,
    pergunta: "Por que plantar árvores em cidades é essencial?",
    opcoes: [
      "A) Porque elas aumentam a temperatura do asfalto e bloqueiam o vento.",
      "B) Porque reduzem a poluição, amenizam o calor e melhoram a qualidade do ar.",
      "C) Porque impedem a infiltração da água da chuva no solo."
    ],
    correta: 1,
    explicacao: "Resposta oficial do cartão: Reduzem a poluição e melhoram a qualidade do ar!"
  },
  {
    id: "Q8",
    categoria: "Quiz",
    creditos: 4,
    pergunta: "Cite fontes de energia não renovável:",
    opcoes: [
      "A) Energia solar, eólica e hidrelétrica.",
      "B) Petróleo, carvão mineral e gás natural.",
      "C) Biomassa e energia dos ventos."
    ],
    correta: 1,
    explicacao: "Resposta oficial do cartão: Petróleo, carvão mineral e gás natural são combustíveis fósseis não renováveis."
  },
  {
    id: "Q9",
    categoria: "Quiz",
    creditos: 4,
    pergunta: "Quais das opções abaixo são fontes de energia renovável?",
    opcoes: [
      "A) Energia hídrica (água), solar (sol), eólica (vento), biomassa e geotérmica.",
      "B) Óleo diesel, gasolina e carvão mineral.",
      "C) Gás natural e querosene de aviação."
    ],
    correta: 0,
    explicacao: "Resposta oficial do cartão: Energia hídrica (água), solar (sol), eólica (vento), biomassa e geotérmica."
  },
  {
    id: "Q10",
    categoria: "Quiz",
    creditos: 4,
    pergunta: "Verdadeiro ou falso: uma cidade inteligente deve considerar a diversidade de gênero, etnia, idade e condição física.",
    opcoes: [
      "A) Verdadeiro — a cidade inteligente deve ser inclusiva e acessível para todas as pessoas.",
      "B) Falso — cidades inteligentes focam apenas em computadores e ignoram as pessoas.",
      "C) Falso — acessibilidade não faz parte do planejamento urbano."
    ],
    correta: 0,
    explicacao: "Resposta oficial do cartão: Verdadeiro! Inclusão social e acessibilidade são pilares das Cidades Inteligentes."
  },
  {
    id: "Q11",
    categoria: "Quiz",
    creditos: 4,
    pergunta: "Por que incentivar o transporte coletivo de qualidade é importante?",
    opcoes: [
      "A) Porque diminui o gasto energético, a poluição e o trânsito nas cidades.",
      "B) Porque aumenta os engarrafamentos e o consumo de combustível fóssil.",
      "C) Porque dificulta o deslocamento dos trabalhadores."
    ],
    correta: 0,
    explicacao: "Resposta oficial do cartão: Diminui o gasto energético, a poluição e o trânsito."
  },
  {
    id: "Q12",
    categoria: "Quiz",
    creditos: 4,
    pergunta: "O que é um ecoponto?",
    opcoes: [
      "A) Um terreno baldio onde se queima lixo a céu aberto.",
      "B) Local público apropriado para o descarte correto e voluntário de resíduos recicláveis ou especiais.",
      "C) Um posto de venda de combustíveis fósseis."
    ],
    correta: 1,
    explicacao: "Resposta oficial do cartão: Local de descarte correto de resíduos!"
  },

  // 11 Cartas de Criatividade (+5 créditos verdes)
  {
    id: "C1",
    categoria: "Criatividade",
    creditos: 5,
    pergunta: "Desafio de Criatividade: Qual proposta reduz de forma inteligente o desperdício de água em escolas?",
    opcoes: [
      "A) Instalar torneiras com temporizador/sensor, captar água da chuva para limpeza e criar patrulhas estudantis contra vazamentos.",
      "B) Deixar as torneiras do pátio abertas o dia inteiro para resfriar o piso.",
      "C) Lavar todas as quadras diariamente com mangueira de água potável."
    ],
    correta: 0,
    explicacao: "Excelente proposta! Torneiras automáticas, reúso de água pluvial e educação ambiental escolar reduzem drasticamente o desperdício."
  },
  {
    id: "C2",
    categoria: "Criatividade",
    creditos: 5,
    pergunta: "Desafio de Criatividade: Qual proposta utiliza tecnologia para melhorar a segurança no trânsito sem prejudicar a mobilidade?",
    opcoes: [
      "A) Retirar todas as faixas de pedestres e semáforos das avenidas.",
      "B) Implantar semáforos inteligentes com sensores de fluxo, travessias iluminadas com botão acessível e ciclovias monitoradas.",
      "C) Dobrar a velocidade máxima permitida em frente às escolas."
    ],
    correta: 1,
    explicacao: "Perfeito! Semáforos inteligentes e travessias seguras protegem pedestres e ciclistas enquanto organizam o fluxo de veículos."
  },
  {
    id: "C3",
    categoria: "Criatividade",
    creditos: 5,
    pergunta: "Desafio de Criatividade: Qual proposta deixa a iluminação pública mais econômica e ecológica?",
    opcoes: [
      "A) Substituir lâmpadas antigas por luminárias de LED abastecidas por painéis solares e sensores de luminosidade.",
      "B) Usar lâmpadas incandescentes acesas 24 horas por dia, inclusive sob sol forte.",
      "C) Desligar toda a iluminação da cidade à noite, deixando as ruas no escuro."
    ],
    correta: 0,
    explicacao: "Ótima ideia! Luminárias LED com energia solar e sensores inteligentes economizam energia e garantem segurança."
  },
  {
    id: "C4",
    categoria: "Criatividade",
    creditos: 5,
    pergunta: "Desafio de Criatividade: Qual proposta torna os espaços urbanos mais acessíveis para idosos e PCDs?",
    opcoes: [
      "A) Construir calçadas estreitas com degraus altos e sem bancos de descanso.",
      "B) Implantar rampas padronizadas, piso tátil, calçadas niveladas, semáforos sonoros e áreas sombreadas com bancos.",
      "C) Priorizar apenas o estacionamento de carros sobre as calçadas."
    ],
    correta: 1,
    explicacao: "Muito bem! Desenho universal com rampas, piso tátil e semáforos sonoros garante autonomia e segurança para idosos e PCDs."
  },
  {
    id: "C5",
    categoria: "Criatividade",
    creditos: 5,
    pergunta: "Desafio de Criatividade: Como incentivar o uso de bicicletas nas cidades de forma segura?",
    opcoes: [
      "A) Criar ciclovias conectadas ao transporte público, bicicletários seguros e sistemas de bicicletas compartilhadas.",
      "B) Proibir bicicletas em todas as ruas e parques.",
      "C) Transformar as ciclovias existentes em vagas para caminhões."
    ],
    correta: 0,
    explicacao: "Excelente! Ciclovias protegidas e integradas a estações de transporte estimulam o pedal seguro e sem emissões."
  },
  {
    id: "C6",
    categoria: "Criatividade",
    creditos: 5,
    pergunta: "Desafio de Criatividade: Qual proposta facilita a coleta de resíduos em áreas de difícil acesso e incentiva a redução de plásticos?",
    opcoes: [
      "A) Criar ecopontos comunitários com troca de recicláveis por descontos/benefícios e premiar comércios que usam embalagens retornáveis.",
      "B) Despejar os resíduos em encostas e córregos próximos.",
      "C) Distribuir sacolas plásticas descartáveis extras sem reciclagem."
    ],
    correta: 0,
    explicacao: "Brilhante! Ecopontos comunitários com logística reversa e incentivo a embalagens retornáveis engajam moradores e comerciantes."
  },

  // Cartas de Debate (+5 créditos verdes)
  {
    id: "D1",
    categoria: "Debate",
    creditos: 5,
    pergunta: "Debate Urbano: Os carros elétricos sozinhos resolvem todos os problemas de mobilidade urbana?",
    opcoes: [
      "A) Não sozinhos: eles reduzem a emissão de gases, mas a cidade também precisa investir em transporte público coletivo, ciclovias e calçadas.",
      "B) Sim, pois se todos tiverem carros individuais nunca haverá congestionamento.",
      "C) Carros elétricos poluem mais o ar das ruas do que caminhões a diesel."
    ],
    correta: 0,
    explicacao: "Excelente reflexão! Carros elétricos reduzem emissões, mas diminuir os congestionamentos exige transporte coletivo eficiente e mobilidade ativa."
  },
  {
    id: "D2",
    categoria: "Debate",
    creditos: 5,
    pergunta: "Debate Urbano: Por que telhados verdes e mais áreas exclusivas para pedestres são importantes nos centros urbanos?",
    opcoes: [
      "A) Porque ajudam a absorver a água da chuva, reduzem as ilhas de calor e tornam a cidade mais saudável e segura para caminhar.",
      "B) Porque aumentam a poluição sonora e o calor nas avenidas.",
      "C) Porque impedem o comércio local de funcionar."
    ],
    correta: 0,
    explicacao: "Isso mesmo! Telhados verdes e calçadões arborizados refrescam o microclima urbano, melhoram a drenagem e valorizam a convivência."
  },
  {
    id: "D3",
    categoria: "Debate",
    creditos: 5,
    pergunta: "Debate Urbano: Como equilibrar o crescimento urbano com a preservação ambiental e o controle do lixo eletrônico?",
    opcoes: [
      "A) Com plano diretor participativo, proteção de áreas verdes, construções eficientes e logística reversa obrigatória para e-lixo.",
      "B) Desmatando todas as áreas de proteção para construir sem planejamento.",
      "C) Descartando computadores e baterias diretamente nos rios urbanos."
    ],
    correta: 0,
    explicacao: "Perfeito! O planejamento urbano sustentável alia moradia digna, áreas verdes protegidas e reciclagem tecnológica."
  },

  // Cartas de Ação Cidadã (+5 créditos verdes)
  {
    id: "A1",
    categoria: "Ação cidadã",
    creditos: 5,
    pergunta: "Ação Cidadã: Seu vizinho joga óleo de cozinha usado pelo ralo da pia. Como conscientizá-lo e resolver isso?",
    opcoes: [
      "A) Explicar que 1 litro de óleo contamina milhares de litros de água e ensiná-lo a guardar em garrafa PET para doar a pontos de reciclagem/sabão ecológico.",
      "B) Dizer para ele jogar o óleo diretamente na calçada ou no bueiro da rua.",
      "C) Misturar o óleo com lixo reciclável seco de papelão."
    ],
    correta: 0,
    explicacao: "Atitude cidadã exemplar! Armazenar o óleo usado em garrafa PET evita a contaminação da água e permite produzir biodiesel ou sabão."
  },
  {
    id: "A2",
    categoria: "Ação cidadã",
    creditos: 5,
    pergunta: "Ação Cidadã: Sua escola ainda não tem lixeiras de coleta seletiva e você nota desperdício de energia nas salas. O que fazer?",
    opcoes: [
      "A) Organizar com os colegas e professores um projeto de coletores identificados, campanhas de desligar luzes/ventiladores ao sair e aproveitamento de luz natural.",
      "B) Deixar todas as luzes acesas durante o fim de semana.",
      "C) Jogar todo o papel e plástico pela janela da sala."
    ],
    correta: 0,
    explicacao: "Excelente! O protagonismo estudantil transforma a escola em exemplo prático de sustentabilidade para toda a comunidade."
  },
  {
    id: "A3",
    categoria: "Ação cidadã",
    creditos: 5,
    pergunta: "Ação Cidadã: Há um espaço abandonado no bairro e o rio próximo está recebendo lixo. Qual é a melhor ação cidadã?",
    opcoes: [
      "A) Mobilizar a comunidade e cobrar a prefeitura para limpar o rio, instalar lixeiras e transformar o terreno em horta comunitária ou praça arborizada.",
      "B) Usar o terreno abandonado como lixão clandestino.",
      "C) Canalizar esgoto sem tratamento diretamente para o rio."
    ],
    correta: 0,
    explicacao: "Muito bem! A participação cidadã junto ao poder público recupera áreas degradadas e promove lazer, saúde e natureza no bairro."
  },
  {
    id: "A4",
    categoria: "Ação cidadã",
    creditos: 5,
    pergunta: "Ação Cidadã: Como incentivar os moradores da cidade a aproveitarem a água da chuva e usarem embalagens biodegradáveis?",
    opcoes: [
      "A) Promover oficinas de cisternas caseiras para regar jardins/lavar quintais e apoiar feiras e mercados que oferecem embalagens biodegradáveis ou retornáveis.",
      "B) Usar apenas água potável tratada para lavar calçadas todos os dias.",
      "C) Queimar embalagens plásticas no quintal de casa."
    ],
    correta: 0,
    explicacao: "Perfeito! O reúso de água da chuva e a escolha de embalagens sustentáveis preservam recursos naturais e reduzem o lixo urbano."
  }
];

export const SMART_CITIES_DEFINITION =
  "CIDADES INTELIGENTES: comprometidas com o desenvolvimento urbano e a transformação digital sustentáveis, em seus aspectos econômico, ambiental e sociocultural que atuam de forma planejada, inovadora, inclusiva e em rede, promovem o letramento digital, a governança e a gestão colaborativas e utilizam tecnologias para solucionar problemas concretos, criar oportunidades, oferecer serviços com eficiência, reduzir desigualdades, aumentar a resiliência e melhorar a qualidade de vida de todas as pessoas, garantindo o uso seguro e responsável de dados e das tecnologias da informação e comunicação.";
