import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import { Search, CornerDownLeft, ArrowUp, ArrowDown, Plus, Clock } from 'lucide-react';
import BaseService from '../../../services/BaseService';
import HighlightText from '@/shared/components/ui/HighlightText';
import { useTranslation } from '../../../hooks/useTranslation';
import { getSearchProviders } from '../../../registry/searchRegistry';
import { getNavItem, getNavigableKeys } from '../../../registry/navRegistry';
import { getContentType } from '../../../registry/contentTypeRegistry';
import { ACTIONS } from '../../../utils/permissions';
import { fuzzyScore } from '../../../utils/fuzzy';
import { readRecent, pushRecent } from '../../../hooks/useCommandPalette';
import { useDebounce } from '../../../hooks/useDebounce';
import styles from './CommandPalette.module.scss';

const RESULTS_PER_TYPE = 6;

const CommandPalette = ({ open, onClose, onNavigate, isActionAllowed, canViewTab }) => {
  const { t, language } = useTranslation();
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 250);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recent, setRecent] = useState([]);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const providers = useMemo(
    () => getSearchProviders().filter((provider) => isActionAllowed(ACTIONS.VIEW, provider.module)),
    [isActionAllowed]
  );

  const providerData = useQueries({
    queries: providers.map((provider) => ({
      queryKey: ['palette', provider.key],
      enabled: open && debouncedQuery.trim().length > 0,
      staleTime: 300000,
      gcTime: 300000,
      refetchOnWindowFocus: false,
      queryFn: async () => {
        const { data, error } = await BaseService.safe(() => provider.service.fetchPaginated({
          limit: 50,
          sortBy: 'createdAt',
          sortDirection: 'desc',
          includeTotal: false
        }));
        return error ? [] : (data.data || []);
      }
    }))
  });

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setSelectedIndex(0);
    setRecent(readRecent());
    const id = window.setTimeout(() => inputRef.current?.focus(), 20);
    return () => window.clearTimeout(id);
  }, [open]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const runNavigate = (tab, recentEntry) => {
    if (recentEntry) setRecent(pushRecent(recentEntry));
    onNavigate(tab);
    onClose();
  };

  const groups = useMemo(() => {
    const trimmed = debouncedQuery.trim();
    const result = [];

    // Search results (only when typing)
    if (trimmed) {
      providers.forEach((provider, index) => {
        const items = providerData[index]?.data || [];
        const scored = items
          .map((item) => ({ item, score: fuzzyScore(trimmed, provider.text(item)) }))
          .filter((entry) => entry.score >= 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, RESULTS_PER_TYPE);

        if (scored.length === 0) return;

        result.push({
          id: `results-${provider.key}`,
          title: t(provider.labelKey),
          commands: scored.map(({ item }) => {
            const title = provider.title(item, language) || t('admin.palette.untitled');
            return {
              id: `item:${provider.key}:${item.id}`,
              label: title,
              subtitle: provider.subtitle(item, language) || '',
              icon: provider.icon,
              run: () => runNavigate(provider.key, { type: provider.key, id: item.id, title })
            };
          })
        });
      });
    }

    // Recent (only when not typing)
    if (!trimmed && recent.length > 0) {
      result.push({
        id: 'recent',
        title: t('admin.palette.groups.recent'),
        commands: recent
          .filter((entry) => canViewTab(entry.type))
          .map((entry) => ({
            id: `recent:${entry.type}:${entry.id}`,
            label: entry.title || t('admin.palette.untitled'),
            subtitle: t(getContentType(entry.type)?.labelKey || ''),
            icon: getContentType(entry.type)?.icon || Clock,
            run: () => runNavigate(entry.type, entry)
          }))
      });
    }

    // Navigation
    const navCommands = getNavigableKeys()
      .map(getNavItem)
      .filter(Boolean)
      .filter((nav) => canViewTab(nav.key))
      .map((nav) => ({ nav, label: t(nav.labelKey) }))
      .filter((entry) => !trimmed || fuzzyScore(trimmed, entry.label) >= 0)
      .map(({ nav, label }) => ({
        id: `nav:${nav.key}`,
        label,
        subtitle: t('admin.palette.navigateTo'),
        icon: nav.icon,
        run: () => runNavigate(nav.key)
      }));
    if (navCommands.length > 0) {
      result.push({ id: 'navigation', title: t('admin.palette.groups.navigation'), commands: navCommands });
    }

    // Create actions
    const createCommands = getSearchProviders()
      .filter((provider) => isActionAllowed(ACTIONS.CREATE, provider.module))
      .map((provider) => ({ provider, label: t('admin.palette.createItem', { label: t(provider.labelKey) }) }))
      .filter((entry) => !trimmed || fuzzyScore(trimmed, entry.label) >= 0)
      .map(({ provider, label }) => ({
        id: `create:${provider.key}`,
        label,
        subtitle: t('admin.palette.groups.create'),
        icon: Plus,
        run: () => runNavigate(provider.key)
      }));
    if (createCommands.length > 0) {
      result.push({ id: 'create', title: t('admin.palette.groups.create'), commands: createCommands });
    }

    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery, providers, providerData, recent, language, t, canViewTab, isActionAllowed]);

  const flatCommands = useMemo(() => groups.flatMap((group) => group.commands), [groups]);

  useEffect(() => {
    const node = listRef.current?.querySelector(`[data-index="${selectedIndex}"]`);
    if (node) node.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  if (!open) return null;

  const handleKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setSelectedIndex((value) => (flatCommands.length ? (value + 1) % flatCommands.length : 0));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setSelectedIndex((value) => (flatCommands.length ? (value - 1 + flatCommands.length) % flatCommands.length : 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      flatCommands[selectedIndex]?.run();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
    }
  };

  let flatIndex = -1;

  return (
    <div className={styles.overlay} onMouseDown={onClose} role="presentation">
      <div
        className={styles.palette}
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={t('admin.palette.ariaLabel')}
      >
        <div className={styles.searchRow}>
          <Search size={18} className={styles.searchIcon} />
          <input
            ref={inputRef}
            className={styles.input}
            placeholder={t('admin.palette.placeholder')}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleKeyDown}
            aria-label={t('admin.palette.placeholder')}
          />
          <kbd className={styles.kbd}>Esc</kbd>
        </div>

        <div className={styles.results} ref={listRef}>
          {flatCommands.length === 0 ? (
            <div className={styles.empty}>{t('admin.palette.empty')}</div>
          ) : (
            groups.map((group) => (
              <div key={group.id} className={styles.group}>
                <div className={styles.groupTitle}>{group.title}</div>
                {group.commands.map((command) => {
                  flatIndex += 1;
                  const index = flatIndex;
                  const Icon = command.icon;
                  const active = index === selectedIndex;
                  return (
                    <button
                      key={command.id}
                      type="button"
                      data-index={index}
                      className={`${styles.item} ${active ? styles['item--active'] : ''}`}
                      onMouseMove={() => setSelectedIndex(index)}
                      onClick={() => command.run()}
                    >
                      {Icon && <Icon size={16} className={styles.itemIcon} />}
                      <span className={styles.itemLabel}>
                        <HighlightText text={command.label} query={query} />
                      </span>
                      {command.subtitle && <span className={styles.itemSubtitle}>{command.subtitle}</span>}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        <div className={styles.footer}>
          <span><ArrowUp size={12} /><ArrowDown size={12} /> {t('admin.palette.hintNavigate')}</span>
          <span><CornerDownLeft size={12} /> {t('admin.palette.hintSelect')}</span>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
