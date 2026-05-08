'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter, useSearchParams } from 'next/navigation'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Copy,
  Download,
  FileText,
  Loader2,
  Plus,
  Save,
  Sparkles,
  Trash2,
  Wand2,
} from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'
import { getAuthToken } from '@/lib/auth'

type TemplateKey = 'classic' | 'sidebar' | 'modern' | 'executive' | 'minimal'

type LanguageItem = { name: string; level: string }
type EducationItem = { degree: string; institution: string; graduation_year: string; details?: string }
type ExperienceItem = {
  job_title: string
  company: string
  dates: string
  responsibilities: string
  achievements: string
  led_team: string
}
type CertificationItem = { name: string; year: string }

type ResumeData = {
  personal_info: {
    full_name: string
    target_title: string
    email: string
    phone: string
    location: string
    linkedin_url: string
    website: string
  }
  summary_inputs: {
    current_role: string
    years_experience: string
    specialization: string
    highlights: string[]
    target_role: string
    target_company_type: string
  }
  summary: string
  experience: ExperienceItem[]
  education: EducationItem[]
  skills: string[]
  certifications: CertificationItem[]
  languages: LanguageItem[]
}

type GeneratedResume = {
  id: string
  title: string
  status: string
  template_key?: TemplateKey | null
  resume_data: ResumeData
  quick_import_input?: string | null
  created_at: string
  updated_at?: string | null
}

type TemplateItem = {
  id: string
  key: TemplateKey
  label: string
  description?: string
  preview_meta?: Record<string, unknown>
}

const defaultResumeData: ResumeData = {
  personal_info: {
    full_name: '',
    target_title: '',
    email: '',
    phone: '',
    location: '',
    linkedin_url: '',
    website: '',
  },
  summary_inputs: {
    current_role: '',
    years_experience: '',
    specialization: '',
    highlights: [],
    target_role: '',
    target_company_type: '',
  },
  summary: '',
  experience: [
    {
      job_title: '',
      company: '',
      dates: '',
      responsibilities: '',
      achievements: '',
      led_team: '',
    },
  ],
  education: [{ degree: '', institution: '', graduation_year: '', details: '' }],
  skills: [],
  certifications: [{ name: '', year: '' }],
  languages: [{ name: '', level: 'Fluent' }],
}

const proficiencyLevels = ['Native', 'Fluent', 'Intermediate', 'Basic']

function emptyToDash(value: string) {
  return value?.trim() || '—'
}

function normalizeResumeData(data: Partial<ResumeData> | undefined): ResumeData {
  const source = data || {}
  const personal = source.personal_info || {}
  const summaryInputs = source.summary_inputs || {}
  return {
    personal_info: {
      full_name: personal.full_name || '',
      target_title: personal.target_title || '',
      email: personal.email || '',
      phone: personal.phone || '',
      location: personal.location || '',
      linkedin_url: personal.linkedin_url || '',
      website: personal.website || '',
    },
    summary_inputs: {
      current_role: summaryInputs.current_role || '',
      years_experience: summaryInputs.years_experience || '',
      specialization: summaryInputs.specialization || '',
      highlights: Array.isArray(summaryInputs.highlights) ? summaryInputs.highlights : [],
      target_role: summaryInputs.target_role || '',
      target_company_type: summaryInputs.target_company_type || '',
    },
    summary: source.summary || '',
    experience: Array.isArray(source.experience) && source.experience.length > 0
      ? source.experience.map((item) => ({
          job_title: item.job_title || '',
          company: item.company || '',
          dates: item.dates || '',
          responsibilities: item.responsibilities || '',
          achievements: item.achievements || '',
          led_team: item.led_team || '',
        }))
      : defaultResumeData.experience,
    education: Array.isArray(source.education) && source.education.length > 0
      ? source.education.map((item) => ({
          degree: item.degree || '',
          institution: item.institution || '',
          graduation_year: item.graduation_year || '',
          details: item.details || '',
        }))
      : defaultResumeData.education,
    skills: Array.isArray(source.skills) ? source.skills.slice(0, 10) : [],
    certifications: Array.isArray(source.certifications) && source.certifications.length > 0
      ? source.certifications.map((item) => ({ name: item.name || '', year: item.year || '' }))
      : defaultResumeData.certifications,
    languages: Array.isArray(source.languages) && source.languages.length > 0
      ? source.languages.map((item) => ({ name: item.name || '', level: item.level || 'Fluent' }))
      : defaultResumeData.languages,
  }
}

function parseQuickImportText(text: string): Partial<ResumeData> {
  const lines = text.split(/\n+/).map((line) => line.trim()).filter(Boolean)
  const parsed: Partial<ResumeData> = {
    personal_info: {},
    summary_inputs: {},
    skills: [],
    experience: [],
  }

  const emailMatch = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)
  if (emailMatch) parsed.personal_info!.email = emailMatch[0]

  const phoneMatch = text.match(/(\+?\d[\d\s().-]{7,}\d)/)
  if (phoneMatch) parsed.personal_info!.phone = phoneMatch[0]

  if (lines[0]) parsed.personal_info!.full_name = lines[0]
  if (lines[1] && lines[1].length < 70) parsed.personal_info!.target_title = lines[1]

  const skillsLine = lines.find((line) => /^skills?[:\-]/i.test(line))
  if (skillsLine) {
    const parts = skillsLine.replace(/^skills?[:\-]/i, '').split(',').map((s) => s.trim()).filter(Boolean)
    parsed.skills = parts.slice(0, 10)
  }

  return parsed
}

function getCompletionWarnings(data: ResumeData): string[] {
  const warnings: string[] = []
  if (!data.personal_info.full_name || !data.personal_info.email) {
    warnings.push('Adding full personal info improves recruiter trust and response rates.')
  }
  if (!data.summary.trim()) {
    warnings.push('Adding a professional summary improves match rate visibility.')
  }
  const hasStrongExperience = data.experience.some((job) => job.job_title && job.achievements)
  if (!hasStrongExperience) {
    warnings.push('Experience with measurable outcomes (%, revenue, time saved) improves ATS relevance.')
  }
  if (data.skills.length < 5) {
    warnings.push('Adding at least 5 focused skills can improve keyword matching.')
  }
  return warnings
}

