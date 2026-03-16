import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle, XCircle, Calendar, Clock, User, Loader2, AlertCircle, Flag } from 'lucide-react';
import api from '@/src/services/api';

interface Appointment {
  appointment_id: string;
  patient_id: string;
  patient_name: string;
  appointment_date: string;
  appointment_time: string;
  duration_minutes: number;
  reason: string | null;
  status: string;
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  });

const formatTime = (t: string) => {
  const [h, m] = t.replace(/\..*/, '').split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${(h % 12) || 12}:${String(m).padStart(2, '0')} ${ampm}`;
};

const initials = (name: string) =>
  name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

type ActionType = 'accepting' | 'declining' | 'completing' | null;

const DoctorRequests = () => {
  const { t } = useTranslation();
  const [tab, setTab]                   = useState<'pending' | 'accepted'>('pending');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');
  const [acting, setActing]             = useState<Record<string, ActionType>>({});

  const fetchAppointments = useCallback(async (status: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/appointments/doctor?status=${status}`);
      setAppointments(res.data.data.appointments || []);
    } catch {
      setError('Failed to load appointments.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAppointments(tab); }, [tab, fetchAppointments]);

  const handleAccept = async (id: string) => {
    setActing(a => ({ ...a, [id]: 'accepting' }));
    try {
      await api.put(`/appointments/${id}/accept`);
      setAppointments(prev => prev.filter(a => a.appointment_id !== id));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to accept.');
    } finally {
      setActing(a => ({ ...a, [id]: null }));
    }
  };

  const handleDecline = async (id: string) => {
    setActing(a => ({ ...a, [id]: 'declining' }));
    try {
      await api.put(`/appointments/${id}/decline`);
      setAppointments(prev => prev.filter(a => a.appointment_id !== id));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to decline.');
    } finally {
      setActing(a => ({ ...a, [id]: null }));
    }
  };

  const handleComplete = async (id: string) => {
    setActing(a => ({ ...a, [id]: 'completing' }));
    try {
      await api.put(`/appointments/${id}/complete`);
      setAppointments(prev => prev.filter(a => a.appointment_id !== id));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to mark as complete.');
    } finally {
      setActing(a => ({ ...a, [id]: null }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">{t('appointments')}</h1>
        {appointments.length > 0 && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
            {appointments.length} {tab}
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        {(['pending', 'accepted'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors capitalize ${
              tab === t
                ? 'border-green-600 text-green-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {t === 'pending' ? 'Pending Requests' : 'Accepted — Mark Complete'}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">

        <div className="px-6 py-5 border-b border-slate-200 bg-slate-50">
          <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-500" />
            {tab === 'pending' ? 'Appointment Requests' : 'Accepted Appointments'}
          </h2>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-14 gap-3 text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Loading...</span>
          </div>
        )}

        {error && (
          <div className="m-6 flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
          </div>
        )}

        {!loading && !error && (
          <div className="divide-y divide-slate-100">
            {appointments.map(req => {
              const isActing = !!acting[req.appointment_id];
              return (
                <div key={req.appointment_id} className="p-6 hover:bg-slate-50 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">

                    {/* Patient info */}
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm flex-shrink-0">
                        {initials(req.patient_name)}
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-slate-900">{req.patient_name}</h3>
                        {req.reason
                          ? <p className="text-sm text-slate-500 mt-0.5 flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-slate-400" />{req.reason}</p>
                          : <p className="text-sm text-slate-400 mt-0.5 italic">No reason provided</p>
                        }
                        <p className="text-xs text-slate-400 mt-1">{req.duration_minutes} min session</p>
                      </div>
                    </div>

                    {/* Date/time + actions */}
                    <div className="flex flex-col md:items-end gap-3">
                      <div className="flex items-center gap-3 text-sm font-medium text-slate-700 bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4 text-green-500" />
                          {formatDate(req.appointment_date)}
                        </span>
                        <span className="w-px h-4 bg-slate-200 block" />
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-green-500" />
                          {formatTime(req.appointment_time)}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        {tab === 'pending' ? (
                          <>
                            <button
                              disabled={isActing}
                              onClick={() => handleAccept(req.appointment_id)}
                              className="inline-flex items-center px-4 py-1.5 text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 transition-colors shadow-sm"
                            >
                              {acting[req.appointment_id] === 'accepting'
                                ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Accepting...</>
                                : <><CheckCircle className="w-3.5 h-3.5 mr-1.5" />Accept</>}
                            </button>
                            <button
                              disabled={isActing}
                              onClick={() => handleDecline(req.appointment_id)}
                              className="inline-flex items-center px-4 py-1.5 text-sm font-medium rounded-lg border border-slate-300 text-slate-700 bg-white hover:bg-red-50 hover:text-red-600 hover:border-red-300 disabled:opacity-50 transition-colors shadow-sm"
                            >
                              {acting[req.appointment_id] === 'declining'
                                ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Declining...</>
                                : <><XCircle className="w-3.5 h-3.5 mr-1.5" />Decline</>}
                            </button>
                          </>
                        ) : (
                          <button
                            disabled={isActing}
                            onClick={() => handleComplete(req.appointment_id)}
                            className="inline-flex items-center px-4 py-1.5 text-sm font-medium rounded-lg text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-sm"
                          >
                            {acting[req.appointment_id] === 'completing'
                              ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Completing...</>
                              : <><Flag className="w-3.5 h-3.5 mr-1.5" />Mark as Complete</>}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {appointments.length === 0 && (
              <div className="text-center py-14">
                <div className="h-14 w-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-7 w-7 text-green-500" />
                </div>
                <p className="text-sm font-medium text-slate-800">All caught up!</p>
                <p className="text-xs text-slate-400 mt-1">
                  {tab === 'pending' ? 'No pending appointment requests.' : 'No accepted appointments to complete.'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorRequests;