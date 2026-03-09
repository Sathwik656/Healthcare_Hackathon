const pool = require('../config/db');

// Symptom → specialty keyword mapping
// In production replace this with an ML model / external AI API call
const SYMPTOM_MAP = [
  { keywords: ['chest pain','palpitation','heart','shortness of breath','hypertension','blood pressure'], specialty: 'Cardiology' },
  { keywords: ['rash','acne','eczema','skin','itching','psoriasis','hair loss','nail'], specialty: 'Dermatology' },
  { keywords: ['child','infant','baby','fever in child','pediatric','growth'], specialty: 'Pediatrics' },
  { keywords: ['headache','migraine','seizure','numbness','tremor','memory loss','dizziness','stroke'], specialty: 'Neurology' },
  { keywords: ['bone','joint','fracture','back pain','knee','shoulder','arthritis'], specialty: 'Orthopedics' },
  { keywords: ['anxiety','depression','insomnia','mood','mental','panic','stress'], specialty: 'Psychiatry' },
  { keywords: ['lump','tumour','cancer','biopsy','chemo'], specialty: 'Oncology' },
  { keywords: ['period','pregnancy','ovary','uterus','menstrual','vaginal','pcos'], specialty: 'Gynecology' },
  { keywords: ['urination','kidney','bladder','prostate','urine','testicular'], specialty: 'Urology' },
];

/**
 * Match symptoms text to the best specialty.
 */
function matchSpecialty(symptoms) {
  const lower = symptoms.toLowerCase();
  let best = { specialty: 'General Practice', score: 0 };

  for (const entry of SYMPTOM_MAP) {
    const score = entry.keywords.filter(kw => lower.includes(kw)).length;
    if (score > best.score) {
      best = { specialty: entry.specialty, score };
    }
  }

  return best.specialty;
}

/**
 * Generate recommendation for a patient based on symptom text.
 * Stores result in ai_recommendations table and returns it.
 */
async function recommend(patientId, symptoms) {
  const specialtyName = matchSpecialty(symptoms);

  // Fetch specialty id
  const specRes = await pool.query(
    `SELECT specialty_id FROM specialties WHERE specialty_name = $1`,
    [specialtyName]
  );
  const specialty = specRes.rows[0];
  if (!specialty) throw new Error(`Specialty not found: ${specialtyName}`);

  // Find best-rated active doctor in that specialty
  const doctorRes = await pool.query(
    `SELECT u.user_id, u.name, dp.experience_years, dp.specialty_id
     FROM   doctor_profiles dp
     JOIN   users u ON u.user_id = dp.doctor_id
     WHERE  dp.specialty_id = $1 AND dp.status = 'active'
     ORDER  BY dp.experience_years DESC
     LIMIT  1`,
    [specialty.specialty_id]
  );
  const doctor = doctorRes.rows[0] || null;

  // Confidence: simple scoring — 0.50 base + 0.05 per matched keyword (max 1.0)
  const lower = symptoms.toLowerCase();
  const entry  = SYMPTOM_MAP.find(e => e.specialty === specialtyName);
  const matched = entry ? entry.keywords.filter(kw => lower.includes(kw)).length : 0;
  const confidence = Math.min(1.0, 0.50 + matched * 0.05).toFixed(2);

  // Persist
  const { rows } = await pool.query(
    `INSERT INTO ai_recommendations
       (patient_id, recommended_specialty_id, recommended_doctor_id, symptoms_input, confidence_score)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [
      patientId,
      specialty.specialty_id,
      doctor?.user_id || null,
      symptoms,
      confidence,
    ]
  );

  return {
    recommendation: rows[0],
    specialty: { id: specialty.specialty_id, name: specialtyName },
    doctor:    doctor ? { id: doctor.user_id, name: doctor.name, experience_years: doctor.experience_years } : null,
    confidence_score: confidence,
  };
}

module.exports = { recommend };
