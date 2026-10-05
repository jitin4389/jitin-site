export const meta = {
  name: "series-minor-fixes",
  description: "Apply evaluator minor fixes to the 7 new series articles",
  phases: [{ title: "Fix", detail: "one fixer per article" }],
};
phase("Fix");
const results = await parallel(
  args.items.map(
    (it) => () =>
      agent(
        `You are the copy-fixer for an article on Jitin Gupta's site. Repo: ${args.repo}.
Files: ${args.repo}/src/content/writing/${it.slug}.md (plain Markdown, no JSX) and its sidecar ${args.repo}/docs/editorial/${it.slug}.meta.json.
Apply each of these evaluator issues (all minor). Make the smallest edit that resolves each; where an issue is optional, apply it only if it improves accuracy. Re-check any Claude Code fact you change against current official docs (code.claude.com). Keep British spelling, voice, structure and length. Do not add numbers or names. Never write any term from ${args.repo}/.confidential-terms.
Issues:
${it.issues.map((x, i) => `${i + 1}. [${x.location}] ${x.problem} -> FIX: ${x.fix}`).join("\n")}
After editing, syntax-check any code block you touched (python3 -m py_compile / bash -n / json.tool / YAML parse). Return a numbered list: issue number, applied or skipped, one-line reason.`,
        { label: `fix:${it.slug}`, phase: "Fix" },
      ),
  ),
);
return results.map((r, i) => ({ slug: args.items[i].slug, report: r }));
