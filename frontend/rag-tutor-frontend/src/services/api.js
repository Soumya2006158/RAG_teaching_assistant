/**
 * services/api.js
 * -----------------------------------------------------------------------
 * Thin service layer between the UI and your Python RAG backend.
 *
 * Point VITE_API_BASE_URL (in a .env file) at your FastAPI/Flask server.
 * Every call below degrades gracefully to local mock data if the request
 * fails, so the frontend is fully demoable before the backend exists.
 *
 * Expected backend endpoints (adjust paths to match your server):
 *   POST /api/tutor/ask        { subject, question, groundInCourse }
 *                               -> { answer, sources: [{title, tag, score, snippet}] }
 *   POST /api/quiz/generate    { subject, difficulty, count, types }
 *                               -> { questions: [{ id, type, prompt, options, answer, explanation }] }
 *   GET  /api/progress/summary?subject=...
 *                               -> { quizAverage, streak, accuracy, studyTime, weeklyActivity }
 * -----------------------------------------------------------------------
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

async function postJSON(path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Request failed: ${res.status}`)
  return res.json()
}

async function getJSON(path) {
  const res = await fetch(`${BASE_URL}${path}`)
  if (!res.ok) throw new Error(`Request failed: ${res.status}`)
  return res.json()
}

/* ------------------------------------------------------------------ */
/* AI Tutor (RAG)                                                      */
/* ------------------------------------------------------------------ */

export async function askTutor({ subject, question, groundInCourse }) {
  try {
    return await postJSON('/api/tutor/ask', { subject, question, groundInCourse })
  } catch (err) {
    // Fallback so the UI stays functional without a backend attached.
    await wait(900)
    return mockTutorResponse(subject, question, groundInCourse)
  }
}

function mockTutorResponse(subject, question, groundInCourse) {
  const bank = MOCK_ANSWERS[subject] || MOCK_ANSWERS.default
  const hit = bank.find((b) => question.toLowerCase().includes(b.match)) || bank[0]
  return {
    answer: hit.answer,
    sources: groundInCourse ? hit.sources : [],
  }
}

/* ------------------------------------------------------------------ */
/* Quiz Generator                                                      */
/* ------------------------------------------------------------------ */

export async function generateQuiz({ subject, difficulty, count, types }) {
  try {
    return await postJSON('/api/quiz/generate', { subject, difficulty, count, types })
  } catch (err) {
    await wait(700)
    return { questions: buildMockQuiz(subject, difficulty, count, types) }
  }
}

function buildMockQuiz(subject, difficulty, count, types) {
  const pool = MOCK_QUESTIONS[subject] || MOCK_QUESTIONS.default
  const questions = []
  for (let i = 0; i < count; i++) {
    const base = pool[i % pool.length]
    questions.push({ ...base, id: `${base.id}-${i}`, difficulty })
  }
  return questions
}

/* ------------------------------------------------------------------ */
/* Progress                                                             */
/* ------------------------------------------------------------------ */

