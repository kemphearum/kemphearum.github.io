import React from 'react';
import { BarChart2, FileText, Code, Mail, Users } from 'lucide-react';
import UsageBar from '../../components/UsageBar';
import StatCard from '../../components/StatCard';
import DatabaseService from '../../../../services/DatabaseService';

const DatabaseStats = ({ dbHealth, loading, totalDocs, setActiveTab }) => {
  return (
    <div className={"ui-stats-section"}>
      <h4 className={"ui-header"}>
        <BarChart2 size={18} /> Storage Health
        <span className={"ui-last-updated"}>
          {dbHealth.lastUpdated ? `Last checked: ${dbHealth.lastUpdated.toLocaleTimeString()}` : 'Counting...'}
        </span>
      </h4>

      <UsageBar
        label="Free Tier Document Usage (50k Limit Estimate)"
        current={totalDocs}
        total={DatabaseService.SOFT_DOC_LIMIT}
        className="ui-database-usage"
      />

      <div className={"ui-stats-grid"}>
        <StatCard
          icon={FileText}
          value={loading ? '...' : (dbHealth.posts || 0)}
          label="Posts"
          color="#38bdf8"
          onClick={() => setActiveTab('blog')}
          description="View & Edit Content"
          className={"ui-db-stat-card"}
          style={{ '--stat-color': '#38bdf8' }}
        />
        <StatCard
          icon={Code}
          value={loading ? '...' : (dbHealth.projects || 0)}
          label="Projects"
          color="#a78bfa"
          onClick={() => setActiveTab('projects')}
          description="Project Portfolio"
          className={"ui-db-stat-card"}
          style={{ '--stat-color': '#a78bfa' }}
        />
        <StatCard
          icon={FileText}
          value={loading ? '...' : (dbHealth.experience || 0)}
          label="Experience"
          color="#f472b6"
          onClick={() => setActiveTab('experience')}
          description="Professional History"
          className={"ui-db-stat-card"}
          style={{ '--stat-color': '#f472b6' }}
        />
        <StatCard
          icon={FileText}
          value={loading ? '...' : (dbHealth.content || 0)}
          label="Content"
          color="#2dd4bf"
          onClick={() => setActiveTab('general')}
          description="General Site Info"
          className={"ui-db-stat-card"}
          style={{ '--stat-color': '#2dd4bf' }}
        />
        <StatCard
          icon={Mail}
          value={loading ? '...' : (dbHealth.messages || 0)}
          label="Messages"
          color="#34d399"
          onClick={() => setActiveTab('messages')}
          description="User Inquiries"
          className={"ui-db-stat-card"}
          style={{ '--stat-color': '#34d399' }}
        />
        <StatCard
          icon={Users}
          value={loading ? '...' : (dbHealth.users || 0)}
          label="Users"
          color="#fb923c"
          onClick={() => setActiveTab('users')}
          description="Admin Access"
          className={"ui-db-stat-card"}
          style={{ '--stat-color': '#fb923c' }}
        />
      </div>
    </div>
  );
};

export default DatabaseStats;