function TemplateClassic({ data }: { data: ResumeData }) {
  const Section = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', borderBottom: '2px solid #1a1a1a', paddingBottom: 4, marginBottom: 8 }}>{label}</div>
      {children}
    </div>
  )
  
  return (
    <div style={{ fontFamily: 'Georgia, serif', color: '#1a1a1a', padding: '44px 48px', fontSize: 9.5, lineHeight: 1.6 }}>
      <div style={{ textAlign: 'center', borderBottom: '2px solid #1a1a1a', paddingBottom: 14, marginBottom: 20 }}>
        <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' }}>{emptyToDash(data.personal_info.full_name)}</div>
        <div style={{ fontSize: 10, letterSpacing: 3, color: '#555', marginTop: 3, textTransform: 'uppercase' }}>{emptyToDash(data.personal_info.target_title)}</div>
        <div style={{ fontSize: 8.5, color: '#777', marginTop: 7 }}>
          {emptyToDash(data.personal_info.email)} &nbsp;|&nbsp; {emptyToDash(data.personal_info.phone)} &nbsp;|&nbsp; {emptyToDash(data.personal_info.location)} &nbsp;|&nbsp; {emptyToDash(data.personal_info.website)}
        </div>
      </div>

      <Section label="Profile">
        <p style={{ color: '#444', lineHeight: 1.7, margin: 0 }}>{emptyToDash(data.summary)}</p>
      </Section>

      <Section label="Experience">
        {data.experience.map((job, idx) => (
          <div key={idx} style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span>
                <strong style={{ fontSize: 10 }}>{emptyToDash(job.job_title)}</strong>
                <span style={{ color: '#555' }}> — {emptyToDash(job.company)}</span>
              </span>
              <span style={{ color: '#888', fontSize: 8.5 }}>{emptyToDash(job.dates)}</span>
            </div>
            <ul style={{ margin: '3px 0 0 16px', color: '#444', fontSize: 9.5 }}>
              {job.responsibilities && <li style={{ marginBottom: 1 }}>{job.responsibilities}</li>}
              {job.achievements && <li style={{ marginBottom: 1 }}>{job.achievements}</li>}
            </ul>
          </div>
        ))}
      </Section>

      <Section label="Education">
        {data.education.map((item, idx) => (
          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <strong>{emptyToDash(item.degree)}</strong>
            <span style={{ color: '#666' }}>{emptyToDash(item.institution)}, {emptyToDash(item.graduation_year)}</span>
          </div>
        ))}
      </Section>

      <Section label="Skills">
        <div style={{ color: '#444' }}>{data.skills.length ? data.skills.join('   ·   ') : '—'}</div>
      </Section>
    </div>
  )
}

function TemplateSidebar({ data }: { data: ResumeData }) {
  const initials = (data.personal_info.full_name || 'NN').split(' ').map((n) => n[0]).join('').slice(0, 2)
  
  const SideBlock = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: '#9db4cc', marginBottom: 6 }}>{label}</div>
      {children}
    </div>
  )

  const MainSection = ({ label, accent = '#4a4e8a', children }: { label: string; accent?: string; children: React.ReactNode }) => (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 9.5, fontWeight: 700, color: accent, letterSpacing: 1, textTransform: 'uppercase', paddingBottom: 4, borderBottom: `1px solid ${accent}`, marginBottom: 8 }}>
        {label}
      </div>
      {children}
    </div>
  )

  return (
    <div style={{ display: 'flex', minHeight: '100%', fontFamily: "'Helvetica Neue', Arial, sans-serif" }}>
      <div style={{ width: 185, background: '#1a1a2e', color: '#fff', padding: '32px 18px', flexShrink: 0 }}>
        <div style={{ width: 62, height: 62, borderRadius: '50%', background: '#4a4e8a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, margin: '0 auto 12px' }}>
          {initials}
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, textAlign: 'center', marginBottom: 2 }}>{emptyToDash(data.personal_info.full_name)}</div>
        <div style={{ fontSize: 8, textAlign: 'center', color: '#9db4cc', marginBottom: 20, letterSpacing: 0.5, textTransform: 'uppercase' }}>{emptyToDash(data.personal_info.target_title)}</div>

        <SideBlock label="Contact">
          <div style={{ fontSize: 8.5, color: '#c8ccf0', lineHeight: 2 }}>
            <div>✉ {emptyToDash(data.personal_info.email)}</div>
            <div>✆ {emptyToDash(data.personal_info.phone)}</div>
            <div>⌖ {emptyToDash(data.personal_info.location)}</div>
            <div>⬡ {emptyToDash(data.personal_info.website)}</div>
          </div>
        </SideBlock>

        <SideBlock label="Skills">
          <div style={{ fontSize: 8.5, color: '#c8ccf0', lineHeight: 2 }}>
            {data.skills.map((s, i) => <div key={i}>{s}</div>)}
          </div>
        </SideBlock>

        <SideBlock label="Languages">
          <div style={{ fontSize: 8.5, color: '#c8ccf0', lineHeight: 2 }}>
            {data.languages.map((l, i) => <div key={i}>{l.name} ({emptyToDash(l.level)})</div>)}
          </div>
        </SideBlock>

        <SideBlock label="Certifications">
          <div style={{ fontSize: 8.5, color: '#c8ccf0', lineHeight: 1.8 }}>
            {data.certifications.map((c, i) => <div key={i}>{c.name}</div>)}
          </div>
        </SideBlock>
      </div>

      <div style={{ flex: 1, padding: '32px 26px', fontSize: 9.5 }}>
        <MainSection label="Profile" accent="#4a4e8a">
          <p style={{ color: '#444', lineHeight: 1.7, margin: 0 }}>{emptyToDash(data.summary)}</p>
        </MainSection>

        <MainSection label="Experience" accent="#4a4e8a">
          {data.experience.map((job, i) => (
            <div key={i} style={{ marginBottom: 11 }}>
              <div style={{ fontWeight: 700, fontSize: 10, color: '#1a1a2e' }}>{emptyToDash(job.job_title)}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0' }}>
                <span style={{ color: '#4a4e8a', fontSize: 9 }}>{emptyToDash(job.company)}</span>
                <span style={{ color: '#999', fontSize: 8.5 }}>{emptyToDash(job.dates)}</span>
              </div>
              <ul style={{ margin: '3px 0 0 14px', color: '#444' }}>
                {job.responsibilities && <li style={{ marginBottom: 1, fontSize: 9 }}>{job.responsibilities}</li>}
                {job.achievements && <li style={{ marginBottom: 1, fontSize: 9 }}>{job.achievements}</li>}
              </ul>
            </div>
          ))}
        </MainSection>

        <MainSection label="Education" accent="#4a4e8a">
          {data.education.map((e, i) => (
            <div key={i} style={{ marginBottom: 8 }}>
              <strong style={{ fontSize: 9.5 }}>{emptyToDash(e.degree)}</strong>
              <span style={{ color: '#666', fontSize: 9 }}> — {emptyToDash(e.institution)} ({emptyToDash(e.graduation_year)})</span>
            </div>
          ))}
        </MainSection>
      </div>
    </div>
  )
}

