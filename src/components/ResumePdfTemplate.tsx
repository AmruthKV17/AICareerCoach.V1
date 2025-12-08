"use client";

import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { ReactNode } from "react";

export type GeneratedResume = {
  personal_info?: {
    name?: string;
    contact?: {
      address?: string;
      email?: string;
      phone?: string;
      linkedin?: string;
    };
  };
  career_objective?: string;
  skills?: {
    technical_skills?: string[];
    soft_skills?: string[];
  };
  education?: {
    school?: string;
    level?: string;
    graduation?: string;
    relevant_coursework?: string[];
  };
  experience?: {
    title?: string;
    company?: string;
    location?: string;
    duration?: string;
    responsibilities?: string[];
  }[];
  projects_achievements?: string[];
  certifications?: string[];
  additional_info?: string[];
  optimization_notes?: string;
};

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 11,
    lineHeight: 1.4,
    color: "#111827",
  },
  header: {
    marginBottom: 16,
  },
  name: {
    fontSize: 22,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  contact: {
    marginTop: 6,
    fontSize: 10,
    color: "#4b5563",
  },
  section: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    letterSpacing: 0.5,
    color: "#2563eb",
    marginBottom: 6,
    textTransform: "uppercase",
  },
  paragraph: {
    fontSize: 11,
  },
  bulletList: {
    marginTop: 4,
    marginLeft: 10,
  },
  bulletItem: {
    flexDirection: "row",
    marginBottom: 4,
  },
  bullet: {
    width: 6,
  },
  bulletText: {
    flex: 1,
  },
  twoColumn: {
    flexDirection: "row",
    gap: 12,
  },
  column: {
    flex: 1,
  },
});

const Section = ({ title, children }: { title: string; children?: ReactNode }) => {
  if (!children) return null;
  return (
    <View style={styles.section} wrap={false}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
};

const BulletList = ({ items }: { items?: string[] }) => {
  if (!items?.length) return null;
  return (
    <View style={styles.bulletList}>
      {items.map((item) => (
        <View key={item} style={styles.bulletItem}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.bulletText}>{item}</Text>
        </View>
      ))}
    </View>
  );
};

type ResumePdfTemplateProps = {
  data: GeneratedResume;
};

const ResumePdfTemplate = ({ data }: ResumePdfTemplateProps) => {
  const {
    personal_info,
    career_objective,
    skills,
    education,
    experience,
    projects_achievements,
    certifications,
    additional_info,
    optimization_notes,
  } = data;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          {personal_info?.name ? <Text style={styles.name}>{personal_info.name}</Text> : null}
          {personal_info?.contact ? (
            <Text style={styles.contact}>
              {[personal_info.contact.address, personal_info.contact.email, personal_info.contact.phone, personal_info.contact.linkedin]
                .filter(Boolean)
                .join(" • ")}
            </Text>
          ) : null}
        </View>

        {career_objective ? (
          <Section title="Career Objective">
            <Text style={styles.paragraph}>{career_objective}</Text>
          </Section>
        ) : null}

        {skills && (skills.technical_skills?.length || skills.soft_skills?.length) ? (
          <Section title="Skills">
            <View style={styles.twoColumn}>
              {skills.technical_skills?.length ? (
                <View style={styles.column}>
                  <Text style={{ fontWeight: "bold" }}>Technical</Text>
                  <BulletList items={skills.technical_skills} />
                </View>
              ) : null}
              {skills.soft_skills?.length ? (
                <View style={styles.column}>
                  <Text style={{ fontWeight: "bold" }}>Soft</Text>
                  <BulletList items={skills.soft_skills} />
                </View>
              ) : null}
            </View>
          </Section>
        ) : null}

        {education ? (
          <Section title="Education">
            {education.school ? <Text style={{ fontWeight: "bold" }}>{education.school}</Text> : null}
            {education.level ? <Text>{education.level}</Text> : null}
            {education.graduation ? <Text>{education.graduation}</Text> : null}
            <BulletList items={education.relevant_coursework} />
          </Section>
        ) : null}

        {experience?.length ? (
          <Section title="Experience">
            {experience.map((role, index) => (
              <View key={`${role.title ?? "role"}-${index}`} style={{ marginBottom: 8 }}>
                <Text style={{ fontWeight: "bold" }}>
                  {[role.title, role.company].filter(Boolean).join(" • ")}
                </Text>
                <Text style={{ color: "#4b5563" }}>
                  {[role.location, role.duration].filter(Boolean).join(" | ")}
                </Text>
                <BulletList items={role.responsibilities} />
              </View>
            ))}
          </Section>
        ) : null}

        <Section title="Projects & Achievements">
          <BulletList items={projects_achievements} />
        </Section>

        <Section title="Certifications">
          <BulletList items={certifications} />
        </Section>

        <Section title="Additional Information">
          <BulletList items={additional_info} />
        </Section>

        {optimization_notes ? (
          <Section title="Optimization Notes">
            <Text>{optimization_notes}</Text>
          </Section>
        ) : null}
      </Page>
    </Document>
  );
};

export default ResumePdfTemplate;
