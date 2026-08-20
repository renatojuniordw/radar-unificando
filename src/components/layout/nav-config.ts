import {
  Search,
  GraduationCap,
  BookOpen,
  Puzzle,
  Info,
  Heart,
  LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string; // Compact label for desktop
  mobileLabel: string; // Full descriptive label for mobile drawer
  icon: LucideIcon;
  badge?: string;
  highlight?: boolean;
}

export const MAIN_NAV_ITEMS: NavItem[] = [
  {
    href: "/busca",
    label: "BUSCA",
    mobileLabel: "BUSCA DE VAGAS",
    icon: Search,
  },
  {
    href: "/cursos",
    label: "CURSOS",
    mobileLabel: "CURSOS RECOMENDADOS",
    icon: GraduationCap,
  },
  {
    href: "/dicas",
    label: "DICAS",
    mobileLabel: "DICAS & TUTORIAIS",
    icon: BookOpen,
  },
  {
    href: "/extensao",
    label: "EXTENSÃO",
    mobileLabel: "EXTENSÃO CHROME",
    icon: Puzzle,
    badge: "EM BREVE",
  },
  {
    href: "/sobre",
    label: "SOBRE",
    mobileLabel: "SOBRE O RADAR",
    icon: Info,
  },
  {
    href: "/doar",
    label: "APOIAR",
    mobileLabel: "APOIAR O PROJETO",
    icon: Heart,
    badge: "PIX",
    highlight: true,
  },
];
