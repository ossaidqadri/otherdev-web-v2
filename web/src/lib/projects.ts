export interface Project {
  id: string;
  title: string;
  slug: string;
  image: string;
  description: string;
  url?: string;
  media?: string[];
  year: number;
  downloadUrl?: string;
}

export const projects: Project[] = [
  {
    id: "1",
    title: "SEO Implementation & Technical Optimization for Narkins Builders",
    slug: "narkins-seo-2025",
    image:
      "/images/projects/narkins-seo-2025/www.narkinsbuilders.com_blog_standard_size.webp",
    description:
      "Comprehensive SEO transformation for Narkins Builders featuring technical optimization, schema markup, and MDX blog migration. Achieved 30% traffic improvement and elevated their rankings to compete with industry giants in Pakistan's real estate market.",
    url: "narkinsbuilders.com/blog",
    media: [
      "/images/projects/narkins-seo-2025/www.narkinsbuilders.com_blog_standard_size.webp",
      "/images/projects/narkins-seo-2025/narkins_graphs_beauty.webp",
      "/images/projects/narkins-seo-2025/www.narkinsbuilders.com_blog_2025_10_thar-water-supply-project-october-2025-nabisar-vajihar-completion.webp",
      "/images/projects/narkins-seo-2025/www.narkinsbuilders.com_blog_comments.webp",
    ],
    year: 2025,
  },
  {
    id: "2",
    title: "Real Estate Platform Development for Bin Yousuf Group",
    slug: "bin-yousuf-2025",
    image:
      "/images/projects/bin-yousuf-2025/www.binyousufgroup.com_projects_panorama_standard_size.webp",
    description:
      "Sophisticated real estate platform for Bin Yousuf Group showcasing premium waterfront properties in Karachi. Features interactive galleries, Google Sheets lead integration, and optimized UX for Emaar Oceanfront and HMR Waterfront luxury investments.",
    url: "binyousufgroup.com",
    media: [
      "/images/projects/bin-yousuf-2025/www.binyousufgroup.com_projects_panorama_standard_size.webp",
      "/images/projects/bin-yousuf-2025/byg-property-showcase.webp",
      "/images/projects/bin-yousuf-2025/luxury-apartments-karachi.webp",
      "/images/projects/bin-yousuf-2025/byg-logo-brand.webp",
    ],
    year: 2025,
  },
  {
    id: "3",
    title: "AI Legal Assistant Platform Development for Lexa",
    slug: "lexa-2025",
    image: "/images/projects/lexa-2025/home.webp",
    description:
      "Intelligent AI legal assistant platform for law firms and SMEs featuring real-time contract analysis and automated document generation. Combines advanced NLP with collaborative editing for legal professionals across Asia and the Middle East.",
    url: "lexa.deployments.otherdev.com",
    media: [
      "/images/projects/lexa-2025/home.webp",
      "/images/projects/lexa-2025/auth.webp",
      "/images/projects/lexa-2025/lexa-ai.webp",
      "/images/projects/lexa-2025/lexa-templates.webp",
      "/images/projects/lexa-2025/template-preview.webp",
      "/images/projects/lexa-2025/signing-desktop.webp",
      "/images/projects/lexa-2025/subscription-modal.webp",
    ],
    year: 2025,
  },
  {
    id: "4",
    title: "E-commerce Platform for Olly Shinder",
    slug: "olly-shinder-2025",
    image: "/images/projects/olly-2025/products-page-desktop.webp",
    description:
      "Olly Shinder is a menswear designer from London, part of the Fashion East and Dover Street Market incubators. We designed and developed a minimal, grid-based platform to unify his collections and e-commerce content.",
    url: "olly-shinder.com",
    media: [
      "/images/projects/olly-2025/products-page-desktop.webp",
      "/images/projects/olly-2025/product-page-2.webp",
      "/images/projects/olly-2025/olly-shinder-product-page.webp",
    ],
    year: 2025,
  },
  {
    id: "5",
    title: "Branding & website development for Wish",
    slug: "wish-2024",
    image: "/images/projects/wish-2024/wishapparels.com_.webp",
    description:
      "Complete branding and e-commerce platform for Wish Apparels showcasing their clothing line with high-quality visuals. Intuitive design with seamless shopping experience that communicates the brand's ethos and drives customer engagement.",
    url: "wishapparels.com",
    media: [
      "/images/projects/wish-2024/upper-slideshow-1.webp",
      "/images/projects/wish-2024/1743813808292_100.webp",
      "/images/projects/wish-2024/wish-girl-11.webp",
      "/images/projects/wish-2024/wish-boy-1.webp",
      "/images/projects/wish-2024/wish-logo.webp",
      "/images/projects/wish-2024/with-other-dev.webp",
    ],
    year: 2024,
  },
  {
    id: "6",
    title: "Website infrastructure creation for Narkins Builders",
    slug: "narkins-2024",
    image: "/images/projects/narkins-2024/narkinsbuilders.com_.webp",
    description:
      "Robust website infrastructure for Narkins Builders showcasing their construction portfolio and services. User-friendly platform designed to facilitate client inquiries and enhance digital communication with stakeholders.",
    url: "narkinsbuilders.com",
    media: [
      "/images/projects/narkins-2024/narkins-collage.webp",
      "/images/projects/narkins-2024/1743813250549_100.webp",
      "/images/projects/narkins-2024/hcr_new.webp",
    ],
    year: 2024,
  },
  {
    id: "7",
    title: "Branding & SaaS Platform Development for Finlit",
    slug: "finlit-2025",
    image: "/images/projects/finlit-2025/finlit-desktop-standard-ratio.webp",
    description:
      "Comprehensive SaaS platform development for Finlit including branding, visual identity, and full-stack learning application. Minimalist design that empowers users to confidently navigate the world of finance.",
    url: "finlit.deployments.otherdev.com",
    media: [
      "/images/projects/finlit-2025/finlit-group.webp",
      "/images/projects/finlit-2025/finlit-home-mobile.webp",
      "/images/projects/finlit-2025/finlit-courses-macbook.webp",
      "/images/projects/finlit-2025/finlit-logo.webp",
      "/images/projects/finlit-2025/finlit.deployments.otherdev.com_trading_1x1.webp",
    ],
    year: 2025,
  },
  {
    id: "8",
    title: "Website Development for Groovy Pakistan",
    slug: "groovy-pakistan-2024",
    image:
      "/images/projects/groovy-pakistan-2024/groovypakistan.com-standard-size.webp",
    description:
      "Strategic e-commerce website development for Groovy Pakistan mirroring the brand's dynamic spirit. Straightforward and engaging digital space that provides an intuitive pathway for customers to explore and purchase products.",
    media: [
      "/images/projects/groovy-pakistan-2024/groovy-group.webp",
      "/images/projects/groovy-pakistan-2024/groovy-home-mobile.webp",
      "/images/projects/groovy-pakistan-2024/groovy-layers.webp",
      "/images/projects/groovy-pakistan-2024/shirts-cropped.webp",
    ],
    year: 2024,
  },
  {
    id: "9",
    title: "Branding & website development for Parcheh81",
    slug: "parcheh81-2024",
    image: "/images/projects/parcheh81-2024/Parcheh.nyc_collections_all.webp",
    description:
      "Tailored e-commerce platform for Parcheh translating the texture and artistry of their textiles into digital experience. Elegant and intuitive design offering an immersive journey into the brand's world of premium fabrics.",
    url: "parcheh81.com",
    media: [
      "/images/projects/parcheh81-2024/parcheh-home-mobile.webp",
      "/images/projects/parcheh81-2024/parcheh-menu-mobile.webp",
      "/images/projects/parcheh81-2024/parcheh-logo-gridded.webp",
      "/images/projects/parcheh81-2024/girl-standing-square.webp",
    ],
    year: 2024,
  },
  {
    id: "10",
    title: "Payment infrastructure migration for Tiny-Footprint Coffee",
    slug: "tinyfootprintcoffee",
    image:
      "/images/projects/tinyfootprintcoffee/www.tinyfootprintcoffee.com_.webp",
    description:
      "Strategic subscription migration from Recharge to Shopify Payments for Tiny Footprint Coffee, the world's first carbon-negative coffee company. Seamless transition with data integrity ensuring uninterrupted service for their mission-supporting subscribers.",
    url: "tinyfootprintcoffee.com",
    media: [
      "/images/projects/tinyfootprintcoffee/www.tinyfootprintcoffee.com_.webp",
      "/images/projects/tinyfootprintcoffee/Mexico_808b95c1-9643-49c2-a054-eaf2bc2cf8f9.webp",
    ],
    year: 2024,
  },
  {
    id: "11",
    title: "Website Development for Cultured Legacy",
    slug: "cultured-legacy-2024",
    image: "/images/projects/cultured-legacy-2024/culturedlegacy-home.webp",
    description:
      "Strategic e-commerce website development for Cultured Legacy that honors the brand's refined heritage. A sophisticated yet accessible digital space that guides customers through a curated journey of exploration and discovery.",
    url: "culturedlegacy.shop",
    media: [
      "/images/projects/cultured-legacy-2024/culturedlegacy-home.webp",
      "/images/projects/cultured-legacy-2024/culturedlegacy-mobile.webp",
    ],
    year: 2024,
  },
  {
    id: "12",
    title: "Enterprise infrastructure development for Ek Qadam Aur",
    slug: "ekqadamaur-2024",
    image: "/images/projects/eqa-2024/www.ekqadamaur.org_.webp",
    description:
      "Long-term technical partnership serving as the core technology team for Ek Qadam Aur NGO. Comprehensive end-to-end management including website design, development, hosting infrastructure, and ongoing technical support. From inception to present day, we've been their dedicated technology partner, ensuring seamless digital operations for their social impact initiatives.",
    url: "ekqadamaur.org",
    media: [
      "/images/projects/eqa-2024/www.ekqadamaur.org_.webp",
      "/images/projects/eqa-2024/ekqadamaur.webp",
    ],
    year: 2024,
  },
  {
    id: "13",
    title: "Enterprise infrastructure development for NTL Exchange",
    slug: "ntl-2024",
    image: "/images/projects/ntl-trading-2024/ntl-home.webp",
    description:
      "Comprehensive digital transformation for NTL Exchange, encompassing complete brand identity creation, custom mobile application development for seamless on-the-go trading, responsive website design and development, and robust enterprise infrastructure solutions. A unified ecosystem that delivers secure, efficient, and user-friendly exchange services across all platforms.",
    url: "www.ntlex.com",
    media: [
      "/images/projects/ntl-trading-2024/ntl-home.webp",
      "/images/projects/ntl-trading-2024/ntl-mobile.webp",
    ],
    year: 2024,
  },
  {
    id: "14",
    title: "Branding & website development for Boulevard Pakistan",
    slug: "blvd-pakistan-2025",
    image: "/images/projects/boulevard-2025/blvdretail-home.webp",
    description:
      "Boulevard Pakistan is a contemporary Pakistani menswear brand, rooted in local culture and refined with a global design sensibility. The brand collaborates with select international and regional retail partners while building a strong direct presence of its own. Since 2021, Other Dev has worked closely with Boulevard Pakistan, shaping its digital identity and supporting the brand through art direction, marketing strategy, and ongoing brand consultation.",
    url: "www.blvdretail.co",
    media: [
      "/images/projects/boulevard-2025/blvdretail-home.webp",
      "/images/projects/boulevard-2025/blvdretail-product-page.webp",
      "/images/projects/boulevard-2025/blvdretail-product-page-mobile.webp",
    ],
    year: 2025,
  },
  {
    id: "15",
    title: "Branding & website development for Kiswa Noire",
    slug: "kiswanoire-2025",
    image: "/images/projects/kiswanoire-2025/kiswanoire-home.webp",
    description:
      "Kiswa Noire is a contemporary fashion label with a distinct, avant-garde aesthetic rooted in refined craftsmanship and dark elegance. We developed a minimal, interactive digital presence for the brand to express its identity, focusing on visual storytelling, clarity, and an elevated user experience tailored to its creative direction.",
    url: "kiswanoire.com",
    media: [
      "/images/projects/kiswanoire-2025/kiswanoire-home.webp",
      "/images/projects/kiswanoire-2025/kiswanoire-collections.webp",
      "/images/projects/kiswanoire-2025/kiswanoire-product.webp",
      "/images/projects/kiswanoire-2025/kiswanoire-collections-mobile.webp",
      "/images/projects/kiswanoire-2025/kiswanoire-product-mobile.webp",
      "/images/projects/kiswanoire-2025/kiswanoire-product-mobile-2.webp",
    ],
    year: 2025,
  },
  {
    id: "16",
    title: "Ads Portfolio & Creative Design",
    slug: "ads-portfolio",
    image: "/images/projects/ads-portfolio/ads-portfolio-14.webp",
    description:
      "A curated collection of digital advertisements and creative designs. This portfolio showcases our expertise in visual storytelling, brand engagement, and high-impact social media assets designed to drive conversions and brand awareness across multiple platforms.",
    media: [
      "/images/projects/ads-portfolio/ads-portfolio-14.webp",
      "/images/projects/ads-portfolio/ads-portfolio-17.webp",
      "/images/projects/ads-portfolio/ads-portfolio-21.webp",
    ],
    year: 2026,
    downloadUrl: "/images/projects/ads-portfolio/OD Ads Digital Issue.pdf",
  },
  {
    id: "17",
    title: "Adina Household",
    slug: "adinahousehold",
    image: "/images/projects/adina-household-2026/adinahousehold-1.webp",
    description:
      "A sophisticated e-commerce platform for Adina Household, showcasing premium ceramic tableware and dinnerware collections. The website features an elegant design that highlights the craftsmanship and quality of their fine china and decorative ceramic pieces.",
    url: "adinahousehold.com",
    media: [
      "/images/projects/adina-household-2026/adinahousehold-1.webp",
      "/images/projects/adina-household-2026/adinahousehold-2.webp",
      "/images/projects/adina-household-2026/adinahousehold-3.webp",
      "/images/projects/adina-household-2026/adinahousehold-4.webp",
      "/images/projects/adina-household-2026/adinahousehold-5.webp",
      "/images/projects/adina-household-2026/adinahousehold-6.webp",
      "/images/projects/adina-household-2026/adinahousehold-7.webp",
    ],
    year: 2026,
  },
];