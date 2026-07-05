import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Layers, Database, Code, Globe, Shield, Terminal } from 'lucide-react';
import BaseService from '../../../../services/BaseService';
import { Spinner } from '@/shared/components/ui';
import AnalyticsChart from './AnalyticsChart';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '../../../../firebase';

const increment = (map, key, fallback) => {
    const normalized = key || fallback;
    map[normalized] = (map[normalized] || 0) + 1;
};

const toSortedData = (map, limit) => Object.entries(map)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit || 999)
    .map(([name, value]) => ({ name, value }));

// Simple heuristic to categorize tech stack (in a real app, this could be driven by a dictionary/ontology)
const categorizeTech = (tech) => {
    const t = tech.toLowerCase();
    if (['react', 'vue', 'angular', 'next.js', 'svelte', 'tailwind', 'css', 'html'].some(k => t.includes(k))) return 'Frontend';
    if (['node', 'express', 'django', 'flask', 'spring', 'go', 'python', 'java', 'c#'].some(k => t.includes(k))) return 'Backend';
    if (['sql', 'mongo', 'postgres', 'firebase', 'redis', 'dynamodb'].some(k => t.includes(k))) return 'Database';
    if (['aws', 'gcp', 'azure', 'docker', 'kubernetes', 'vercel', 'netlify'].some(k => t.includes(k))) return 'Cloud/DevOps';
    if (['iam', 'oauth', 'jwt', 'security', 'iso', 'soc', 'audit'].some(k => t.includes(k))) return 'Security';
    return 'Other';
};

const AnalyticsTechPanel = () => {
    // Note: Tech Insights generally don't depend on the date range, as they aggregate the current portfolio state.
    const {
        data: projects = [],
        isLoading
    } = useQuery({
        queryKey: ['analyticsTechInsights'],
        queryFn: async () => {
            const q = query(collection(db, 'projects'));
            const res = await BaseService.safe(() => getDocs(q));
            if (res.error) return [];
            return res.data.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        },
        staleTime: 300000, // 5 minutes
        refetchOnWindowFocus: false
    });

    const summary = useMemo(() => {
        const techMap = {};
        const categoryMap = {};
        
        projects.forEach(project => {
            const stack = Array.isArray(project.techStack) ? project.techStack : 
                         (typeof project.techStack === 'string' ? project.techStack.split(',').map(s => s.trim()) : []);
            
            stack.forEach(tech => {
                if (!tech) return;
                const normalizedTech = tech.trim().charAt(0).toUpperCase() + tech.trim().slice(1);
                increment(techMap, normalizedTech);
                
                const category = categorizeTech(tech);
                increment(categoryMap, category);
            });
        });

        return {
            totalProjects: projects.length,
            topTech: toSortedData(techMap, 15),
            categories: toSortedData(categoryMap)
        };
    }, [projects]);

    if (isLoading) return <div className="flex justify-center py-8"><Spinner /></div>;

    return (
        <div className="analytics-panel fade-in">
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: 600 }}>Technology Insights</h3>

            <div className="admin-analytics-grid" style={{ marginBottom: '2rem' }}>
                <div className="admin-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ padding: '1rem', background: 'rgba(100, 255, 218, 0.1)', borderRadius: '12px', color: 'var(--primary-color)' }}>
                        <Terminal size={32} />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Projects Analyzed</div>
                        <div style={{ fontSize: '2rem', fontWeight: 700 }}>{summary.totalProjects}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Portfolio coverage</div>
                    </div>
                </div>
            </div>

            <div className="admin-analytics-grid" style={{ marginBottom: '2rem' }}>
                <AnalyticsChart
                    type="bar"
                    title="Most Used Technologies"
                    data={summary.topTech}
                    xKey="name"
                    yKey="value"
                    icon={Code}
                    height={400}
                    style={{ gridColumn: '1 / -1' }}
                />
            </div>

            <div className="admin-analytics-grid">
                <AnalyticsChart
                    type="pie"
                    title="Technology Categories"
                    data={summary.categories}
                    xKey="name"
                    yKey="value"
                    icon={Layers}
                    style={{ gridColumn: '1 / -1' }}
                />
            </div>
        </div>
    );
};

export default AnalyticsTechPanel;
