import { FlowDiagram } from "@/components/diagrams/flow-diagram";

export function BacktestPipeline() {
  return (
    <FlowDiagram
      caption="From a strategy idea to a live workflow. Each stage could reject an idea before it reached real money."
      steps={[
        {
          title: "Market data",
          detail: "Historical OHLC data, cleaned and aligned.",
        },
        {
          title: "Signal research",
          detail:
            "Statistical and machine-learning ideas, e.g. mean reversion.",
        },
        {
          title: "Execution model",
          detail:
            "Transaction costs and slippage applied to every simulated trade.",
        },
        {
          title: "Sizing & rules",
          detail: "Position sizing plus explicit entry and exit rules.",
        },
        {
          title: "Robustness checks",
          detail:
            "Does the idea survive realistic costs and different periods?",
        },
        {
          title: "Live workflow",
          detail: "Market-data APIs and automated execution logic.",
        },
      ]}
    />
  );
}
