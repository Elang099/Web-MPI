import type { Question } from '@prisma/client';
import type { GradedAnswer } from '@fec/shared';

/** Normalise free-text answers: case, whitespace, curly quotes, trailing punctuation. */
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.!?;:])/g, '$1')
    .replace(/[.!?]+$/g, '')
    .trim();
}

export function isCorrect(question: Pick<Question, 'type' | 'answer'>, response: string | string[]): boolean {
  const answer = question.answer as string | string[];
  switch (question.type) {
    case 'MATCH': {
      if (!Array.isArray(answer) || !Array.isArray(response)) return false;
      const want = new Set(answer.map(normalize));
      const got = new Set(response.map(normalize));
      return want.size === got.size && [...want].every((p) => got.has(p));
    }
    case 'FILL': {
      if (typeof response !== 'string') return false;
      const alternatives = (Array.isArray(answer) ? answer : String(answer).split('|')).map(normalize);
      return alternatives.includes(normalize(response));
    }
    case 'ORDER': {
      const r = Array.isArray(response) ? response.join(' ') : response;
      const alternatives = (Array.isArray(answer) ? answer : [String(answer)]).map(normalize);
      return alternatives.includes(normalize(r));
    }
    default: {
      // MCQ, LISTEN, TRUE_FALSE
      if (typeof response !== 'string') return false;
      const alternatives = (Array.isArray(answer) ? answer : [String(answer)]).map(normalize);
      return alternatives.includes(normalize(response));
    }
  }
}

export function grade(question: Question, response: string | string[]): GradedAnswer {
  return {
    questionId: question.id,
    isCorrect: isCorrect(question, response),
    correctAnswer: question.answer as string | string[],
    explanation: question.explanation,
  };
}

/** Strip the answer before sending questions to clients. Shuffle MATCH right column. */
export function toPublicQuestion(q: Question) {
  const data = (q.data ?? {}) as Record<string, unknown>;
  return { id: q.id, type: q.type, prompt: q.prompt, data, skill: q.skill, level: q.level };
}
