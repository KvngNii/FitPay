'use client'

export type MedicalHistoryFormState = {
  heart_condition_or_bp: boolean
  chest_pain: boolean
  dizziness_or_consciousness: boolean
  chronic_condition: boolean
  chronic_condition_details: string
  prescribed_medication: boolean
  medication_details: string
  bone_or_joint_problem: boolean
  bone_or_joint_details: string
  previous_injuries_surgeries: string
  current_pain_areas: string
  allergies: string
  additional_notes: string
  consent_acknowledged: boolean
}

export const EMPTY_MEDICAL_HISTORY: MedicalHistoryFormState = {
  heart_condition_or_bp: false,
  chest_pain: false,
  dizziness_or_consciousness: false,
  chronic_condition: false,
  chronic_condition_details: '',
  prescribed_medication: false,
  medication_details: '',
  bone_or_joint_problem: false,
  bone_or_joint_details: '',
  previous_injuries_surgeries: '',
  current_pain_areas: '',
  allergies: '',
  additional_notes: '',
  consent_acknowledged: false,
}

export const CONSENT_TEXT =
  "I, the undersigned, have read, understood to my full satisfaction and completed this questionnaire. " +
  "I acknowledge that this physical activity clearance is valid for a maximum of 12 months from the date " +
  "it is completed and becomes invalid if my condition changes. I also acknowledge that the community/fitness " +
  "center may retain a copy of this form for its records. In these instances, it will maintain the " +
  "confidentiality of the same."

function YesNoQuestion({
  question,
  value,
  onChange,
}: {
  question: string
  value: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div>
      <p className="text-sm text-slate-200 mb-2">{question}</p>
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'No', val: false },
          { label: 'Yes', val: true },
        ].map(({ label, val }) => (
          <button
            key={label}
            type="button"
            onClick={() => onChange(val)}
            className={`py-2.5 rounded-lg border font-medium transition-colors ${
              value === val
                ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                : 'border-slate-700 bg-slate-800 text-slate-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}

export function MedicalHistoryFields({
  value,
  onChange,
  consentLocked = false,
}: {
  value: MedicalHistoryFormState
  onChange: (v: MedicalHistoryFormState) => void
  // When true, the physical activity clearance has already been signed and
  // cannot be un-signed (checkbox is locked checked).
  consentLocked?: boolean
}) {
  function set<K extends keyof MedicalHistoryFormState>(key: K, val: MedicalHistoryFormState[K]) {
    onChange({ ...value, [key]: val })
  }

  return (
    <div className="space-y-5">
      <YesNoQuestion
        question="Has a doctor ever told you that you have a heart condition or high blood pressure?"
        value={value.heart_condition_or_bp}
        onChange={(v) => set('heart_condition_or_bp', v)}
      />

      <YesNoQuestion
        question="Do you currently experience chest pain, either at rest or during physical activity?"
        value={value.chest_pain}
        onChange={(v) => set('chest_pain', v)}
      />

      <YesNoQuestion
        question="Have you experienced dizziness, loss of balance, or loss of consciousness in the past 12 months?"
        value={value.dizziness_or_consciousness}
        onChange={(v) => set('dizziness_or_consciousness', v)}
      />

      <div>
        <YesNoQuestion
          question="Have you been diagnosed with a chronic medical condition (e.g. diabetes, asthma, epilepsy)?"
          value={value.chronic_condition}
          onChange={(v) => set('chronic_condition', v)}
        />
        {value.chronic_condition && (
          <textarea
            className="mt-2"
            placeholder="Please describe the condition"
            value={value.chronic_condition_details}
            onChange={(e) => set('chronic_condition_details', e.target.value)}
            rows={2}
            required
          />
        )}
      </div>

      <div>
        <YesNoQuestion
          question="Are you currently taking prescribed medication for a medical condition?"
          value={value.prescribed_medication}
          onChange={(v) => set('prescribed_medication', v)}
        />
        {value.prescribed_medication && (
          <textarea
            className="mt-2"
            placeholder="Please list the medication(s) and what they're for"
            value={value.medication_details}
            onChange={(e) => set('medication_details', e.target.value)}
            rows={2}
            required
          />
        )}
      </div>

      <div>
        <YesNoQuestion
          question="Do you have a bone, joint, or muscle problem that could be made worse by exercise?"
          value={value.bone_or_joint_problem}
          onChange={(v) => set('bone_or_joint_problem', v)}
        />
        {value.bone_or_joint_problem && (
          <textarea
            className="mt-2"
            placeholder="Please describe the problem and the affected area"
            value={value.bone_or_joint_details}
            onChange={(e) => set('bone_or_joint_details', e.target.value)}
            rows={2}
            required
          />
        )}
      </div>

      <div className="pt-2 border-t border-slate-800">
        <p className="text-sm font-semibold text-slate-300 mt-3 mb-1">Injury history</p>
      </div>

      <div>
        <label htmlFor="previous_injuries">Previous injuries or surgeries</label>
        <textarea
          id="previous_injuries"
          placeholder="e.g., None — or describe past injuries/surgeries, when they happened, and recovery status"
          value={value.previous_injuries_surgeries}
          onChange={(e) => set('previous_injuries_surgeries', e.target.value)}
          rows={3}
          required
        />
      </div>

      <div>
        <label htmlFor="current_pain">Any current pain or areas to be careful with?</label>
        <textarea
          id="current_pain"
          placeholder="e.g., None — or describe current pain/discomfort and where"
          value={value.current_pain_areas}
          onChange={(e) => set('current_pain_areas', e.target.value)}
          rows={2}
          required
        />
      </div>

      <div>
        <label htmlFor="allergies">Allergies</label>
        <textarea
          id="allergies"
          placeholder="e.g., None"
          value={value.allergies}
          onChange={(e) => set('allergies', e.target.value)}
          rows={2}
          required
        />
      </div>

      <div>
        <label htmlFor="additional_notes">Anything else your trainer should know? (optional)</label>
        <textarea
          id="additional_notes"
          placeholder="Optional"
          value={value.additional_notes}
          onChange={(e) => set('additional_notes', e.target.value)}
          rows={2}
        />
      </div>

      <div className="pt-2 border-t border-slate-800">
        <label className={`flex items-start gap-3 pt-3 ${consentLocked ? 'cursor-default' : 'cursor-pointer'}`}>
          <input
            type="checkbox"
            checked={consentLocked ? true : value.consent_acknowledged}
            onChange={(e) => { if (!consentLocked) set('consent_acknowledged', e.target.checked) }}
            required
            disabled={consentLocked}
            aria-readonly={consentLocked}
            className="w-4 h-4 mt-0.5 rounded accent-emerald-500 shrink-0 disabled:opacity-100"
          />
          <span className="text-xs text-slate-400 leading-relaxed">{CONSENT_TEXT}</span>
        </label>
        {consentLocked && (
          <p className="text-xs text-emerald-400/80 mt-2 pl-7">
            Signed. Your physical activity clearance stays on file and cannot be un-signed.
          </p>
        )}
      </div>
    </div>
  )
}
