/**
 * Single source of truth for the profile: home page, /cv page and the CV PDF.
 * Every fact must match ~/projects/profile_builder/drafts/00-facts.md.
 * The facts guard in tests/unit/profile-content.test.ts enforces the key claims.
 */

export type Role = {
  title: string;
  /** "YYYY-MM" */
  start: string;
  /** "YYYY-MM"; omitted means present */
  end?: string;
  summary?: string;
  /** Short label shown next to the title, e.g. "Promoted". */
  badge?: string;
  highlights: string[];
};

export type ExperienceEntry = {
  company: string;
  /** Omitted where the approved facts don't record one. */
  location?: string;
  type?: "Full-time" | "Freelance";
  /** Most recent first. */
  roles: Role[];
};

export type SkillGroup = { name: string; skills: string[] };

export type Certification = {
  name: string;
  issuer: string;
  issued: string;
  expires?: string;
  status: "current" | "past";
  url?: string;
};

export const hero = {
  name: "Jitin Gupta",
  role: "Applied AI Architect",
  statement:
    "I design AI systems that help investors see structural market shifts before prices reflect them.",
  focus:
    "Agentic AI systems · Quantitative forecasting · Technical product leadership",
  location: "Gurgaon, India",
};

export const about = {
  intro: [
    "As Applied AI Architect at CLOUDSUFI, I lead an AI-assisted research and forecasting platform built for a global hedge fund with ~$1B AUM, working closely with a globally recognized expert on technology-driven economic disruption.",
  ],
  whatIDo: [
    "Turn investment questions (how fast will EVs displace oil demand? what will AI datacenters do to copper? how far can AI substitute for human labor?) into causal models, scenarios and forecasts.",
    "Lead a portfolio of 12+ sector forecasting models across energy, transport, batteries, commodities, AI infrastructure and labor, built on cost curves, adoption S-curves, stock-flow dynamics and scenario analysis.",
    "Architect agentic AI workflows: how agents plan, retrieve context, call models and tools, verify results and synthesize answers, with provenance and evaluation built in.",
    "Set product and technical direction across a 15+ person team of AI/software engineers, research analysts and project management, translating research into specifications and engineering work.",
  ],
  howIGotHere:
    "I started in data science: student-outcome models at Vidyamandir Classes (20% lower dropout rates, ~2% MAPE on exam-score predictions), then quantitative trading research and backtesting at Share India Securities. Alongside and before that, I taught physics and led academic teams at Vidyamandir, as Head of Physics and later running academic operations for 50+ educators and 3,000+ students a year. That taught me to explain complex ideas simply, which is now a daily part of turning research into systems.",
};

/** Summary used at the top of the CV. */
export const cvSummary = [
  "Applied AI Architect who designs AI systems that help investors see structural market shifts before prices reflect them. Leads architecture and product direction for an AI-assisted research and forecasting platform built for a global hedge fund with ~$1B AUM, in close collaboration with a globally recognized expert on technology-driven economic disruption.",
  "Combines agentic AI system design with quantitative modelling: causal models, cost and adoption curves, stock-flow dynamics and scenario analysis across energy, transport, batteries, commodities, AI infrastructure and labor. Sets direction for a 15+ person cross-functional team.",
];

/** Main experience, most recent first. */
export const experience: ExperienceEntry[] = [
  {
    company: "CLOUDSUFI",
    location: "Noida",
    type: "Full-time",
    roles: [
      {
        title: "Applied AI Architect",
        start: "2025-07",
        badge: "Promoted",
        summary:
          "Lead architecture and product direction for an AI-assisted research and forecasting platform that identifies structural market inflection points (technology-driven phase changes) before they are reflected in market prices. Built for a global hedge fund with ~$1B AUM, in close collaboration with a globally recognized expert on technology-driven economic disruption.",
        highlights: [
          "Architect agentic AI research workflows, defining how agents plan, retrieve context, call quantitative models and tools, verify outputs and synthesize answers.",
          "Define interfaces and responsibility boundaries between AI agents, forecasting models, data systems and evaluation layers, with provenance, reproducibility and explainability as design requirements.",
          "Lead a portfolio of 12+ sector forecasting models across energy, transport, batteries, commodities, AI infrastructure and labor, structured around cost and capability curves, adoption S-curves, stock-flow dynamics and scenario analysis.",
          "Translate investment hypotheses into causal models, assumptions, datasets and forecast outputs that the research team can test and challenge.",
          "Set product and technical direction across a 15+ person cross-functional team of AI/software engineers, research analysts and project management; turn research needs into specifications and engineering work packages.",
        ],
      },
      {
        title: "Senior Software Engineer – Applied AI",
        start: "2024-10",
        end: "2025-06",
        summary:
          "Hands-on engineering on the early versions of the AI research and forecasting platform for the hedge-fund engagement.",
        highlights: [
          "Built LLM applications and prompt-chaining workflows that combined language models with quantitative forecasting models and research data.",
          "Developed and refined sector demand-forecasting models, turning domain hypotheses into data pipelines, model logic and scenario outputs.",
          "Worked directly with domain experts to turn research questions into model specifications and testable assumptions.",
          "Promoted to Applied AI Architect in July 2025.",
        ],
      },
    ],
  },
  {
    company: "Scaler",
    location: "Remote",
    type: "Freelance",
    roles: [
      {
        title: "Instructor – Data Science",
        start: "2023-08",
        end: "2024-10",
        highlights: [
          "Taught working professionals Python, NumPy, Pandas, probability, statistics, mathematics for ML, supervised and unsupervised learning, neural networks and MLOps.",
          "Mentored learners through hands-on problem solving, explaining quantitative and ML concepts to audiences with mixed technical backgrounds.",
        ],
      },
    ],
  },
  {
    company: "Share India Securities",
    location: "Gurgaon",
    type: "Full-time",
    roles: [
      {
        title: "Data Scientist – Algorithmic Trading",
        start: "2023-04",
        end: "2024-01",
        highlights: [
          "Researched quantitative trading strategies, including mean-reversion and machine-learning approaches, using historical OHLC market data and statistical methods.",
          "Built backtesting workflows that accounted for transaction costs, slippage, position sizing and entry/exit rules to test strategy robustness.",
          "Developed real-time trading workflows using market-data APIs and automated execution logic.",
          "Worked independently across the full cycle: research, data preparation, modeling, validation and implementation.",
        ],
      },
    ],
  },
  {
    company: "Vidyamandir Classes",
    location: "New Delhi",
    type: "Full-time",
    roles: [
      {
        title: "Data Scientist",
        start: "2020-04",
        end: "2023-03",
        highlights: [
          "Built machine-learning models to predict student dropout risk and JEE Main scores, combining academic and behavioral data to guide retention and intervention decisions.",
          "Delivered an end-to-end prediction pipeline: dropout rates fell 20% and score predictions reached ~2% MAPE (mean absolute percentage error).",
          "Designed KPIs and dashboards so academic and business teams could track engagement, outcomes and operational performance.",
          "Presented model results to non-technical leadership and teaching teams.",
        ],
      },
      {
        title: "Academic Operations Manager",
        start: "2020-04",
        end: "2022-01",
        highlights: [
          "Managed academic operations for 50+ educators serving 3,000+ students a year, and built training modules for 200+ employees across subjects and teaching methods.",
        ],
      },
    ],
  },
];

/** Older and side roles, shown collapsed under "Earlier roles". Most recent first. */
export const earlierExperience: ExperienceEntry[] = [
  {
    company: "Curate Partners",
    location: "Remote",
    type: "Freelance",
    roles: [
      {
        title: "Independent Consultant – Web Analytics",
        start: "2024-06",
        end: "2024-10",
        highlights: [
          "Set up Google Tag Manager, GA4 and Looker Studio dashboards for multiple client websites, and integrated Google Ads with GA4 for campaign measurement.",
        ],
      },
    ],
  },
  {
    company: "Vidyamandir Classes",
    location: "New Delhi",
    type: "Full-time",
    roles: [
      {
        title: "Head of Physics Department",
        start: "2017-04",
        end: "2020-04",
        highlights: [
          "Led the physics department's faculty, curriculum and academic planning for JEE preparation.",
        ],
      },
      {
        title: "Senior Faculty",
        start: "2016-05",
        end: "2017-04",
        highlights: ["Taught physics and mathematics to JEE aspirants."],
      },
    ],
  },
  {
    company: "FoxBox",
    type: "Full-time",
    roles: [
      {
        title: "Co-founder & Business Development Manager",
        start: "2015-01",
        end: "2016-01",
        highlights: [
          "Co-founded a B2B mobile platform that let retailers buy groceries from a single source; led business development.",
        ],
      },
    ],
  },
  {
    company: "Loqation",
    type: "Full-time",
    roles: [
      {
        title: "Digital Marketing Manager",
        start: "2014-01",
        end: "2015-01",
        highlights: [
          "Built the content strategy for a hyperlocal social network for neighborhood interactions, driving engagement on the platform.",
        ],
      },
    ],
  },
];

export const skillGroups: SkillGroup[] = [
  {
    name: "Applied AI & Agentic Systems",
    skills: [
      "LLM applications",
      "Agentic architectures",
      "Workflow orchestration",
      "Retrieval (RAG)",
      "Tool use",
      "AI evaluation",
      "Provenance",
      "Prompt engineering",
      "Anthropic Claude",
      "OpenAI APIs",
    ],
  },
  {
    name: "Quantitative Research & Forecasting",
    skills: [
      "Causal modelling",
      "Demand forecasting",
      "Scenario & sensitivity analysis",
      "Adoption S-curves",
      "Cost & capability curves",
      "Stock-flow modelling",
      "Time-series analysis",
      "Backtesting",
      "Investment research",
    ],
  },
  {
    name: "Product & Technical Leadership",
    skills: [
      "AI product strategy",
      "Research-to-engineering translation",
      "Technical specifications",
      "Systems design",
      "Engineering review",
      "Cross-functional leadership",
    ],
  },
  {
    name: "Engineering & Tools",
    skills: [
      "Python",
      "SQL",
      "Pandas",
      "NumPy",
      "scikit-learn",
      "PyTorch",
      "Git",
      "Docker",
      "REST APIs",
      "AWS",
      "Databricks",
    ],
  },
];

export const certifications: Certification[] = [
  {
    name: "Claude Certified Architect – Foundations",
    issuer: "Anthropic",
    issued: "2026-09",
    expires: "2027-09",
    status: "current",
    url: "https://www.credly.com/badges/438f7736-0400-48dd-9361-f5be835dc558",
  },
  {
    name: "Databricks Certified Machine Learning Professional",
    issuer: "Databricks",
    issued: "2024-09",
    expires: "2026-09",
    status: "past",
  },
];

export const education = [
  {
    institution: "Indian Institute of Technology Delhi",
    degree: "B.Tech., Civil Engineering",
    years: "2007 – 2011",
  },
];

export const training = [
  "Advanced Data Science and Machine Learning, Scaler Academy",
];