export async function fetchProgressSummary(subject) {
  try {
    return await getJSON(`/api/progress/summary?subject=${encodeURIComponent(subject)}`)
  } catch (err) {
    return {
      quizAverage: 84,
      streak: 12,
      accuracy: 81,
      studyTime: '4h 40m',
      weeklyActivity: WEEKLY_ACTIVITY,
    }
  }
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/* ------------------------------------------------------------------ */
/* Static mock data used across dashboard widgets                      */
/* ------------------------------------------------------------------ */

export const WEEKLY_ACTIVITY = [
  { day: 'Mon', minutes: 32 },
  { day: 'Tue', minutes: 51 },
  { day: 'Wed', minutes: 18 },
  { day: 'Thu', minutes: 64 },
  { day: 'Fri', minutes: 40 },
  { day: 'Sat', minutes: 72 },
  { day: 'Sun', minutes: 28 },
]

const MOCK_ANSWERS = {
  'Computer Networks': [
    {
      match: 'tcp',
      answer:
        'The TCP three-way handshake establishes a reliable connection before data transfer. The client sends a SYN packet to request a connection. The server responds with SYN-ACK, acknowledging the request and proposing its own sequence number. The client replies with ACK, confirming both sides agree on sequence numbers. Once complete, both ends can exchange data reliably.',
      sources: [
        { tag: 'CN-W3', title: 'Transport Layer \u2014 Connection Establishment', score: 0.93 },
        { tag: 'CN-W3', title: 'RFC 793 Summary Notes', score: 0.88 },
      ],
    },
    {
      match: 'default',
      answer:
        'Networking protocols are layered so each layer solves one problem independently \u2014 physical transmission, addressing, routing, and reliable delivery are handled by different layers of the OSI or TCP/IP model.',
      sources: [{ tag: 'CN-W1', title: 'OSI Model \u2014 Layered Architecture', score: 0.9 }],
    },
  ],
  Economics: [
    {
      match: 'fiscal',
      answer:
        'Fiscal policy is government spending and taxation used to influence the economy, set by legislatures. Monetary policy is the control of money supply and interest rates, typically set by a central bank. Fiscal policy acts through the budget; monetary policy acts through credit conditions.',
      sources: [
        { tag: 'ECO-W5', title: 'Macroeconomic Policy Tools', score: 0.91 },
        { tag: 'ECO-W5', title: 'Central Bank Instruments', score: 0.85 },
      ],
    },
    {
      match: 'default',
      answer:
        'Opportunity cost is the value of the next-best alternative given up when a choice is made \u2014 it\u2019s the foundation of nearly every economic trade-off.',
      sources: [{ tag: 'ECO-W1', title: 'Scarcity and Choice', score: 0.89 }],
    },
  ],
  'AI / ML': [
    {
      match: 'overfit',
      answer:
        'Overfitting happens when a model learns noise in the training data instead of the underlying pattern, so it performs well in training but poorly on new data. Common fixes are regularization (L1/L2), dropout, early stopping, cross-validation, and gathering more training data.',
      sources: [
        { tag: 'AIML-W4', title: 'Bias-Variance Tradeoff', score: 0.94 },
        { tag: 'AIML-W4', title: 'Regularization Techniques', score: 0.9 },
      ],
    },
    {
      match: 'default',
      answer:
        'Gradient descent updates model parameters by moving them in the direction that most reduces the loss function, scaled by a learning rate.',
      sources: [{ tag: 'AIML-W2', title: 'Optimization Fundamentals', score: 0.87 }],
    },
  ],
  default: [
    {
      match: 'default',
      answer: 'Here\u2019s a grounded explanation based on your course material.',
      sources: [{ tag: 'GEN', title: 'Course Notes', score: 0.8 }],
    },
  ],
}

const MOCK_QUESTIONS = {
  'Computer Networks': [
    {
      id: 'cn1',
      type: 'MCQ',
      prompt: 'Which layer of the OSI model is responsible for routing packets between networks?',
      options: ['Data Link', 'Network', 'Transport', 'Session'],
      answer: 1,
      explanation: 'The Network layer (Layer 3) handles logical addressing and routing between networks.',
    },
    {
      id: 'cn2',
      type: 'True/False',
      prompt: 'UDP guarantees in-order delivery of packets.',
      options: ['True', 'False'],
      answer: 1,
      explanation: 'UDP is connectionless and does not guarantee ordering or delivery \u2014 that\u2019s TCP.',
    },
    {
      id: 'cn3',
      type: 'Numerical',
      prompt: 'How many bits are in an IPv4 address?',
      options: null,
      answer: '32',
      explanation: 'IPv4 addresses are 32 bits, typically written as four 8-bit octets.',
    },
  ],
  Economics: [
    {
      id: 'ec1',
      type: 'MCQ',
      prompt: 'A leftward shift of the supply curve, with demand constant, typically causes:',
      options: ['Lower price, lower quantity', 'Higher price, lower quantity', 'Higher price, higher quantity', 'No change'],
      answer: 1,
      explanation: 'Less supply at every price level pushes the equilibrium price up and quantity down.',
    },
    {
      id: 'ec2',
      type: 'True/False',
      prompt: 'Inflation and unemployment always move in the same direction (per the Phillips Curve).',
      options: ['True', 'False'],
      answer: 1,
      explanation: 'The short-run Phillips Curve suggests an inverse relationship, though it can shift over time.',
    },
  ],
  'AI / ML': [
    {
      id: 'ml1',
      type: 'MCQ',
      prompt: 'Which activation function is most associated with vanishing gradients?',
      options: ['ReLU', 'Sigmoid', 'Leaky ReLU', 'Softmax'],
      answer: 1,
      explanation: 'Sigmoid saturates at extremes, producing very small gradients during backpropagation.',
    },
    {
      id: 'ml2',
      type: 'Numerical',
      prompt: 'In k-fold cross-validation with k=5, what percentage of data is held out per fold?',
      options: null,
      answer: '20',
      explanation: 'With 5 folds, each fold holds out 1/5 = 20% of the data for validation.',
    },
  ],
  default: [
    {
      id: 'g1',
      type: 'MCQ',
      prompt: 'Sample question \u2014 configure a subject to see tailored content.',
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      answer: 0,
      explanation: 'This is placeholder content.',
    },
  ],
}
