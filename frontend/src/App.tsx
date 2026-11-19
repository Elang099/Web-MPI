import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/services/queryClient';
import { api, refreshSession } from '@/services/api';
import { useAuth } from '@/stores/auth';
import { applyTheme, useSettingsStore } from '@/stores/settings';
import { Toaster } from '@/components/Toaster';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AppLayout } from '@/layouts/AppLayout';
import { GameLayout } from '@/layouts/GameLayout';

// Pages — Main Website
import { LandingPage } from '@/pages/LandingPage';
import { ForgotPasswordPage, LoginPage, RegisterPage, ResetPasswordPage } from '@/pages/AuthPages';
import { DashboardPage } from '@/pages/DashboardPage';
import { LearnPage } from '@/pages/LearnPage';
import { LessonPage } from '@/pages/LessonPage';
import { PathsPage } from '@/pages/PathsPage';
import { VocabularyPage } from '@/pages/VocabularyPage';
import { PracticePage } from '@/pages/PracticePage';
import { AiTutorPage } from '@/pages/AiTutorPage';
import { ProgressPage } from '@/pages/ProgressPage';
import { ResourcesPage } from '@/pages/ResourcesPage';
import { AssessmentsPage } from '@/pages/AssessmentsPage';
import { AssessmentRunPage } from '@/pages/AssessmentRunPage';
import { CertificatesPage } from '@/pages/CertificatesPage';
import { AchievementsPage } from '@/pages/AchievementsPage';
import { LeaderboardPage } from '@/pages/LeaderboardPage';
import { CommunityPage } from '@/pages/CommunityPage';
import { ProfilePage, PublicProfilePage } from '@/pages/ProfilePage';
import { NotificationsPage } from '@/pages/NotificationsPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { AdminPage } from '@/pages/AdminPage';

// Pages — Game Center
import { GameCenterPage } from '@/games/GameCenterPage';
import { AvatarCustomPage } from '@/games/AvatarCustomPage';
import { EnglishDashGame } from '@/games/dash/EnglishDashGame';
import { EnglishAdventureGame } from '@/games/adventure/EnglishAdventureGame';
import { CityBuilderGame } from '@/games/city/CityBuilderGame';
import { WordPuzzleGame } from '@/games/puzzle/WordPuzzleGame';
import { LifeSimulatorGame } from '@/games/simulator/LifeSimulatorGame';

function Bootstrap() {
  const { user, setReady } = useAuth();
  const { theme, reducedMotion, apply } = useSettingsStore();

  useEffect(() => {
    applyTheme(theme, reducedMotion);
  }, [theme, reducedMotion]);

  useEffect(() => {
    let active = true;
    void refreshSession().finally(() => {
      if (active) setReady();
    });
    return () => {
      active = false;
    };
  }, [setReady]);

  useEffect(() => {
    if (!user) return;
    void api
      .get<{ settings: Partial<typeof useSettingsStore extends never ? never : Record<string, unknown>> }>('/users/me/settings')
      .then((res) => {
        if (res.settings) {
          apply(res.settings as never);
          applyTheme((res.settings.theme as 'dark' | 'light' | 'system') ?? 'dark', Boolean(res.settings.reducedMotion));
        }
      })
      .catch(() => undefined);
  }, [user?.id, apply]);

  return null;
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Bootstrap />
        <Toaster />
        <Routes>
          {/* Public Landing & Auth */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Main Educational Application */}
          <Route element={<AppLayout />}>
            {/* Browsable even before login for effortless exploration */}
            <Route path="/learn" element={<LearnPage />} />
            <Route path="/learn/lesson/:slug" element={<LessonPage />} />
            <Route path="/paths" element={<PathsPage />} />
            <Route path="/vocabulary" element={<VocabularyPage />} />
            <Route path="/practice" element={<PracticePage />} />
            <Route path="/resources" element={<ResourcesPage />} />
            <Route path="/assessments" element={<AssessmentsPage />} />
            <Route path="/assessments/:slug" element={<AssessmentRunPage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/community" element={<CommunityPage />} />
            <Route path="/u/:username" element={<PublicProfilePage />} />

            {/* Authenticated Student / Teacher / Admin Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/ai-tutor" element={<AiTutorPage />} />
              <Route path="/progress" element={<ProgressPage />} />
              <Route path="/achievements" element={<AchievementsPage />} />
              <Route path="/certificates" element={<CertificatesPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>

            {/* Role-Restricted Admin & Teacher Studio */}
            <Route element={<ProtectedRoute roles={['ADMIN', 'TEACHER']} />}>
              <Route path="/admin" element={<AdminPage />} />
            </Route>
          </Route>

          {/* Educational Game Center (Distinct Arcade Visual Identity) */}
          <Route element={<ProtectedRoute />}>
            <Route element={<GameLayout />}>
              <Route path="/games" element={<GameCenterPage />} />
              <Route path="/games/avatar" element={<AvatarCustomPage />} />
              <Route path="/games/english-dash" element={<EnglishDashGame />} />
              <Route path="/games/english-adventure" element={<EnglishAdventureGame />} />
              <Route path="/games/city-builder" element={<CityBuilderGame />} />
              <Route path="/games/word-puzzle" element={<WordPuzzleGame />} />
              <Route path="/games/life-simulator" element={<LifeSimulatorGame />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
