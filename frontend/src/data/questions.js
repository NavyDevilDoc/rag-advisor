export const STEPS = [
  {
    title: "Data Profile",
    subtitle: "Describe your document corpus",
    questions: [
      {
        id: "corpusSize",
        text: "How large is your document corpus?",
        options: [
          { value: "small",  label: "Small",  desc: "Under ~500 docs / 1M tokens total" },
          { value: "medium", label: "Medium", desc: "1M – 100M tokens" },
          { value: "large",  label: "Large",  desc: "100M+ tokens" },
        ],
      },
      {
        id: "corpusChurn",
        text: "How often does your corpus change?",
        options: [
          { value: "rare",     label: "Rarely",     desc: "Monthly updates or less" },
          { value: "regular",  label: "Regularly",  desc: "Weekly updates" },
          { value: "frequent", label: "Frequently", desc: "Daily or continuous ingestion" },
        ],
      },
      {
        id: "crossRefDensity",
        text: "How densely cross-referenced are your documents?",
        options: [
          { value: "low",    label: "Low",    desc: "Most documents are standalone" },
          { value: "medium", label: "Medium", desc: "Some cross-references exist" },
          { value: "high",   label: "High",   desc: "Heavily cross-referenced corpus" },
        ],
      },
      {
        id: "relationshipImportance",
        text: "Are typed entity relationships critical to your queries?",
        options: [
          { value: "none",     label: "Not Important", desc: "Semantic similarity is enough" },
          { value: "some",     label: "Somewhat",      desc: "Relationships matter in some cases" },
          { value: "critical", label: "Critical",      desc: "Who/what relates to what is essential" },
        ],
      },
    ],
  },
  {
    title: "Query Profile",
    subtitle: "Describe how users interact with the system",
    questions: [
      {
        id: "queryComplexity",
        text: "How complex are typical user queries?",
        options: [
          { value: "simple",   label: "Simple",   desc: "Direct factual lookups" },
          { value: "moderate", label: "Moderate", desc: "Synthesis across a few documents" },
          { value: "complex",  label: "Complex",  desc: "Open-ended multi-step research" },
        ],
      },
      {
        id: "multiHop",
        text: "How often do queries require multi-hop reasoning?",
        options: [
          { value: "rarely",     label: "Rarely",     desc: "Answer lives in one or two chunks" },
          { value: "sometimes",  label: "Sometimes",  desc: "Occasional chain-of-reference needed" },
          { value: "frequently", label: "Frequently", desc: "Most answers require connecting multiple sources" },
        ],
      },
      {
        id: "retrievalStrategy",
        text: "Is your retrieval strategy knowable at design time?",
        options: [
          { value: "known",   label: "Yes, always",   desc: "Same retrieval approach for all queries" },
          { value: "partial", label: "Partially",     desc: "Strategy varies but is bounded" },
          { value: "unknown", label: "No, it varies", desc: "Optimal strategy depends on each query" },
        ],
      },
      {
        id: "externalTools",
        text: "Do queries need external tools beyond document retrieval?",
        options: [
          { value: "none",       label: "None",         desc: "Documents only" },
          { value: "occasional", label: "Occasionally", desc: "Sometimes web search or SQL" },
          { value: "regular",    label: "Regularly",    desc: "Web, code, APIs are core to the use case" },
        ],
      },
    ],
  },
  {
    title: "Constraints",
    subtitle: "Define your operational boundaries",
    questions: [
      {
        id: "latency",
        text: "What response latency can users tolerate?",
        options: [
          { value: "realtime",    label: "Real-time",   desc: "Under 2 seconds" },
          { value: "interactive", label: "Interactive", desc: "2 – 8 seconds" },
          { value: "async",       label: "Async OK",    desc: "8+ seconds is acceptable" },
        ],
      },
      {
        id: "indexingCost",
        text: "What is your tolerance for one-time indexing cost?",
        options: [
          { value: "minimize", label: "Minimize", desc: "Keep indexing spend as low as possible" },
          { value: "moderate", label: "Moderate", desc: "Willing to invest for better retrieval" },
          { value: "flexible", label: "Flexible", desc: "Cost is not a constraint" },
        ],
      },
      {
        id: "queryCost",
        text: "What is your tolerance for per-query inference cost?",
        options: [
          { value: "minimize", label: "Minimize", desc: "Cost per query must stay low" },
          { value: "moderate", label: "Moderate", desc: "Moderate cost acceptable for quality" },
          { value: "flexible", label: "Flexible", desc: "Quality over cost" },
        ],
      },
      {
        id: "dataSensitivity",
        text: "How sensitive is your data?",
        options: [
          { value: "low",      label: "Low",      desc: "Public or internal non-sensitive" },
          { value: "moderate", label: "Moderate", desc: "Internal, some compliance concerns" },
          { value: "high",     label: "High",     desc: "Sensitive, classified, or air-gap required" },
        ],
      },
    ],
  },
];
