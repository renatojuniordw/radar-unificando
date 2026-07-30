import { pipeline } from '@xenova/transformers';
import type { CandidateProfile } from '@/lib/core/matching/types';

export class SkillExtractor {
  private static instance: SkillExtractor;
  private extractor: any = null;
  private loading = false;

  static getInstance(): SkillExtractor {
    if (!SkillExtractor.instance) {
      SkillExtractor.instance = new SkillExtractor();
    }
    return SkillExtractor.instance;
  }

  async loadModel(): Promise<void> {
    if (this.extractor || this.loading) return;
    this.loading = true;
    try {
      this.extractor = await pipeline('token-classification', 'Xenova/bert-base-NER');
    } finally {
      this.loading = false;
    }
  }

  async extractSkills(text: string): Promise<{
    skills: string[];
    experience: number | null;
    seniority: string | null;
    education: string[];
  }> {
    const skillsFromTaxonomy = this.extractByTaxonomy(text);
    const nerEntities = await this.extractByNER(text);
    const skills = [...new Set([...skillsFromTaxonomy, ...nerEntities])];

    return {
      skills,
      experience: this.extractExperience(text),
      seniority: this.extractSeniority(text),
      education: this.extractEducation(text),
    };
  }

  private async extractByNER(text: string): Promise<string[]> {
    try {
      await this.loadModel();
      if (!this.extractor) return [];

      const result = await this.extractor(text);
      const entities = (result as Array<{ entity_group: string; word: string; score: number }>)
        .filter((e: any) => e.score > 0.7 && e.entity_group === 'MISC')
        .map((e: any) => e.word);

      return entities;
    } catch {
      return [];
    }
  }

  private extractByTaxonomy(text: string): string[] {
    const lower = text.toLowerCase();
    const taxonomy: Record<string, string[]> = {
      database: ['sql', 'postgresql', 'mysql', 'sqlite', 'mongodb', 'redis', 'bigquery', 'redshift', 'snowflake', 'databricks'],
      programming: ['python', 'r', 'scala', 'java', 'javascript', 'typescript', 'bash', 'shell', 'julia', 'go', 'rust'],
      bi_tools: ['power bi', 'tableau', 'looker', 'metabase', 'qlik', 'sisense', 'microstrategy', 'cognos'],
      cloud: ['aws', 'azure', 'gcp', 'google cloud', 'amazon s3', 'lambda', 'glue', 'athena', 'emr'],
      data_engineering: ['airflow', 'dbt', 'spark', 'kafka', 'hadoop', 'hive', 'presto', 'trino', 'dagster', 'prefect', 'nifi'],
      machine_learning: ['machine learning', 'deep learning', 'nlp', 'llm', 'gpt', 'transformers', 'tensorflow', 'pytorch', 'scikit-learn', 'xgboost', 'lightgbm'],
      analytics: ['excel', 'google sheets', 'vba', 'pandas', 'numpy', 'matplotlib', 'seaborn', 'plotly', 'statistics', 'ab testing', 'experimentation'],
      product: ['product management', 'roadmap', 'agile', 'scrum', 'kanban', 'jira', 'confluence', 'notion', 'figma', 'miro'],
    };

    const found: string[] = [];
    for (const [, skills] of Object.entries(taxonomy)) {
      for (const skill of skills) {
        if (lower.includes(skill) && !found.includes(skill)) {
          found.push(skill);
        }
      }
    }

    return this.extractFromBullets(text, found);
  }

  private extractFromBullets(text: string, taxonomySkills: string[]): string[] {
    const lines = text.split('\n');
    const bulletLines = lines.filter(l =>
      /^[\s]*[-•*→▶]/.test(l) || /^[\s]*\d+[.)]/.test(l)
    );

