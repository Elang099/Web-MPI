import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck, Megaphone } from 'lucide-react';
import { api } from '@/services/api';
import { EmptyState, ErrorState, PageHeader, PageLoader } from '@/components/ui';
import { Button } from '@/components/ui/Button';

interface NotificationDto {
  id: string;
  type: string;
  title: string;
  body: string;
  link?: string | null;
  readAt: string | null;
  createdAt: string;
}

interface AnnouncementDto {
  id: string;
  title: string;
  body: string;
  audience: string;
  createdAt: string;
}

export function NotificationsPage() {
  const qc = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get<{ notifications: NotificationDto[]; unreadCount: number; announcements: AnnouncementDto[] }>('/notifications'),
  });

  const markAllMut = useMutation({
    mutationFn: () => api.post('/notifications/read-all'),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['notifications'] });
      void qc.invalidateQueries({ queryKey: ['notifications-count'] });
    },
  });

  const markOneMut = useMutation({
    mutationFn: (id: string) => api.post(`/notifications/${id}/read`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['notifications'] });
      void qc.invalidateQueries({ queryKey: ['notifications-count'] });
    },
  });

  if (isLoading) return <PageLoader />;
  if (error || !data) return <ErrorState error={error} onRetry={() => void refetch()} />;

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <PageHeader
        eyebrow="Inbox & Updates"
        title="Notifications & Announcements"
        subtitle={`${data.unreadCount} unread notification(s).`}
        actions={
          data.unreadCount > 0 && (
            <Button size="sm" variant="secondary" icon={<CheckCheck className="h-4 w-4" />} onClick={() => markAllMut.mutate()}>
              Mark All Read
            </Button>
          )
        }
      />

      {data.announcements.length > 0 && (
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <Megaphone className="h-5 w-5 text-cyan" /> Platform Announcements
          </h2>
          {data.announcements.map((a) => (
            <div key={a.id} className="panel border-cyan/30 bg-cyan/5 p-5">
              <div className="flex items-center justify-between text-xs text-muted">
                <span className="chip text-cyan">{a.audience}</span>
                <span>{new Date(a.createdAt).toLocaleDateString()}</span>
              </div>
              <h3 className="mt-2 font-bold">{a.title}</h3>
              <p className="mt-1 text-sm text-muted">{a.body}</p>
            </div>
          ))}
        </section>
      )}

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <Bell className="h-5 w-5 text-neon" /> Activity Notifications
        </h2>
        {data.notifications.length === 0 ? (
          <EmptyState icon={<Bell className="h-6 w-6" />} title="All caught up!" body="You will receive alerts here when you level up, earn badges, or finish missions." />
        ) : (
          data.notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => !n.readAt && markOneMut.mutate(n.id)}
              className={`panel flex items-start justify-between gap-4 p-4 transition ${!n.readAt ? 'border-cyan/50 bg-cyan/5' : 'opacity-75'}`}
            >
              <div>
                <p className="text-sm font-bold">{n.title}</p>
                <p className="mt-0.5 text-xs text-muted">{n.body}</p>
                {n.link && (
                  <Link to={n.link} className="mt-1.5 inline-block text-xs font-bold text-cyan hover:underline">
                    Open →
                  </Link>
                )}
              </div>
              <span className="shrink-0 text-[11px] text-muted">{new Date(n.createdAt).toLocaleDateString()}</span>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
