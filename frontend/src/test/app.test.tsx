import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LandingPage } from '@/pages/LandingPage';
import { BlockRenderer } from '@/learning/BlockRenderer';
import { GameOverlayModal } from '@/games/core/GameStateMachine';
import { GameQuestionPrompt } from '@/games/core/GameQuestionPrompt';

describe('FUTURE ENGLISH CENTER — Frontend UI & Interactive Component Tests', () => {
  it('renders Landing Page branding, tagline, interactive preview & Game Center band', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Master English\. Unlock Your Future\./i);
    expect(screen.getByText(/Start Learning Free/i)).toBeInTheDocument();
    expect(screen.getAllByText(/English Dash/i).length).toBeGreaterThan(0);
  });

  it('renders interactive QuickCheck lesson block and gives immediate answer feedback', () => {
    render(
      <BlockRenderer
        block={{
          type: 'quickCheck',
          question: 'Pick the correct article: ___ honest friend',
          options: ['a', 'an', 'many'],
          answer: 'an',
          explanation: 'Silent h starts with a vowel sound.',
        }}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'an' }));
    expect(screen.getByText(/Silent h starts with a vowel sound\./i)).toBeInTheDocument();
  });

  it('renders GameOverlayModal across PAUSED and RESULTS states', () => {
    const onStart = vi.fn();
    const onResume = vi.fn();
    const onRestart = vi.fn();

    const { rerender } = render(
      <MemoryRouter>
        <GameOverlayModal
          state="PAUSED"
          title="English Dash"
          subtitle="Run!"
          onStart={onStart}
          onResume={onResume}
          onRestart={onRestart}
        />
      </MemoryRouter>,
    );
    expect(screen.getByText(/Game Paused/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Resume/i }));
    expect(onResume).toHaveBeenCalledTimes(1);

    rerender(
      <MemoryRouter>
        <GameOverlayModal
          state="RESULTS"
          title="English Dash"
          subtitle="Run!"
          result={{
            score: 1200,
            distance: 540,
            correct: 4,
            wrong: 1,
            reward: { xp: 60, coins: 45, leveledUp: false, newLevel: 2, achievements: [], items: [] },
          }}
          onStart={onStart}
          onRestart={onRestart}
        />
      </MemoryRouter>,
    );
    expect(screen.getByText(/Mission Results!/i)).toBeInTheDocument();
    expect(screen.getByText(/540m/i)).toBeInTheDocument();
  });

  it('renders instructions and input controls for FILL questions in GameQuestionPrompt', () => {
    const onSubmit = vi.fn();
    render(
      <GameQuestionPrompt
        question={{
          id: 'q1',
          type: 'FILL',
          prompt: 'Join the contrast: "I wanted to call you, ___ my battery died."',
          data: { hint: 'b _ t' },
        }}
        submitLabel="Unlock Door"
        onSubmit={onSubmit}
      />,
    );
    expect(screen.getByText(/Type the missing English word/i)).toBeInTheDocument();
    const input = screen.getByPlaceholderText(/Type your answer here/i);
    fireEvent.change(input, { target: { value: 'but' } });
    fireEvent.click(screen.getByRole('button', { name: /Unlock Door/i }));
    expect(onSubmit).toHaveBeenCalledWith('but');
  });
});
