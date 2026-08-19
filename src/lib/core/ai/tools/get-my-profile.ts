import { tool } from "ai";
import { z } from "zod";
import { profileRepository } from "@/lib/infrastructure/repositories";
import { debugLog } from "@/lib/utils/debug";

export function createGetMyProfileTool(userId: string) {
  return tool({
    description:
      "Obter o perfil do usuário logado (skills, experiência, senioridade, formação).",
    inputSchema: z.object({}),
    execute: async () => {
      debugLog("[chat-tools] get_my_profile chamado");
      const profile = await profileRepository.findByUserId(userId);
      if (!profile)
        return { error: "Perfil não encontrado. Crie seu perfil primeiro." };
      return {
        skills: profile.skills,
        experienceYears: profile.experienceYears,
        seniority: profile.seniority,
        currentRole: profile.currentRole,
        area: profile.area,
        education: profile.education || [],
        profileSource: profile.profileSource || "manual",
        resumeMarkdown: profile.resumeMarkdown?.slice(0, 3000) || null,
      };
    },
  });
}