function TemplateModern({ data }: { data: ResumeData }) {
  const accent = '#e85d04'
  
  const Label = ({ children }: { children: React.ReactNode }) => (
    <div style={{ fontSize: 9, fontWeight: 700, color: accent, letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 12, marginBottom: 8 }}>
      {children}
    </div>
  )

  return (
    <div style={{ fontFamily: "'Helvetica Neue', Arial, sans-serif", minHeight: '100%' }}>
      <div style={{ background: '#1b1b1b', padding: '32px 38px 24px' }}>
        <div style={{ fontSize: 28, fontWeight: 800, color: '#fff', letterSpacing: -0.5 }}>{emptyToDash(data.personal_info.full_name)}</div>
        <div style={{ fontSize: 10, color: accent, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', marginTop: 3 }}>{emptyToDash(data.personal_info.target_title)}</div>
        <div style={{ display: 'flex', gap: 18, marginTop: 10, fontSize: 8.5, color: '#aaa', flexWrap: 'wrap' }}>
          <span>{emptyToDash(data.personal_info.email)}</span>
          <span>{emptyToDash(data.personal_info.phone)}</span>
          <span>{emptyToDash(data.personal_info.location)}</span>
          <span>{emptyToDash(data.personal_info.website)}</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 0, padding: '24px 38px', fontSize: 9.5 }}>
        <div style={{ flex: 1.7, paddingRight: 24 }}>
          <Label>Experience</Label>
          {data.experience.map((job, i) => (
            <div key={i} style={{ marginBottom: 13, display: 'flex', gap: 10 }}>
              <div style={{ width: 3, background: accent, borderRadius: 2, flexShrink: 0, marginTop: 2 }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <strong style={{ fontSize: 10 }}>{emptyToDash(job.job_title)}</strong>
                  <span style={{ fontSize: 8.5, color: accent, fontWeight: 600 }}>{emptyToDash(job.dates)}</span>
                </div>
                <div style={{ fontSize: 9, color: '#666', marginBottom: 3 }}>{emptyToDash(job.company)}</div>
                <ul style={{ margin: '0 0 0 12px', color: '#444', fontSize: 9 }}>
                  {job.responsibilities && <li style={{ marginBottom: 1 }}>{job.responsibilities}</li>}
                  {job.achievements && <li style={{ marginBottom: 1 }}>{job.achievements}</li>}
                </ul>
              </div>
            </div>
          ))}
        </div>

        <div style={{ flex: 1, borderLeft: '1px solid #eee', paddingLeft: 22 }}>
          <Label>About</Label>
          <p style={{ color: '#444', lineHeight: 1.7, marginBottom: 18, margin: 0 }}>{emptyToDash(data.summary)}</p>

          <Label>Education</Label>
          {data.education.map((e, i) => (
            <div key={i} style={{ marginBottom: 10 }}>
              <div style={{ fontWeight: 700, fontSize: 9.5 }}>{emptyToDash(e.degree)}</div>
              <div style={{ color: '#666', fontSize: 8.5 }}>{emptyToDash(e.institution)} · {emptyToDash(e.graduation_year)}</div>
            </div>
          ))}

          <Label>Skills</Label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {data.skills.map((s, i) => (
              <span key={i} style={{ padding: '3px 9px', border: `1px solid ${accent}`, borderRadius: 20, fontSize: 8, color: accent }}>
                {s}
              </span>
            ))}
          </div>

          <div style={{ marginTop: 14 }}>
            <Label>Languages</Label>
            <div style={{ color: '#444', fontSize: 9 }}>
              {data.languages.map((l) => `${l.name} (${l.level})`).join(' · ') || '—'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function TemplateExecutive({ data }: { data: ResumeData }) {
  const gold = '#c9a84c'
  const navy = '#0d1b2a'

  const ExecSection = ({ label, gold, navy, children }: { label: string; gold: string; navy: string; children: React.ReactNode }) => (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: 9.5, fontWeight: 700, color: navy, textTransform: 'uppercase', letterSpacing: 1, paddingBottom: 4, borderBottom: `2px solid ${gold}`, marginBottom: 10 }}>
        {label}
      </div>
      {children}
    </div>
  )

  return (
    <div style={{ fontFamily: 'Georgia, serif', minHeight: '100%' }}>
      <div style={{ background: navy, padding: '34px 42px 26px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: -30, top: -30, width: 140, height: 140, background: gold, opacity: 0.08, borderRadius: '50%' }} />
        <div style={{ position: 'absolute', right: 30, top: 80, width: 60, height: 60, background: gold, opacity: 0.06, borderRadius: '50%' }} />
        <div style={{ fontSize: 26, fontWeight: 700, color: '#fff', letterSpacing: 0.5 }}>{emptyToDash(data.personal_info.full_name)}</div>
        <div style={{ fontSize: 10, color: gold, letterSpacing: 2, textTransform: 'uppercase', marginTop: 4 }}>{emptyToDash(data.personal_info.target_title)}</div>
        <div style={{ display: 'flex', gap: 20, marginTop: 12, fontSize: 8.5, color: '#b0bec5', flexWrap: 'wrap' }}>
          <span>{emptyToDash(data.personal_info.email)}</span>
          <span>{emptyToDash(data.personal_info.phone)}</span>
          <span>{emptyToDash(data.personal_info.location)}</span>
          <span>{emptyToDash(data.personal_info.linkedin_url)}</span>
        </div>
      </div>

      <div style={{ background: '#f9f6ef', padding: '14px 42px', fontSize: 9, color: '#555', borderBottom: `1px solid #e8e0d0`, fontStyle: 'italic', lineHeight: 1.7 }}>
        {emptyToDash(data.summary)}
      </div>

      <div style={{ display: 'flex', gap: 30, padding: '24px 42px', fontSize: 9.5 }}>
        <div style={{ flex: 2 }}>
          <ExecSection label="Career History" gold={gold} navy={navy}>
            {data.experience.map((job, i) => (
              <div key={i} style={{ marginBottom: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <div>
                    <strong style={{ fontSize: 10.5, color: navy }}>{emptyToDash(job.job_title)}</strong>
                    <span style={{ color: gold, fontSize: 9, fontWeight: 600 }}> · {emptyToDash(job.company)}</span>
                  </div>
                  <span style={{ fontSize: 8, color: '#888', border: '1px solid #ddd', padding: '1px 7px', borderRadius: 3 }}>{emptyToDash(job.dates)}</span>
                </div>
                <ul style={{ margin: '4px 0 0 15px', color: '#555', lineHeight: 1.7, fontSize: 9 }}>
                  {job.responsibilities && <li style={{ marginBottom: 2 }}>{job.responsibilities}</li>}
                  {job.achievements && <li style={{ marginBottom: 2 }}>{job.achievements}</li>}
                </ul>
              </div>
            ))}
          </ExecSection>
        </div>

        <div style={{ flex: 1 }}>
          <ExecSection label="Education" gold={gold} navy={navy}>
            {data.education.map((e, i) => (
              <div key={i} style={{ marginBottom: 8 }}>
                <div style={{ fontWeight: 700, color: navy, fontSize: 9.5 }}>{emptyToDash(e.degree)}</div>
                <div style={{ color: '#666', fontSize: 8.5 }}>{emptyToDash(e.institution)}</div>
                <div style={{ color: gold, fontSize: 8.5 }}>{emptyToDash(e.graduation_year)}</div>
              </div>
            ))}
          </ExecSection>

          <ExecSection label="Core Skills" gold={gold} navy={navy}>
            {data.skills.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4, fontSize: 9 }}>
                <div style={{ width: 6, height: 6, background: gold, borderRadius: '50%' }} />
                <span style={{ color: '#444' }}>{s}</span>
              </div>
            ))}
          </ExecSection>

          <ExecSection label="Certifications" gold={gold} navy={navy}>
            {data.certifications.map((c, i) => (
              <div key={i} style={{ fontSize: 8.5, color: '#555', marginBottom: 3 }}>
                · {c.name}
              </div>
            ))}
          </ExecSection>
        </div>
      </div>
    </div>
  )
}

function TemplateMinimal({ data }: { data: ResumeData }) {
  const MinLabel = ({ children }: { children: React.ReactNode }) => (
    <div style={{ fontSize: 9.5, fontWeight: 700, color: '#000', letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 16, marginBottom: 8 }}>
      {children}
    </div>
  )

  return (
    <div style={{ fontFamily: "'Helvetica Neue', Arial, sans-serif", padding: '48px 52px', color: '#222', fontSize: 9.5, lineHeight: 1.6 }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 26, fontWeight: 300, letterSpacing: -0.5 }}>{emptyToDash(data.personal_info.full_name)}</div>
        <div style={{ fontSize: 10, color: '#999', letterSpacing: 0.5, marginTop: 2 }}>{emptyToDash(data.personal_info.target_title)}</div>
        <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 8.5, color: '#bbb' }}>
          <span>{emptyToDash(data.personal_info.email)}</span>
          <span>{emptyToDash(data.personal_info.phone)}</span>
          <span>{emptyToDash(data.personal_info.location)}</span>
          <span>{emptyToDash(data.personal_info.website)}</span>
        </div>
      </div>

      <div style={{ height: 1, background: '#eee', marginBottom: 20 }} />

      <p style={{ fontSize: 9, color: '#555', lineHeight: 1.8, marginBottom: 24, maxWidth: '90%' }}>{emptyToDash(data.summary)}</p>

      <MinLabel>Experience</MinLabel>
      {data.experience.map((job, i) => (
        <div key={i} style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span>
              <strong style={{ fontSize: 10 }}>{emptyToDash(job.job_title)}</strong>{' '}
              <span style={{ color: '#666' }}>{emptyToDash(job.company)}</span>
            </span>
            <span style={{ fontSize: 8.5, color: '#bbb' }}>{emptyToDash(job.dates)}</span>
          </div>
          <ul style={{ margin: '4px 0 0 0', listStyle: 'none', color: '#555' }}>
            {job.responsibilities && (
              <li style={{ paddingLeft: 14, position: 'relative', marginBottom: 2, fontSize: 9 }}>
                <span style={{ position: 'absolute', left: 0, color: '#ccc' }}>—</span>
                {job.responsibilities}
              </li>
            )}
            {job.achievements && (
              <li style={{ paddingLeft: 14, position: 'relative', marginBottom: 2, fontSize: 9 }}>
                <span style={{ position: 'absolute', left: 0, color: '#ccc' }}>—</span>
                {job.achievements}
              </li>
            )}
          </ul>
        </div>
      ))}

      <div style={{ height: 1, background: '#eee', margin: '16px 0' }} />

      <div style={{ display: 'flex', gap: 32 }}>
        <div style={{ flex: 1 }}>
          <MinLabel>Education</MinLabel>
          {data.education.map((e, i) => (
            <div key={i} style={{ fontSize: 9, marginBottom: 8 }}>
              <strong>{emptyToDash(e.degree)}</strong>
              <br />
              <span style={{ color: '#888' }}>{emptyToDash(e.institution)} · {emptyToDash(e.graduation_year)}</span>
            </div>
          ))}
        </div>
        <div style={{ flex: 1 }}>
          <MinLabel>Skills</MinLabel>
          <div style={{ fontSize: 9, color: '#555', lineHeight: 2 }}>{data.skills.join(' · ') || '—'}</div>
        </div>
        <div style={{ flex: 1 }}>
          <MinLabel>Languages</MinLabel>
          <div style={{ fontSize: 9, color: '#555', lineHeight: 2 }}>
            {data.languages.map((l) => `${l.name} (${l.level})`).join('\n') || '—'}
          </div>
        </div>
      </div>
    </div>
  )
}

