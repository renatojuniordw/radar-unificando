export const SKILL_TAXONOMY: Record<string, string[]> = {
  database: [
    'sql', 'postgresql', 'mysql', 'sqlite', 'oracle', 'sql server', 'mongodb',
    'redis', 'cassandra', 'dynamodb', 'bigquery', 'redshift', 'snowflake',
    'elasticsearch', 'data warehouse', 'etl',
  ],
  programming: [
    'python', 'r', 'scala', 'java', 'javascript', 'typescript', 'ruby', 'go',
    'rust', 'c++', 'c#', 'shell', 'bash', 'julia', 'matlab',
  ],
  bi_tools: [
    'power bi', 'tableau', 'looker', 'metabase', 'qlik', 'microstrategy',
    'sisense', 'domo', 'superset', 'grafana',
  ],
  cloud: [
    'aws', 'azure', 'gcp', 'google cloud', 'amazon web services',
    'lambda', 's3', 'ec2', 'cloudformation', 'terraform', 'docker', 'kubernetes',
  ],
  data_engineering: [
    'spark', 'airflow', 'kafka', 'dbt', 'hadoop', 'hive', 'presto', 'trino',
    'databricks', 'data lake', 'data pipeline', 'streaming', 'dagster',
    'glue', 'emr', 'dataflow', 'pubsub',
  ],
  machine_learning: [
    'machine learning', 'deep learning', 'nlp', 'tensorflow', 'pytorch',
    'scikit-learn', 'xgboost', 'llm', 'ai', 'neural network', 'regression',
    'classification', 'clustering', 'recommendation', 'forecasting',
  ],
  analytics: [
    'google analytics', 'mixpanel', 'amplitude', 'heap', 'hotjar',
    'a/b testing', 'experimentation', 'funnel analysis', 'cohort analysis',
    'statistical analysis', 'hypothesis testing',
  ],
  product: [
    'product management', 'product owner', 'roadmap', 'backlog',
    'agile', 'scrum', 'kanban', 'jira', 'confluence', 'notion',
  ],
  soft_skills: [
    'communication', 'leadership', 'teamwork', 'problem solving',
    'critical thinking', 'stakeholder management', 'presentation',
    'storytelling', 'mentoring', 'cross-functional',
  ],
  domain: [
    'fintech', 'healthcare', 'e-commerce', 'logistics', 'education',
    'banking', 'insurance', 'retail', 'saas', 'marketplace',
  ],
};

export function findMatchingSkills(text: string): string[] {
  const lowered = text.toLowerCase();
  const found: string[] = [];

  for (const [category, skills] of Object.entries(SKILL_TAXONOMY)) {
    for (const skill of skills) {
      if (lowered.includes(skill)) {
        found.push(skill);
      }
    }
  }

  return [...new Set(found)];
}
