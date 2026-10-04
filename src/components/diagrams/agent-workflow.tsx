import { FlowDiagram } from "@/components/diagrams/flow-diagram";

export function AgentWorkflow() {
  return (
    <FlowDiagram
      caption="How a research question becomes a traceable answer. Generic view; component names are illustrative."
      steps={[
        {
          title: "Question",
          detail: "An analyst asks about a technology, sector or commodity.",
        },
        {
          title: "Understand & route",
          detail:
            "Rewrite the question, detect the sectors involved, ask for clarification if needed.",
        },
        {
          title: "Plan",
          detail: "Decide which data, reports and models the answer needs.",
        },
        {
          title: "Retrieve context",
          detail:
            "Knowledge graph, curated datasets and pre-computed research.",
        },
        {
          title: "Run models",
          detail:
            "Specialist agents call sandboxed forecasting models; the AI never does the maths itself.",
        },
        {
          title: "Evaluate",
          detail:
            "A reviewer agent checks the draft against the framework and the data.",
        },
        {
          title: "Answer with citations",
          detail: "Every number links to its source, model or assumption.",
        },
      ]}
      loop="If the reviewer finds a major issue, the answer goes back for another pass (with a capped number of retries)."
      lane={{
        title: "Provenance throughout",
        detail:
          "Numbers are tagged as observed or model-derived and carried with their source, so analysts can challenge any figure.",
      }}
    />
  );
}
