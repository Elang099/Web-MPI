import { AnimatePresence, motion } from 'framer-motion';
import { Award, CheckCircle2, Coins, Info, Sparkles, XCircle, Zap } from 'lucide-react';
import { useUi } from '@/stores/ui';
import { Modal } from './ui';
import { Button } from './ui/Button';

const icons = {
  success: <CheckCircle2 className="h-5 w-5 text-success" />,
  error: <XCircle className="h-5 w-5 text-danger" />,
  info: <Info className="h-5 w-5 text-cyan" />,
  reward: <Sparkles className="h-5 w-5 text-warning" />,
};

/** Global toasts + level-up/achievement celebration. Mounted once in App. */
export function Toaster() {
  const { toasts, dismiss, celebration, setCelebration } = useUi();
  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 top-3 z-[90] flex flex-col items-center gap-2 px-3 sm:items-end sm:pr-6">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: -16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40 }}
              className="panel pointer-events-auto flex w-full max-w-sm items-start gap-3 p-4 shadow-soft"
              onClick={() => dismiss(t.id)}
              role="status"
            >
              {icons[t.kind]}
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{t.title}</p>
                {t.body && <p className="text-sm text-muted">{t.body}</p>}
                {t.reward && (
                  <div className="mt-1 flex gap-3 font-ui text-sm font-bold">
                    {t.reward.xp > 0 && (
                      <span className="flex items-center gap-1 text-cyan">
                        <Zap className="h-4 w-4" />+{t.reward.xp} XP
                      </span>
                    )}
                    {t.reward.coins > 0 && (
                      <span className="flex items-center gap-1 text-warning">
                        <Coins className="h-4 w-4" />+{t.reward.coins}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <Modal open={!!celebration} onClose={() => setCelebration(null)}>
        {celebration && (
          <div className="flex flex-col items-center text-center">
            <motion.div initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 200 }} className="mb-4 grid h-24 w-24 place-items-center rounded-full bg-brand-gradient shadow-glow-purple">
              {celebration.leveledUp ? <span className="font-display text-4xl font-bold text-white">{celebration.newLevel}</span> : <Award className="h-12 w-12 text-white" />}
            </motion.div>
            <h2 className="text-2xl font-bold">{celebration.leveledUp ? `Level ${celebration.newLevel}!` : 'Achievement unlocked!'}</h2>
            <div className="mt-3 space-y-1 text-muted">
              {celebration.achievements.map((a) => (
                <p key={a.slug}>🏅 {a.title}</p>
              ))}
              {celebration.items.map((i) => (
                <p key={i.slug}>🎁 New item: {i.name}</p>
              ))}
            </div>
            <Button className="mt-6" onClick={() => setCelebration(null)}>
              Awesome!
            </Button>
          </div>
        )}
      </Modal>
    </>
  );
}
