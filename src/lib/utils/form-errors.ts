export function zodFieldErrors(error: {
  issues: { path: (string | number | symbol)[]; message: string }[];
}): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const field = issue.path[0] as string;
    if (field && !fieldErrors[field]) fieldErrors[field] = issue.message;
  }
  return fieldErrors;
}
