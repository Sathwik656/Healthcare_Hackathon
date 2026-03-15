import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, UserCheck, UserX, Activity } from 'lucide-react';
import api from '@/src/services/api';

interface DashboardStats {
  total_doctors: number;
  active_doctors: number;
  suspended_doctors: number;
  total_patients: number;
}

const AdminDashboard = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get('/admin/dashboard');
        setStats(data.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load dashboard stats.');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = stats
    ? [
        { name: t('total_doctors'),     value: stats.total_doctors.toLocaleString(),     icon: Users,     color: 'text-green-600',   bg: 'bg-green-100'   },
        { name: t('active_doctors'),    value: stats.active_doctors.toLocaleString(),    icon: UserCheck, color: 'text-green-600',   bg: 'bg-green-100'   },
        { name: t('suspended_doctors'), value: stats.suspended_doctors.toLocaleString(), icon: UserX,     color: 'text-red-600',     bg: 'bg-red-100'     },
        { name: t('total_patients'),    value: stats.total_patients.toLocaleString(),    icon: Activity,  color: 'text-emerald-600', bg: 'bg-emerald-100' },
      ]
    : [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">{t('dashboard')}</h1>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white overflow-hidden rounded-2xl shadow-sm border border-slate-200 p-5">
                <div className="flex items-center gap-4 animate-pulse">
                  <div className="h-12 w-12 rounded-xl bg-slate-100" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-24 rounded bg-slate-100" />
                    <div className="h-6 w-16 rounded bg-slate-100" />
                  </div>
                </div>
              </div>
            ))
          : statCards.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.name} className="bg-white overflow-hidden rounded-2xl shadow-sm border border-slate-200">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${item.bg}`}>
                          <Icon className={`h-6 w-6 ${item.color}`} aria-hidden="true" />
                        </div>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-slate-500 truncate">{item.name}</dt>
                          <dd>
                            <div className="text-2xl font-bold text-slate-900">{item.value}</div>
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 bg-slate-50">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center">
            <Activity className="w-5 h-5 mr-2 text-green-600" />
            System Activity
          </h2>
        </div>
        <div className="p-6">
          <div className="h-64 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
            <p className="text-slate-500 font-medium">Activity Chart Placeholder</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;