/**
 * Site configuration constants
 */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://otherdev.com";

/**
 * Generate absolute URL from path
 */
export function absoluteUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  
  // Remove leading slash if present to avoid double slashes
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  return `${SITE_URL}/${cleanPath}`;
}

/**
 * Z-index values for consistent layering across the application
 */
export const Z_INDEX = {
  /** Navigation bar */
  navigation: 40,
  /** Chat widget button (bottom right) */
  chatButton: 50,
  /** Chat widget dialog */
  chatWidget: 60,
  /** Contact dialog */
  contactDialog: 70,
} as const;

/**
 * Suggested prompts for the chat widget
 */
export const SUGGESTED_PROMPTS = [
  {
    label: "What services does OtherDev offer?",
    prompt: "Provide a comprehensive overview of OtherDev's services and capabilities. Include:\n- Core service offerings (web development, design, e-commerce, etc.)\n- Industries and sectors you specialize in\n- Key differentiators and unique value propositions\n- Types of projects you typically handle\n- Technologies and methodologies used in service delivery\nFormat the response in a clear, structured way that's easy to understand for potential clients.",
  },
  {
    label: "Who are the founders and what's the company story?",
    prompt: "Tell me about OtherDev's founding story and the people behind the company. Please include:\n- Founders' names, backgrounds, and expertise\n- The inspiration and motivation for starting OtherDev\n- Company mission, vision, and core values\n- Key milestones and achievements since founding\n- Team culture and what makes OtherDev unique as an organization\nProvide a compelling narrative that showcases the human side of the business.",
  },
  {
    label: "What technologies do you use?",
    prompt: "Provide a detailed breakdown of OtherDev's technology stack and development approach. Include:\n- Frontend technologies and frameworks (React, Next.js, TypeScript, etc.)\n- Backend technologies and infrastructure\n- Design and prototyping tools\n- Development workflows and methodologies\n- Quality assurance and testing approaches\n- Deployment and DevOps practices\nExplain why these technologies were chosen and how they benefit clients' projects.",
  },
  {
    label: "Build a portfolio website",
    prompt: "Build me a complete, interactive portfolio website using React and Tailwind CSS. Create:\n- A stunning hero section with animated introduction and gradient backgrounds\n- An about section with animated skill cards\n- A projects showcase with interactive hover effects and modal previews\n- A working contact form with validation\n- Smooth scroll animations and modern transitions\n- Glass morphism effects and modern UI design\n- Fully responsive layout that works beautifully on all devices\nUse React from CDN with Babel standalone for JSX, and Tailwind CSS from CDN. Make it visually impressive and production-ready.",
  },
] as const;
