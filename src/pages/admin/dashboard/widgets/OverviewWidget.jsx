import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { LayoutTemplate, FileText, BriefcaseBusiness, Mail, Users } from 'lucide-react';
import StatCard from '../../components/StatCard';
import BaseService from '../../../../services/BaseService';
import BlogService from '../../../../services/BlogService';
import ProjectService from '../../../../services/ProjectService';
import ExperienceService from '../../../../services/ExperienceService';
import MessageService from '../../../../services/MessageService';
import UserService from '../../../../services/UserService';
import { MODULES } from '../../../../utils/permissions';
import styles from '../DashboardTab.module.scss';

const QUERY_OPTS = { staleTime: 60000, gcTime: 300000, refetchOnWindowFocus: false };

const OverviewWidget = ({ ctx }) => {
  const { can, go, userRole, t, language } = ctx;

  const { data: projectStats = { total: 0, published: 0 } } = useQuery({
    queryKey: ['projects', 'stats'], enabled: can(MODULES.PROJECTS), ...QUERY_OPTS,
    queryFn: async () => { const { data, error } = await BaseService.safe(() => ProjectService.fetchStats()); return error ? { total: 0, published: 0 } : data; }
  });
  const { data: blogStats = { total: 0, drafts: 0 } } = useQuery({
    queryKey: ['posts', 'stats'], enabled: can(MODULES.BLOG), ...QUERY_OPTS,
    queryFn: async () => { const { data, error } = await BaseService.safe(() => BlogService.fetchStats()); return error ? { total: 0, drafts: 0 } : data; }
  });
  const { data: experienceStats = { total: 0, currentRoles: 0 } } = useQuery({
    queryKey: ['experience', 'stats', language], enabled: can(MODULES.EXPERIENCE), ...QUERY_OPTS,
    queryFn: async () => { const { data, error } = await BaseService.safe(() => ExperienceService.fetchStats(language)); return error ? { total: 0, currentRoles: 0 } : data; }
  });
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['messages', 'unreadCount'], enabled: can(MODULES.MESSAGES), ...QUERY_OPTS,
    queryFn: async () => { const { data, error } = await BaseService.safe(() => MessageService.getUnreadCount()); return error ? 0 : data; }
  });
  const { data: userStats = { total: 0 } } = useQuery({
    queryKey: ['users', 'stats'], enabled: can(MODULES.USERS), ...QUERY_OPTS,
    queryFn: async () => { const { data, error } = await BaseService.safe(() => UserService.fetchStats(userRole)); return error ? { total: 0 } : data; }
  });

  const cards = [
    can(MODULES.PROJECTS) && { icon: LayoutTemplate, color: '#2f6df6', tab: 'projects', value: projectStats.total, label: t('admin.dashboard.cards.projects'), description: t('admin.dashboard.cards.publishedCount', { count: projectStats.published ?? 0 }) },
    can(MODULES.BLOG) && { icon: FileText, color: '#14b8a6', tab: 'blog', value: blogStats.total, label: t('admin.dashboard.cards.posts'), description: t('admin.dashboard.cards.draftsCount', { count: blogStats.drafts ?? 0 }) },
    can(MODULES.EXPERIENCE) && { icon: BriefcaseBusiness, color: '#a855f7', tab: 'experience', value: experienceStats.total, label: t('admin.dashboard.cards.experience'), description: t('admin.dashboard.cards.currentRolesCount', { count: experienceStats.currentRoles ?? 0 }) },
    can(MODULES.MESSAGES) && { icon: Mail, color: '#f59e0b', tab: 'messages', value: unreadCount, label: t('admin.dashboard.cards.messages'), description: t('admin.dashboard.cards.unreadHint') },
    can(MODULES.USERS) && { icon: Users, color: '#0ea5e9', tab: 'users', value: userStats.total, label: t('admin.dashboard.cards.users'), description: t('admin.dashboard.cards.usersHint') }
  ].filter(Boolean);

  if (cards.length === 0) return null;

  return (
    <div className={styles.statGrid}>
      {cards.map((card) => (
        <StatCard key={card.label} icon={card.icon} color={card.color} value={card.value ?? 0} label={card.label} description={card.description} onClick={() => go(card.tab)} />
      ))}
    </div>
  );
};

export default OverviewWidget;
