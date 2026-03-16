import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/useAuthStore';
import { User, Mail, Stethoscope, Clock, Edit3, Star, Loader2, MessageSquare, Building2 } from 'lucide-react';
import api from '@/src/services/api';

interface Review {
  review_id: string;
  rating: number;
  comment: string;
  created_at: string;
  patient_name: string;
}

interface ReviewStats {
  avg_rating: string;
  total: string;
}

interface DoctorProfileData {
  specialty_name: string;
  health_center_name: string;
  experience_years: number;
  bio: string;
  avg_rating: string;
  review_count: string;
}

const StarRating = ({ rating }: { rating: number }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map(i => (
      <Star
        key={i}
        className={`w-4 h-4 ${i <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'}`}
      />
    ))}
  </div>
);

const DoctorProfile = () => {
  const { t }    = useTranslation();
  const { user } = useAuthStore();

  const [profile, setProfile]   = useState<DoctorProfileData | null>(null);
  const [reviews, setReviews]   = useState<Review[]>([]);
  const [stats, setStats]       = useState<ReviewStats | null>(null);
  const [loading, setLoading]   = useState(true);
  const [revLoading, setRevLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    // Fetch doctor profile
    api.get(`/doctors/${user.id}`)
      .then(res => setProfile(res.data.data.doctor))
      .catch(() => {})
      .finally(() => setLoading(false));

    // Fetch reviews
    api.get(`/reviews/doctor/${user.id}`)
      .then(res => {
        setReviews(res.data.data.reviews || []);
        setStats(res.data.data.stats);
      })
      .catch(() => {})
      .finally(() => setRevLoading(false));
  }, [user?.id]);

  const initials = (name: string) =>
    name?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || 'DR';

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">{t('profile')}</h1>
        <button className="inline-flex items-center px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-50 transition-colors">
          <Edit3 className="w-4 h-4 mr-2 text-slate-400" />
          Edit Profile
        </button>
      </div>

      {/* Profile card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-8">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="h-24 w-24 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-3xl border-4 border-white shadow-lg">
              {initials(user?.name || '')}
            </div>
            <div className="text-center sm:text-left">
              <h2 className="text-2xl font-bold text-slate-900">{user?.name || 'Doctor'}</h2>
              <p className="text-slate-500 font-medium capitalize">{profile?.specialty_name || '—'}</p>
              {stats && parseFloat(stats.avg_rating) > 0 && (
                <div className="flex items-center gap-2 mt-2">
                  <StarRating rating={Math.round(parseFloat(stats.avg_rating))} />
                  <span className="text-sm font-semibold text-slate-700">{stats.avg_rating}</span>
                  <span className="text-sm text-slate-400">({stats.total} reviews)</span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center">
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center mr-4">
                <User className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium">Full Name</p>
                <p className="text-slate-900 font-semibold">{user?.name || '—'}</p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center">
              <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center mr-4">
                <Mail className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium">Email Address</p>
                <p className="text-slate-900 font-semibold">{user?.email || '—'}</p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center">
              <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center mr-4">
                <Stethoscope className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium">Specialty</p>
                <p className="text-slate-900 font-semibold">
                  {loading ? '...' : profile?.specialty_name || '—'}
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mr-4">
                <Building2 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium">Health Center</p>
                <p className="text-slate-900 font-semibold">
                  {loading ? '...' : profile?.health_center_name || '—'}
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center">
              <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center mr-4">
                <Clock className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium">Experience</p>
                <p className="text-slate-900 font-semibold">
                  {loading ? '...' : profile?.experience_years ? `${profile.experience_years} years` : '—'}
                </p>
              </div>
            </div>

            {profile?.bio && (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-start md:col-span-2">
                <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center mr-4 flex-shrink-0">
                  <MessageSquare className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 font-medium">Bio</p>
                  <p className="text-slate-900 text-sm leading-relaxed">{profile.bio}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reviews section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
            Patient Reviews
          </h2>
          {stats && (
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-slate-900">{stats.avg_rating || '—'}</span>
              <div>
                <StarRating rating={Math.round(parseFloat(stats.avg_rating || '0'))} />
                <p className="text-xs text-slate-400 mt-0.5">{stats.total} total reviews</p>
              </div>
            </div>
          )}
        </div>

        {revLoading ? (
          <div className="flex items-center justify-center py-12 gap-2 text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Loading reviews...</span>
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12">
            <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-3">
              <Star className="h-6 w-6 text-amber-400" />
            </div>
            <p className="text-sm font-medium text-slate-700">No reviews yet</p>
            <p className="text-xs text-slate-400 mt-1">Reviews from patients will appear here after completed appointments.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {reviews.map(review => (
              <div key={review.review_id} className="p-6 hover:bg-slate-50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm flex-shrink-0">
                      {review.patient_name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{review.patient_name}</p>
                      <StarRating rating={review.rating} />
                      {review.comment && (
                        <p className="text-sm text-slate-600 mt-2 leading-relaxed">{review.comment}</p>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 whitespace-nowrap">
                    {new Date(review.created_at).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorProfile;