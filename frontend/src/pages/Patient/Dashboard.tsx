import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, Clock, User, ArrowRight, Bell, Star, Loader2, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import AIAssistant from '../../components/AIAssistant/AIAssistant';
import api from '@/src/services/api';

interface Appointment {
  appointment_id: string;
  doctor_name: string;
  doctor_id: string;
  specialty_name: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
}

interface Notification {
  notification_id: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

interface Review {
  review_id: string;
  rating: number;
  comment: string;
  created_at: string;
  doctor_name: string;
  specialty_name: string;
}

// ── Review modal ──────────────────────────────────────────────────────────────
interface ReviewModalProps {
  doctorId: string;
  doctorName: string;
  onClose: () => void;
  onSubmitted: () => void;
}

const StarRating = ({ rating, onRate }: { rating: number; onRate?: (r: number) => void }) => (
  <div className="flex items-center gap-1">
    {[1, 2, 3, 4, 5].map(i => (
      <Star
        key={i}
        onClick={() => onRate?.(i)}
        className={`w-5 h-5 transition-colors ${onRate ? 'cursor-pointer' : ''} ${
          i <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'
        }`}
      />
    ))}
  </div>
);

const ReviewModal = ({ doctorId, doctorName, onClose, onSubmitted }: ReviewModalProps) => {
  const [rating, setRating]   = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const handleSubmit = async () => {
    if (rating === 0) { setError('Please select a rating.'); return; }
    setLoading(true);
    setError('');
    try {
      await api.post('/reviews', { doctor_id: doctorId, rating, comment });
      onSubmitted();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit review.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Rate your experience</h3>
          <p className="text-sm text-slate-500 mt-1">with <span className="font-medium text-slate-700">{doctorName}</span></p>
        </div>

        <div className="flex flex-col items-center gap-2 py-4">
          <StarRating rating={rating} onRate={setRating} />
          <p className="text-xs text-slate-400">
            {rating === 0 ? 'Tap to rate' : ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating]}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Comment (optional)</label>
          <textarea
            rows={3}
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Share your experience..."
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
        )}

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || rating === 0}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'Submit Review'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main dashboard ────────────────────────────────────────────────────────────
const PatientDashboard = () => {
  const { t }    = useTranslation();
  const { user } = useAuthStore();

  const [appointments, setAppointments]       = useState<Appointment[]>([]);
  const [notifications, setNotifications]     = useState<Notification[]>([]);
  const [reviews, setReviews]                 = useState<Review[]>([]);
  const [completedApts, setCompletedApts]     = useState<Appointment[]>([]);
  const [loadingApts, setLoadingApts]         = useState(true);
  const [loadingRevs, setLoadingRevs]         = useState(true);
  const [reviewModal, setReviewModal]         = useState<{ doctorId: string; doctorName: string } | null>(null);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const formatTime = (t: string) => {
    const [h, m] = t.replace(/\..*/, '').split(':').map(Number);
    return `${(h % 12) || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
  };

  const initials = (name: string) =>
    name?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || '?';

  const fetchData = async () => {
    try {
      const [aptsRes, notifRes, completedRes] = await Promise.all([
        api.get('/appointments/patient?status=accepted&limit=3'),
        api.get('/notifications?limit=5'),
        api.get('/appointments/patient?status=completed'),
      ]);
      setAppointments(aptsRes.data.data.appointments || []);
      setNotifications(notifRes.data.data.notifications || []);
      setCompletedApts(completedRes.data.data.appointments || []);
    } catch {}
    finally { setLoadingApts(false); }
  };

  const fetchReviews = async () => {
    if (!user?.id) return;
    try {
      // Get all reviews this patient has written by checking each completed apt's doctor
      const res = await api.get('/appointments/patient?status=completed');
      const completed: Appointment[] = res.data.data.appointments || [];
      // Fetch reviews for each unique doctor
      const uniqueDoctorIds = [...new Set(completed.map(a => a.doctor_id))];
      // We store patient reviews in a different way — use a dedicated endpoint if available
      // For now fetch from the appointments list and cross reference
      setCompletedApts(completed);
    } catch {}
    finally { setLoadingRevs(false); }
  };

  useEffect(() => {
    fetchData();
    fetchReviews();
  }, [user?.id]);

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">{t('dashboard')}</h1>
        <Link
          to="/patient/book"
          className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors shadow-sm flex items-center"
        >
          <Calendar className="w-4 h-4 mr-2" />
          {t('book_appointment')}
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left column ── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Upcoming Appointments */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-green-600" />
                Upcoming Appointments
              </h2>
              <Link to="/patient/appointments" className="text-sm text-green-600 hover:text-green-700 font-medium flex items-center">
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>

            {loadingApts ? (
              <div className="flex items-center justify-center py-10 gap-2 text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Loading...</span>
              </div>
            ) : appointments.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-sm text-slate-500">No upcoming appointments.</p>
                <Link to="/patient/book" className="text-sm text-green-600 font-medium mt-1 inline-block">Book one now →</Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {appointments.map(apt => (
                  <div key={apt.appointment_id} className="p-5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="h-11 w-11 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-sm">
                        {initials(apt.doctor_name)}
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900">{apt.doctor_name}</h3>
                        <p className="text-xs text-slate-500">{apt.specialty_name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center text-sm text-slate-700 font-medium justify-end">
                        <Calendar className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                        {formatDate(apt.appointment_date)}
                      </div>
                      <div className="flex items-center text-sm text-slate-500 mt-0.5 justify-end">
                        <Clock className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                        {formatTime(apt.appointment_time)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* My Reviews */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center">
                <Star className="w-5 h-5 mr-2 text-amber-400 fill-amber-400" />
                Leave a Review
              </h2>
            </div>

            {loadingRevs ? (
              <div className="flex items-center justify-center py-10 gap-2 text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Loading...</span>
              </div>
            ) : completedApts.length === 0 ? (
              <div className="text-center py-10">
                <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-3">
                  <MessageSquare className="h-6 w-6 text-amber-400" />
                </div>
                <p className="text-sm text-slate-500">No completed appointments to review yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {completedApts.map(apt => (
                  <div key={apt.appointment_id} className="p-5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="h-11 w-11 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm">
                        {initials(apt.doctor_name)}
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900">{apt.doctor_name}</h3>
                        <p className="text-xs text-slate-500">{apt.specialty_name} · {formatDate(apt.appointment_date)}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setReviewModal({ doctorId: (apt as any).doctor_id, doctorName: apt.doctor_name })}
                      className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg text-white bg-amber-500 hover:bg-amber-600 transition-colors"
                    >
                      <Star className="w-3.5 h-3.5 mr-1" />
                      Rate
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Right column ── */}
        <div className="space-y-6">
          <AIAssistant />

          {/* Notifications */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center">
                <Bell className="w-5 h-5 mr-2 text-green-600" />
                Notifications
              </h2>
              {notifications.filter(n => !n.is_read).length > 0 && (
                <span className="text-xs font-medium bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                  {notifications.filter(n => !n.is_read).length} new
                </span>
              )}
            </div>
            <div className="divide-y divide-slate-100">
              {notifications.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">No notifications yet.</p>
              ) : notifications.map(n => (
                <div key={n.notification_id} className={`p-4 hover:bg-slate-50 transition-colors ${!n.is_read ? 'bg-green-50/40' : ''}`}>
                  {!n.is_read && <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2 mb-0.5" />}
                  <p className="text-sm text-slate-800">{n.message}</p>
                  <span className="text-xs text-slate-400 mt-1 block">{timeAgo(n.created_at)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Review modal */}
      {reviewModal && (
        <ReviewModal
          doctorId={reviewModal.doctorId}
          doctorName={reviewModal.doctorName}
          onClose={() => setReviewModal(null)}
          onSubmitted={fetchData}
        />
      )}
    </div>
  );
};

export default PatientDashboard;