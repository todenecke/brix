/**
 * Blitzrechnen – Zufällige Matheaufgaben für einfachen Schwierigkeitsgrad
 * Grundrechenarten, Zahlenraum bis 100
 */

import { ZAHLENRAUM } from '../config/blitzrechnenConfig'

const OPERATORS = [
  { op: '+', fn: (a, b) => a + b, gen: () => { const a = rand(0, 50); const b = rand(0, ZAHLENRAUM - a); return { a, b }; } },
  { op: '-', fn: (a, b) => a - b, gen: () => { const a = rand(1, ZAHLENRAUM); const b = rand(0, a); return { a, b }; } },
  { op: '·', fn: (a, b) => a * b, gen: () => ({ a: rand(1, 10), b: rand(1, 10) }) },
  { op: ':', fn: (a, b) => Math.floor(a / b), gen: () => { const b = rand(1, 10); const quotient = rand(1, 10); const a = b * quotient; return { a, b }; } },
]

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function getWrongAnswer(correct) {
  const offset = rand(1, 9) * (Math.random() > 0.5 ? 1 : -1)
  const wrong = correct + offset
  return wrong === correct ? correct + 1 : wrong
}

/**
 * @returns {{ text: string, correctAnswer: number, displayedAnswer: number, isCorrect: boolean }}
 */
export function generateMathProblem() {
  const opDef = OPERATORS[rand(0, OPERATORS.length - 1)]
  let { a, b } = opDef.gen()

  if (opDef.op === '-') {
    if (a < b) [a, b] = [b, a]
  } else if (opDef.op === ':') {
    if (b === 0) b = 1
  }

  const correctAnswer = opDef.fn(a, b)
  if (correctAnswer < 0 || correctAnswer > ZAHLENRAUM) {
    return generateMathProblem()
  }

  const showCorrect = Math.random() > 0.5
  const displayedAnswer = showCorrect ? correctAnswer : getWrongAnswer(correctAnswer)

  const text = `${a} ${opDef.op} ${b} = ${displayedAnswer}`
  return {
    text,
    correctAnswer,
    displayedAnswer,
    isCorrect: displayedAnswer === correctAnswer,
  }
}

/**
 * @param {number} count
 * @returns {Array<{ text: string, correctAnswer: number, displayedAnswer: number, isCorrect: boolean }>}
 */
export function generateMathProblems(count) {
  return Array.from({ length: count }, () => generateMathProblem())
}