const templateRenderers: Record<TemplateKey, (props: { data: ResumeData }) => JSX.Element> = {
  classic: TemplateClassic,
  sidebar: TemplateSidebar,
  modern: TemplateModern,
  executive: TemplateExecutive,
  minimal: TemplateMinimal,
}

function mergeResumeData(base: ResumeData, patch: Partial<ResumeData>): ResumeData {
  return {
    ...base,
    ...patch,
    personal_info: { ...base.personal_info, ...(patch.personal_info || {}) },
    summary_inputs: { ...base.summary_inputs, ...(patch.summary_inputs || {}) },
    experience: patch.experience || base.experience,
    education: patch.education || base.education,
    skills: patch.skills || base.skills,
    certifications: patch.certifications || base.certifications,
    languages: patch.languages || base.languages,
  }
}

function makeDocx(data: ResumeData, templateId: TemplateKey) {
  const N = (s: string) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const skills = data.skills.length ? data.skills.join(' · ') : '—'

  const doc = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:body>
<w:p><w:r><w:rPr><w:b/><w:sz w:val="52"/></w:rPr><w:t>${N(data.personal_info.full_name)}</w:t></w:r></w:p>
<w:p><w:r><w:rPr><w:sz w:val="22"/></w:rPr><w:t>${N(data.personal_info.target_title)}</w:t></w:r></w:p>
<w:p><w:r><w:t>${N(data.personal_info.email)} | ${N(data.personal_info.phone)} | ${N(data.personal_info.location)}</w:t></w:r></w:p>
<w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Summary</w:t></w:r></w:p>
<w:p><w:r><w:t>${N(data.summary)}</w:t></w:r></w:p>
<w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Experience</w:t></w:r></w:p>
${data.experience.map((e) => `<w:p><w:r><w:rPr><w:b/></w:rPr><w:t>${N(e.job_title)} - ${N(e.company)} (${N(e.dates)})</w:t></w:r></w:p><w:p><w:r><w:t>${N(e.achievements || e.responsibilities)}</w:t></w:r></w:p>`).join('')}
<w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Skills</w:t></w:r></w:p>
<w:p><w:r><w:t>${N(skills)}</w:t></w:r></w:p>
<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1080" w:right="1080" w:bottom="1080" w:left="1080"/></w:sectPr>
</w:body>
</w:document>`

  const styles = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:sz w:val="20"/></w:rPr></w:rPrDefault></w:docDefaults></w:styles>`
  const ct = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>`
  const rootRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`
  const wordRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`

  const u8 = (s: string) => new TextEncoder().encode(s)
  const crc32 = (b: Uint8Array) => {
    const t: number[] = []
    for (let i = 0; i < 256; i++) { let c = i; for (let j = 0; j < 8; j++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1); t[i] = c }
    let c = 0xffffffff
    for (let i = 0; i < b.length; i++) c = t[(c ^ b[i]) & 0xff] ^ (c >>> 8)
    return (c ^ 0xffffffff) >>> 0
  }

  const files: Array<[string, string]> = [
    ['[Content_Types].xml', ct],
    ['_rels/.rels', rootRels],
    ['word/document.xml', doc],
    ['word/styles.xml', styles],
    ['word/_rels/document.xml.rels', wordRels],
  ]

  const entries: Array<{ nb: Uint8Array; data: Uint8Array; crc: number; offset: number }> = []
  let offset = 0
  const parts: Uint8Array[] = []

  for (const [name, content] of files) {
    const nb = u8(name)
    const dataBytes = u8(content)
    const crc = crc32(dataBytes)
    const h = new Uint8Array(30 + nb.length)
    const v = new DataView(h.buffer)
    v.setUint32(0, 0x04034b50, true)
    v.setUint16(4, 20, true)
    v.setUint16(6, 0, true)
    v.setUint16(8, 0, true)
    v.setUint32(14, crc, true)
    v.setUint32(18, dataBytes.length, true)
    v.setUint32(22, dataBytes.length, true)
    v.setUint16(26, nb.length, true)
    h.set(nb, 30)
    entries.push({ nb, data: dataBytes, crc, offset })
    parts.push(h, dataBytes)
    offset += h.length + dataBytes.length
  }

  const cdp: Uint8Array[] = []
  let cds = 0
  for (const e of entries) {
    const cd = new Uint8Array(46 + e.nb.length)
    const v = new DataView(cd.buffer)
    v.setUint32(0, 0x02014b50, true)
    v.setUint16(4, 20, true)
    v.setUint16(6, 20, true)
    v.setUint16(8, 0, true)
    v.setUint16(10, 0, true)
    v.setUint32(16, e.crc, true)
    v.setUint32(20, e.data.length, true)
    v.setUint32(24, e.data.length, true)
    v.setUint16(28, e.nb.length, true)
    v.setUint32(42, e.offset, true)
    cd.set(e.nb, 46)
    cdp.push(cd)
    cds += cd.length
  }

  const eocd = new Uint8Array(22)
  const ev = new DataView(eocd.buffer)
  ev.setUint32(0, 0x06054b50, true)
  ev.setUint16(8, entries.length, true)
  ev.setUint16(10, entries.length, true)
  ev.setUint32(12, cds, true)
  ev.setUint32(16, offset, true)

  const all = [...parts, ...cdp, eocd]
  const total = all.reduce((s, b) => s + b.length, 0)
  const out = new Uint8Array(total)
  let pos = 0
  for (const p of all) {
    out.set(p, pos)
    pos += p.length
  }

  const blob = new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `generated-resume-${templateId}.docx`
  a.click()
  URL.revokeObjectURL(url)
}

export default function ResumeGeneratorPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [items, setItems] = useState<GeneratedResume[]>([])
  const [templates, setTemplates] = useState<TemplateItem[]>([])
  const [loadingList, setLoadingList] = useState(true)
  const [mode, setMode] = useState<'list' | 'builder'>('list')
  const [error, setError] = useState<string | null>(null)
  const [active, setActive] = useState<GeneratedResume | null>(null)
  const [data, setData] = useState<ResumeData>(defaultResumeData)
  const [templateKey, setTemplateKey] = useState<TemplateKey>('classic')
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [generatingSummary, setGeneratingSummary] = useState(false)
  const [generatingResumeAI, setGeneratingResumeAI] = useState(false)
  const [quickImportText, setQuickImportText] = useState('')
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [newResumeName, setNewResumeName] = useState('')
  const [skillInput, setSkillInput] = useState('')
  const [copied, setCopied] = useState(false)
  const [saveState, setSaveState] = useState<'idle' | 'saved' | 'saving'>('idle')
  const [profile, setProfile] = useState<{ fullName?: string; email?: string; subscription_type?: string }>({})
  const previewRef = useRef<HTMLDivElement | null>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const hydratedRef = useRef(false)

  const stepLabels = [
    'Quick Import',
    'Personal Info',
    'Summary Inputs',
    'Experience',
    'Education',
    'Skills',
    'Certifications',
    'Languages',
    'Template & Preview',
  ]

  const completionWarnings = useMemo(() => getCompletionWarnings(data), [data])

  const selectedTemplateRenderer = useMemo(() => templateRenderers[templateKey] || templateRenderers.classic, [templateKey])

  const firstIncompleteStep = useMemo(() => {
    const hasPersonal = Boolean(data.personal_info.full_name && data.personal_info.email)
    const hasSummaryInputs = Boolean(data.summary_inputs.current_role && data.summary_inputs.specialization)
    const hasExperience = data.experience.some((job) => job.job_title && job.company)
    const hasEducation = data.education.some((edu) => edu.degree && edu.institution)
    const hasSkills = data.skills.length > 0
    const hasCerts = data.certifications.some((cert) => cert.name)
    const hasLanguages = data.languages.some((lang) => lang.name)

    if (!hasPersonal) return 1
    if (!hasSummaryInputs) return 2
    if (!hasExperience) return 3
    if (!hasEducation) return 4
    if (!hasSkills) return 5
    if (!hasCerts) return 6
    if (!hasLanguages) return 7
    return 8
  }, [data])

  const fetchAll = async () => {
    try {
      setLoadingList(true)
      const token = getAuthToken()
      const headers = token ? { Authorization: `Bearer ${token}` } : {}

      const [listRes, templateRes, meRes] = await Promise.all([
        fetch('/api/resume/generated', { headers }),
        fetch('/api/resume/generated/templates', { headers }),
        fetch('/api/auth/me'),
      ])

      const listData = await listRes.json().catch(() => [])
      const templateData = await templateRes.json().catch(() => [])
      const meData = await meRes.json().catch(() => ({}))

      if (!listRes.ok) throw new Error(listData?.detail || 'Failed to load generated resumes')
      if (!templateRes.ok) throw new Error(templateData?.detail || 'Failed to load templates')

      setItems(Array.isArray(listData) ? listData.map((item: GeneratedResume) => ({ ...item, resume_data: normalizeResumeData(item.resume_data) })) : [])
      setTemplates(Array.isArray(templateData) ? templateData : [])
      setProfile({
        fullName: meData?.user?.fullName,
        email: meData?.user?.email,
        subscription_type: meData?.user?.subscription_type,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load generated resumes')
    } finally {
      setLoadingList(false)
    }
  }

  useEffect(() => {
    fetchAll()
  }, [])

  useEffect(() => {
    if (!active?.id || !hydratedRef.current) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      try {
        setSaveState('saving')
        setSaving(true)
        const token = getAuthToken()
        const response = await fetch(`/api/resume/generated/${active.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            title: active.title,
            template_key: templateKey,
            resume_data: data,
            quick_import_input: [linkedinUrl, quickImportText].filter(Boolean).join('\n\n'),
            status: firstIncompleteStep >= 8 ? 'completed' : 'draft',
          }),
        })

        const payload = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(payload?.detail || 'Failed to save')

        setActive(payload)
        setItems((prev) => prev.map((item) => (item.id === payload.id ? { ...payload, resume_data: normalizeResumeData(payload.resume_data) } : item)))
        setSaveState('saved')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save changes')
      } finally {
        setSaving(false)
      }
    }, 700)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [active?.id, active?.title, data, templateKey, quickImportText, linkedinUrl, firstIncompleteStep])

  const openBuilder = (item: GeneratedResume) => {
    const normalized = normalizeResumeData(item.resume_data)
    setActive(item)
    setData(normalized)
    setTemplateKey((item.template_key as TemplateKey) || 'classic')
    setQuickImportText('')
    setLinkedinUrl('')
    setMode('builder')
    setStep(Math.max(0, firstIncompleteStep))
    hydratedRef.current = true
    router.replace(`/resume-generator?resumeId=${item.id}`)
  }

  const handleCreateNew = async () => {
    try {
      setError(null)
      const token = getAuthToken()
      const latest = items[0]
      const prefill = latest?.resume_data ? normalizeResumeData(latest.resume_data) : normalizeResumeData(defaultResumeData)
      if (profile.fullName) prefill.personal_info.full_name = prefill.personal_info.full_name || profile.fullName
      if (profile.email) prefill.personal_info.email = prefill.personal_info.email || profile.email

      const response = await fetch('/api/resume/generated', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          title: (newResumeName.trim() || `Generated Resume ${items.length + 1}`),
          template_key: templates[0]?.key || 'classic',
          resume_data: prefill,
        }),
      })

      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload?.detail || 'Failed to create generated resume')

      const created = { ...payload, resume_data: normalizeResumeData(payload.resume_data) } as GeneratedResume
      setItems((prev) => [created, ...prev])
      setActive(created)
      setData(created.resume_data)
      setTemplateKey((created.template_key as TemplateKey) || 'classic')
      setMode('builder')
      setStep(firstIncompleteStep)
      hydratedRef.current = true
      setNewResumeName('')
      router.replace(`/resume-generator?resumeId=${created.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create generated resume')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const token = getAuthToken()
      const response = await fetch(`/api/resume/generated/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload?.detail || 'Failed to delete generated resume')
      }
      setItems((prev) => prev.filter((item) => item.id !== id))
      if (active?.id === id) {
        setMode('list')
        setActive(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete generated resume')
    }
  }

  const applyQuickImport = () => {
    const parsed = parseQuickImportText(quickImportText)
    const merged = mergeResumeData(data, parsed)
    if (linkedinUrl.trim()) {
      merged.personal_info.linkedin_url = linkedinUrl.trim()
    }
    setData(merged)
    setStep(1)
  }

  const addSkill = () => {
    const skill = skillInput.trim()
    if (!skill) return
    if (data.skills.includes(skill)) {
      setSkillInput('')
      return
    }
    if (data.skills.length >= 10) return
    setData((prev) => ({ ...prev, skills: [...prev.skills, skill] }))
    setSkillInput('')
  }

  const generateSummary = async () => {
    if (!active?.id) return
    setGeneratingSummary(true)
    try {
      const token = getAuthToken()
      const response = await fetch(`/api/resume/generated/${active.id}/summary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(data.summary_inputs),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload?.detail || 'Failed to generate summary')
      if (payload.summary) {
        setData((prev) => ({ ...prev, summary: payload.summary }))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate summary')
    } finally {
      setGeneratingSummary(false)
    }
  }

  const aiGenerateResume = async () => {
    if (!active?.id) return
    try {
      setGeneratingResumeAI(true)
      setError(null)
      const token = getAuthToken()
      const response = await fetch(`/api/resume/generated/${active.id}/ai-generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          quick_import_input: [linkedinUrl, quickImportText].filter(Boolean).join('\n\n') || undefined,
          target_role: data.summary_inputs.target_role || undefined,
          target_company_type: data.summary_inputs.target_company_type || undefined,
        }),
      })

      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(payload?.detail || 'Failed to AI-generate resume')
      }

      if (payload?.generated_resume) {
        const updated = {
          ...payload.generated_resume,
          resume_data: normalizeResumeData(payload.generated_resume.resume_data),
        } as GeneratedResume
        setActive(updated)
        setData(updated.resume_data)
        setItems((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
        setSaveState('saved')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to AI-generate resume')
    } finally {
      setGeneratingResumeAI(false)
    }
  }

  const downloadPDF = async () => {
    if (!previewRef.current) return
    const canvas = await html2canvas(previewRef.current, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true,
    })
    const img = canvas.toDataURL('image/png')
    const pdf = new jsPDF({ unit: 'pt', format: 'a4' })
    const w = pdf.internal.pageSize.getWidth()
    const h = pdf.internal.pageSize.getHeight()
    pdf.addImage(img, 'PNG', 0, 0, w, h)
    pdf.save(`${(active?.title || 'generated-resume').replace(/\s+/g, '-').toLowerCase()}.pdf`)
  }

  const downloadDocx = () => {
    makeDocx(data, templateKey)
  }

  const finishBuilder = async () => {
    if (!active?.id) return
    try {
      setSaving(true)
      setSaveState('saving')
      const token = getAuthToken()
      const response = await fetch(`/api/resume/generated/${active.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          title: active.title,
          template_key: templateKey,
          resume_data: data,
          quick_import_input: [linkedinUrl, quickImportText].filter(Boolean).join('\n\n'),
          status: 'completed',
        }),
      })

      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(payload?.detail || 'Failed to finalize generated resume')
      }

      const updated = { ...payload, resume_data: normalizeResumeData(payload.resume_data) } as GeneratedResume
      setActive(updated)
      setItems((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
      setSaveState('saved')
      setMode('list')
      router.replace('/resume-generator')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to finalize generated resume')
    } finally {
      setSaving(false)
    }
  }

  const copySummary = async () => {
    if (!data.summary.trim()) return
    await navigator.clipboard.writeText(data.summary)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const updateExperience = (index: number, field: keyof ExperienceItem, value: string) => {
    setData((prev) => ({
      ...prev,
      experience: prev.experience.map((item, idx) => (idx === index ? { ...item, [field]: value } : item)),
    }))
  }

  const updateEducation = (index: number, field: keyof EducationItem, value: string) => {
    setData((prev) => ({
      ...prev,
      education: prev.education.map((item, idx) => (idx === index ? { ...item, [field]: value } : item)),
    }))
  }

  const updateCertification = (index: number, field: keyof CertificationItem, value: string) => {
    setData((prev) => ({
      ...prev,
      certifications: prev.certifications.map((item, idx) => (idx === index ? { ...item, [field]: value } : item)),
    }))
  }

  const updateLanguage = (index: number, field: keyof LanguageItem, value: string) => {
    setData((prev) => ({
      ...prev,
      languages: prev.languages.map((item, idx) => (idx === index ? { ...item, [field]: value } : item)),
    }))
  }

  const PreviewComp = selectedTemplateRenderer

  useEffect(() => {
    if (!items.length) return
    const selectedId = searchParams.get('resumeId')
    if (!selectedId) return

    const match = items.find((item) => item.id === selectedId)
    if (match && (mode !== 'builder' || active?.id !== match.id)) {
      openBuilder(match)
    }
  }, [items, searchParams])

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Generate Resume</h1>
            <p className="text-gray-600 dark:text-gray-300">
              Build platform-generated resumes with conversational steps, smart prefill, and live template preview.
            </p>
          </div>
          {mode === 'list' && (
            <div className="flex items-center gap-2">
              <input
                value={newResumeName}
                onChange={(e) => setNewResumeName(e.target.value)}
                placeholder="Name your resume"
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
              <button onClick={handleCreateNew} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-white hover:bg-primary/90">
                <Plus className="h-4 w-4" />
                New Generated Resume
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
            {error}
          </div>
        )}

        {mode === 'list' && (
          <div className="rounded-xl border border-border bg-card p-4">
            {loadingList ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading generated resumes...
              </div>
            ) : items.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-10 text-center">
                <FileText className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
                <h2 className="text-xl font-semibold">No generated resumes yet</h2>
                <p className="mt-2 text-sm text-muted-foreground">Start with the guided flow and select a template.</p>
                <button onClick={handleCreateNew} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-white hover:bg-primary/90">
                  <Plus className="h-4 w-4" /> Create your first generated resume
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                {items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => openBuilder(item)}
                    className="w-full rounded-lg border border-border p-4 text-left transition hover:border-primary/40 hover:bg-accent"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold">{item.title}</h3>
                        <p className="text-xs text-muted-foreground">
                          Template: {(item.template_key || 'classic').toString()} • Status: {item.status}
                        </p>
                        <p className="text-xs text-muted-foreground">Updated: {new Date(item.updated_at || item.created_at).toLocaleString()}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            openBuilder(item)
                          }}
                          className="rounded-md bg-primary/10 px-3 py-1 text-xs font-medium text-primary hover:bg-primary/20"
                        >
                          View
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(item.id)
                          }}
                          className="rounded-md bg-red-100 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-300"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {mode === 'builder' && active && (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setMode('list')
                    router.replace('/resume-generator')
                  }}
                  className="rounded-lg border border-border p-2 hover:bg-accent"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <input
                  value={active.title}
                  onChange={(e) => setActive((prev) => (prev ? { ...prev, title: e.target.value } : prev))}
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {saveState === 'saving' && <><Loader2 className="h-3 w-3 animate-spin" /> Saving...</>}
                {saveState === 'saved' && <><Check className="h-3 w-3" /> Saved</>}
                {saveState === 'idle' && <><Save className="h-3 w-3" /> Autosave enabled</>}
                {profile.subscription_type === 'professional' || profile.subscription_type === 'enterprise' ? (
                  <button
                    onClick={aiGenerateResume}
                    disabled={generatingResumeAI}
                    className="ml-2 inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-primary hover:bg-primary/20 disabled:opacity-60"
                  >
                    {generatingResumeAI ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3" />}
                    AI Generate Resume
                  </button>
                ) : null}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Step {step + 1} of {stepLabels.length}: {stepLabels[step]}</p>
                <p className="text-sm font-medium">{Math.round(((step + 1) / stepLabels.length) * 100)}%</p>
              </div>
              <div className="h-2 w-full rounded-full bg-muted">
                <div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${((step + 1) / stepLabels.length) * 100}%` }} />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.1fr_1fr]">
              <motion.div key={step} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border bg-card p-5">
                {step === 0 && (
                  <div className="space-y-4">
                    <h2 className="text-xl font-semibold">Quick Import</h2>
                    <p className="text-sm text-muted-foreground">Paste your LinkedIn URL or existing CV text to prefill and skip answered sections.</p>
                    <input
                      value={linkedinUrl}
                      onChange={(e) => setLinkedinUrl(e.target.value)}
                      placeholder="LinkedIn URL"
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    />
                    <textarea
                      value={quickImportText}
                      onChange={(e) => setQuickImportText(e.target.value)}
                      rows={8}
                      placeholder="Paste CV text here..."
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    />
                    <button onClick={applyQuickImport} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-white hover:bg-primary/90">
                      <Sparkles className="h-4 w-4" /> Apply import and continue
                    </button>
                  </div>
                )}

                {step === 1 && (
                  <div className="space-y-3">
                    <h2 className="text-xl font-semibold">Personal Info</h2>
                    <p className="text-sm text-muted-foreground">Fill the header section used by all templates.</p>
                    {[
                      ['Full name', 'full_name'],
                      ['Professional title / target role', 'target_title'],
                      ['Email', 'email'],
                      ['Phone', 'phone'],
                      ['Location', 'location'],
                      ['LinkedIn URL', 'linkedin_url'],
                      ['Website/Portfolio', 'website'],
                    ].map(([label, key]) => (
                      <div key={key}>
                        <label className="mb-1 block text-sm font-medium">{label}</label>
                        <input
                          value={data.personal_info[key as keyof ResumeData['personal_info']]}
                          onChange={(e) => setData((prev) => ({ ...prev, personal_info: { ...prev.personal_info, [key]: e.target.value } }))}
                          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-3">
                    <h2 className="text-xl font-semibold">Professional Summary Inputs</h2>
                    <p className="text-sm text-muted-foreground">Answer these; summary is generated for you.</p>
                    {[
                      ['Current role and years of experience', 'current_role'],
                      ['Years of experience (number)', 'years_experience'],
                      ['Core area of specialization', 'specialization'],
                      ['Target role', 'target_role'],
                      ['Target company type', 'target_company_type'],
                    ].map(([label, key]) => (
                      <div key={key}>
                        <label className="mb-1 block text-sm font-medium">{label}</label>
                        <input
                          value={data.summary_inputs[key as keyof ResumeData['summary_inputs']] as string}
                          onChange={(e) => setData((prev) => ({ ...prev, summary_inputs: { ...prev.summary_inputs, [key]: e.target.value } }))}
                          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                        />
                      </div>
                    ))}
                    <div>
                      <label className="mb-1 block text-sm font-medium">Career highlights (one per line)</label>
                      <textarea
                        value={data.summary_inputs.highlights.join('\n')}
                        onChange={(e) => setData((prev) => ({ ...prev, summary_inputs: { ...prev.summary_inputs, highlights: e.target.value.split('\n').map((v) => v.trim()).filter(Boolean) } }))}
                        rows={4}
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={generateSummary} disabled={generatingSummary} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-white hover:bg-primary/90 disabled:opacity-70">
                        {generatingSummary ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />} Generate summary
                      </button>
                      <button onClick={copySummary} className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-accent">
                        <Copy className="h-4 w-4" /> {copied ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium">Generated summary</label>
                      <textarea
                        value={data.summary}
                        onChange={(e) => setData((prev) => ({ ...prev, summary: e.target.value }))}
                        rows={5}
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-3">
                    <h2 className="text-xl font-semibold">Work Experience</h2>
                    <p className="text-sm text-muted-foreground">Up to 3 jobs. Use outcomes: what changed because of your work?</p>
                    {data.experience.map((job, index) => (
                      <div key={index} className="rounded-lg border border-border p-3">
                        <div className="mb-2 text-sm font-semibold">Job {index + 1}</div>
                        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                          <input placeholder="Job title" value={job.job_title} onChange={(e) => updateExperience(index, 'job_title', e.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
                          <input placeholder="Company" value={job.company} onChange={(e) => updateExperience(index, 'company', e.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
                        </div>
                        <input placeholder="Employment dates (month/year)" value={job.dates} onChange={(e) => updateExperience(index, 'dates', e.target.value)} className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
                        <textarea placeholder="Main responsibilities" value={job.responsibilities} onChange={(e) => updateExperience(index, 'responsibilities', e.target.value)} rows={2} className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
                        <textarea placeholder="What did you achieve? Add numbers (%, revenue, time saved, team size)" value={job.achievements} onChange={(e) => updateExperience(index, 'achievements', e.target.value)} rows={3} className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
                        <input placeholder="Did you lead or manage anyone?" value={job.led_team} onChange={(e) => updateExperience(index, 'led_team', e.target.value)} className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
                      </div>
                    ))}
                    {data.experience.length < 3 && (
                      <button onClick={() => setData((prev) => ({ ...prev, experience: [...prev.experience, { job_title: '', company: '', dates: '', responsibilities: '', achievements: '', led_team: '' }] }))} className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-accent">
                        + Add another job
                      </button>
                    )}
                  </div>
                )}

                {step === 4 && (
                  <div className="space-y-3">
                    <h2 className="text-xl font-semibold">Education</h2>
                    {data.education.map((item, index) => (
                      <div key={index} className="rounded-lg border border-border p-3">
                        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                          <input placeholder="Degree" value={item.degree} onChange={(e) => updateEducation(index, 'degree', e.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
                          <input placeholder="Institution" value={item.institution} onChange={(e) => updateEducation(index, 'institution', e.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
                        </div>
                        <input placeholder="Graduation year" value={item.graduation_year} onChange={(e) => updateEducation(index, 'graduation_year', e.target.value)} className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
                        <input placeholder="Coursework, thesis, honors (optional)" value={item.details || ''} onChange={(e) => updateEducation(index, 'details', e.target.value)} className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
                      </div>
                    ))}
                  </div>
                )}

                {step === 5 && (
                  <div className="space-y-3">
                    <h2 className="text-xl font-semibold">Skills</h2>
                    <p className="text-sm text-muted-foreground">Tag style input (max 10)</p>
                    <div className="flex gap-2">
                      <input value={skillInput} onChange={(e) => setSkillInput(e.target.value)} placeholder="Add skill" className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm" />
                      <button onClick={addSkill} className="rounded-lg bg-primary px-4 py-2 text-white">Add</button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {data.skills.map((skill) => (
                        <button key={skill} onClick={() => setData((prev) => ({ ...prev, skills: prev.skills.filter((s) => s !== skill) }))} className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs text-primary">
                          {skill} ×
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {step === 6 && (
                  <div className="space-y-3">
                    <h2 className="text-xl font-semibold">Certifications & Courses</h2>
                    {data.certifications.map((item, index) => (
                      <div key={index} className="grid grid-cols-1 gap-2 md:grid-cols-2">
                        <input placeholder="Certification name" value={item.name} onChange={(e) => updateCertification(index, 'name', e.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
                        <input placeholder="Year issued" value={item.year} onChange={(e) => updateCertification(index, 'year', e.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
                      </div>
                    ))}
                    <button onClick={() => setData((prev) => ({ ...prev, certifications: [...prev.certifications, { name: '', year: '' }] }))} className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-accent">
                      + Add certification
                    </button>
                  </div>
                )}

                {step === 7 && (
                  <div className="space-y-3">
                    <h2 className="text-xl font-semibold">Languages</h2>
                    {data.languages.map((item, index) => (
                      <div key={index} className="grid grid-cols-1 gap-2 md:grid-cols-2">
                        <input placeholder="Language" value={item.name} onChange={(e) => updateLanguage(index, 'name', e.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
                        <select value={item.level} onChange={(e) => updateLanguage(index, 'level', e.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
                          {proficiencyLevels.map((level) => <option key={level} value={level}>{level}</option>)}
                        </select>
                      </div>
                    ))}
                    <button onClick={() => setData((prev) => ({ ...prev, languages: [...prev.languages, { name: '', level: 'Fluent' }] }))} className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-accent">
                      + Add language
                    </button>
                  </div>
                )}

                {step === 8 && (
                  <div className="space-y-4">
                    <h2 className="text-xl font-semibold">Template Selection & Preview</h2>
                    <p className="text-sm text-muted-foreground">Pick a template from DB-backed options. You can add more templates later without changing this page.</p>
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                      {templates.map((tpl) => (
                        <button
                          key={tpl.id}
                          onClick={() => setTemplateKey(tpl.key)}
                          className={`rounded-lg border p-3 text-left transition ${templateKey === tpl.key ? 'border-primary bg-primary/10' : 'border-border hover:bg-accent'}`}
                        >
                          <div className="font-medium">{tpl.label}</div>
                          <div className="text-xs text-muted-foreground">{tpl.description}</div>
                        </button>
                      ))}
                    </div>

                    {completionWarnings.length > 0 && (
                      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
                        <div className="font-medium">Soft completion tips</div>
                        <ul className="ml-4 list-disc">
                          {completionWarnings.map((warning) => <li key={warning}>{warning}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-6 flex items-center justify-between">
                  <button onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0} className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm disabled:opacity-50">
                    <ArrowLeft className="h-4 w-4" /> Back
                  </button>
                  {step === stepLabels.length - 1 ? (
                    <button
                      onClick={finishBuilder}
                      disabled={saving || !templateKey}
                      className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm text-white disabled:opacity-50"
                    >
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      Finish
                    </button>
                  ) : (
                    <button onClick={() => setStep((s) => Math.min(stepLabels.length - 1, s + 1))} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm text-white disabled:opacity-50">
                      Next <ArrowRight className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </motion.div>

              <div className="space-y-4">
                <div className="rounded-xl border border-border bg-card p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="font-semibold">Realtime Preview ({templateKey})</h3>
                    <div className="flex items-center gap-2">
                      <button onClick={downloadDocx} className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-accent">
                        <Download className="h-3 w-3" /> DOCX
                      </button>
                      <button onClick={downloadPDF} className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs text-white hover:bg-primary/90">
                        <Download className="h-3 w-3" /> PDF
                      </button>
                    </div>
                  </div>

                  <div className="overflow-auto rounded-lg bg-muted p-3">
                    <div ref={previewRef} className="mx-auto w-[595px] min-h-[842px] overflow-hidden rounded bg-white shadow-xl">
                      <PreviewComp data={data} />
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-card p-4 text-xs text-muted-foreground">
                  <div className="mb-1 font-medium text-foreground">Skip behavior</div>
                  Existing answers from your generated resume draft are auto-filled and steps are effectively skipped by starting at the next missing section.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
