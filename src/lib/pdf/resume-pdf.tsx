import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { AdaptedResume } from '@/lib/core/ai/resume-adaptation-generator';

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#1a1a1a',
    lineHeight: 1.5,
  },
  name: { fontSize: 20, fontWeight: 'bold', marginBottom: 6 },
  headline: { fontSize: 12, color: '#333333', marginBottom: 6 },
  contact: { fontSize: 9, color: '#444444', marginBottom: 4 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
    paddingBottom: 2,
    marginTop: 12,
    marginBottom: 6,
  },
  summary: { fontSize: 10, marginBottom: 4 },
  skillRow: { flexDirection: 'row', marginBottom: 2 },
  skill: { fontSize: 10 },
  jobBlock: { marginBottom: 6 },
  jobHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  jobRole: { fontSize: 10, fontWeight: 'bold' },
  jobCompany: { fontSize: 10, fontStyle: 'italic' },
  jobPeriod: { fontSize: 9, color: '#444444' },
  bullet: { fontSize: 10, marginBottom: 1, paddingLeft: 10 },
  eduBlock: { marginBottom: 4 },
  eduDegree: { fontSize: 10, fontWeight: 'bold' },
  eduInstitution: { fontSize: 10 },
  certBlock: { marginBottom: 4 },
  certName: { fontSize: 10, fontWeight: 'bold' },
  certMeta: { fontSize: 10 },
  langRow: { flexDirection: 'row', marginBottom: 2 },
  lang: { fontSize: 10 },
});

export function ResumePdfDocument({ resume }: { resume: AdaptedResume }) {
  const contactParts = [
    resume.contact?.email,
    resume.contact?.phone,
    resume.contact?.location,
    resume.contact?.linkedin,
  ].filter(Boolean);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {resume.fullName && <Text style={styles.name}>{resume.fullName}</Text>}
        {resume.headline && <Text style={styles.headline}>{resume.headline}</Text>}
        {contactParts.length > 0 && (
          <Text style={styles.contact}>{contactParts.join(' · ')}</Text>
        )}

        {resume.summary && (
          <>
            <Text style={styles.sectionTitle}>Resumo</Text>
            <Text style={styles.summary}>{resume.summary}</Text>
          </>
        )}

        {resume.skills.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Habilidades</Text>
            <View style={styles.skillRow}>
              <Text style={styles.skill}>{resume.skills.join(', ')}</Text>
            </View>
          </>
        )}

        {resume.experience.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Experiência</Text>
            {resume.experience.map((exp, i) => (
              <View key={`exp-${i}`} style={styles.jobBlock}>
                <View style={styles.jobHeader}>
                  <View>
                    <Text style={styles.jobRole}>{exp.role}</Text>
                    {exp.company && <Text style={styles.jobCompany}>{exp.company}</Text>}
                  </View>
                  {exp.period && <Text style={styles.jobPeriod}>{exp.period}</Text>}
                </View>
                {exp.bullets.map((bullet, j) => (
                  <Text key={`b-${j}`} style={styles.bullet}>
                    • {bullet}
                  </Text>
                ))}
              </View>
            ))}
          </>
        )}

        {resume.education.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Formação</Text>
            {resume.education.map((edu, i) => (
              <View key={`edu-${i}`} style={styles.eduBlock}>
                <Text style={styles.eduDegree}>{edu.degree}</Text>
                {edu.institution && <Text style={styles.eduInstitution}>{edu.institution}</Text>}
                {edu.period && <Text style={styles.jobPeriod}>{edu.period}</Text>}
              </View>
            ))}
          </>
        )}

        {resume.certifications.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Certificações</Text>
            {resume.certifications.map((cert, i) => (
              <View key={`cert-${i}`} style={styles.certBlock}>
                <Text style={styles.certName}>{cert.name}</Text>
                {[cert.issuer, cert.year].filter(Boolean).length > 0 && (
                  <Text style={styles.certMeta}>
                    {[cert.issuer, cert.year].filter(Boolean).join(' — ')}
                  </Text>
                )}
              </View>
            ))}
          </>
        )}

        {resume.languages.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Idiomas</Text>
            {resume.languages.map((lang, i) => (
              <View key={`lang-${i}`} style={styles.langRow}>
                <Text style={styles.lang}>
                  {[lang.language, lang.level].filter(Boolean).join(' — ')}
                </Text>
              </View>
            ))}
          </>
        )}
      </Page>
    </Document>
  );
}