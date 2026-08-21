import { toScriptJson } from '@/lib/core/seo/jsonld';

export interface CourseListItem {
  title: string;
  description: string;
  url: string;
  providerName: string;
  providerUrl: string;
}

export function CourseListSchema({ courses }: { courses: CourseListItem[] }) {
  if (!courses || courses.length === 0) return null;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: courses.map((course, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Course',
        name: course.title,
        description: course.description,
        url: course.url,
        provider: {
          '@type': 'Organization',
          name: course.providerName,
          sameAs: course.providerUrl,
        },
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: toScriptJson(schema) }}
    />
  );
}
