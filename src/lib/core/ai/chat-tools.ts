import { createSearchJobsTool } from "@/lib/core/ai/tools/search-jobs";
import { createGetMyProfileTool } from "@/lib/core/ai/tools/get-my-profile";
import { createAnalyzeAtsScoreTool } from "@/lib/core/ai/tools/analyze-ats-score";
import { createAnalyzeJobFitTool } from "@/lib/core/ai/tools/analyze-job-fit";
import { createCompareJobsTool } from "@/lib/core/ai/tools/compare-jobs";
import { createGenerateCoverLetterTool } from "@/lib/core/ai/tools/generate-cover-letter";
import { createGenerateResumeTool } from "@/lib/core/ai/tools/generate-resume";
import { createGetInterviewQuestionsTool } from "@/lib/core/ai/tools/get-interview-questions";
import { createRecommendCoursesTool } from "@/lib/core/ai/tools/recommend-courses";

export { formatJobResult, type JobLike } from "@/lib/core/ai/tools/shared";

export function createChatTools(userId: string) {
  return {
    search_jobs: createSearchJobsTool(userId),
    get_my_profile: createGetMyProfileTool(userId),
    analyze_ats_score: createAnalyzeAtsScoreTool(userId),
    analyze_job_fit: createAnalyzeJobFitTool(userId),
    compare_jobs: createCompareJobsTool(userId),
    generate_cover_letter: createGenerateCoverLetterTool(userId),
    generate_resume: createGenerateResumeTool(userId),
    get_interview_questions: createGetInterviewQuestionsTool(userId),
    recommend_courses: createRecommendCoursesTool(userId),
  };
}