    const bulletWords = bulletLines
      .flatMap(l => l.split(/[,;/]/))
      .map(w => w.replace(/^[\s\-•*→▶\d.)]+/, '').trim().toLowerCase())
      .filter(w => w.length > 1 && w.length < 60);

    const allWords = [...bulletWords, ...lines.map(l => l.trim().toLowerCase())];

    const knownPatterns = [
      'sql', 'python', 'power bi', 'tableau', 'looker', 'excel', 'r', 'spark',
      'airflow', 'dbt', 'aws', 'azure', 'gcp', 'mongodb', 'redis', 'kafka',
      'hadoop', 'spark', 'java', 'javascript', 'typescript', 'scala', 'bash',
      'shell', 'git', 'docker', 'kubernetes', 'terraform', 'linux',
      'machine learning', 'deep learning', 'nlp', 'tensorflow', 'pytorch',
      'scikit-learn', 'pandas', 'numpy', 'matplotlib', 'seaborn', 'plotly',
      'statistics', 'ab testing', 'data analysis', 'data modeling', 'etl',
      'data warehouse', 'data lake', 'bigquery', 'redshift', 'snowflake',
      'databricks', 'looker', 'metabase', 'qlik',
      'product management', 'agile', 'scrum', 'kanban', 'jira', 'confluence',
      'figma', 'notion', 'airflow', 'dbt', 'prefect', 'dagster',
      'kafka', 'pyspark', 'delta lake', 'lakehouse', 'medallion',
      'business intelligence', 'business analytics', 'data governance',
      'data quality', 'data catalog', 'data lineage',
    ];

    const found = [...taxonomySkills];
    for (const pattern of knownPatterns) {
      const hasMatch = allWords.some(w => {
        if (w === pattern) return true;
        if (w.includes(pattern) && (w.length - pattern.length) <= 3) return true;
        return false;
      });

      if (hasMatch && !found.includes(pattern)) {
        found.push(pattern);
      }
    }

    return [...new Set(found)];
  }

  private extractExperience(text: string): number | null {
    const patterns = [
      /(\d+)[+]?\s*(anos?\s*de\s*)?experiência/i,
      /(\d+)[+]?\s*(years?\s*of\s*)?experience/i,
      /experience[:\s]+(\d+)[+]?\s*(anos?|years?)/i,
      /experiência[:\s]+(\d+)[+]?\s*(anos?)/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const years = parseInt(match[1], 10);
        if (years >= 0 && years <= 40) return years;
      }
    }

    return null;
  }

  private extractSeniority(text: string): string | null {
    const lower = text.toLowerCase();
    const levels = [
      { words: ['junior', 'jr', 'júnior', 'trainee', 'estagiário', 'intern'], value: 'junior' },
      { words: ['pleno', 'mid', 'mid-level', 'middle'], value: 'pleno' },
      { words: ['senior', 'sr', 'sênior', 'senior'], value: 'senior' },
      { words: ['lead', 'tech lead', 'líder'], value: 'lead' },
      { words: ['manager', 'gerente', 'coordenador', 'coordenadora'], value: 'manager' },
      { words: ['head', 'director', 'diretora', 'diretor'], value: 'head' },
    ];

    for (const level of levels) {
      if (level.words.some(w => lower.includes(w))) {
        return level.value;
      }
    }

    return null;
  }

  private extractEducation(text: string): string[] {
    const lower = text.toLowerCase();
    const found: string[] = [];
    const patterns: Array<{ pattern: RegExp; label: string }> = [
      { pattern: /estatística|statistics/i, label: 'Statistics' },
      { pattern: /ciência de dados|data science/i, label: 'Data Science' },
      { pattern: /ciência da computação|computer science|ciencia da computacao/i, label: 'Computer Science' },
      { pattern: /engenharia|engineering/i, label: 'Engineering' },
      { pattern: /matemática|mathematics|math/i, label: 'Mathematics' },
      { pattern: /economia|economics/i, label: 'Economics' },
      { pattern: /administração|business administration|administration/i, label: 'Business Administration' },
      { pattern: /análise de sistemas|systems analysis/i, label: 'Systems Analysis' },
    ];

    for (const { pattern, label } of patterns) {
      if (pattern.test(lower)) {
        found.push(label);
      }
    }

    return [...new Set(found)];
  }
}

export async function extractSkillsFromResume(text: string): Promise<{
  skills: string[];
  experience: number | null;
  seniority: string | null;
  education: string[];
}> {
  const extractor = SkillExtractor.getInstance();
  return extractor.extractSkills(text);
}
