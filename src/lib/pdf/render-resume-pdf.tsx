import { renderToBuffer } from '@react-pdf/renderer';
import { ResumePdfDocument } from './resume-pdf';
import type { AdaptedResume } from '@/lib/core/ai/resume-adaptation-generator';

export async function renderResumePdf(resume: AdaptedResume): Promise<Buffer> {
  return renderToBuffer(<ResumePdfDocument resume={resume} />);
}