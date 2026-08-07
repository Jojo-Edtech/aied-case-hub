# AIED Case Hub Design Contract

| Field | Decision |
| --- | --- |
| Screen job | Help a Hong Kong teacher turn one teaching goal into an AI-supported interdisciplinary lesson, then find evidence-backed cases, resources and prompts. |
| Primary user and action | Primary and secondary teachers; create a copy-ready lesson structure from two subjects, one learner level, a duration, an AI role and an authentic question. |
| Content hierarchy | Teacher workspace first, real library coverage second, recommended verified Hong Kong cases third, full searchable libraries after that. |
| Navigation and controls | Persistent desktop sidebar; five-item mobile bottom navigation; AI assistant as a separate mobile header action; filters remain collapsible on small screens. |
| Visual language | Soft lavender-gray canvas, white working surfaces, restrained blue/cyan/mint/coral data accents, compact type, 8px maximum card radius and subtle elevation. |
| Required states | Data loading, empty recommendations, incomplete course form, generated course plan, disabled copy action, link/data errors and assistant disconnected state. |
| Responsive behavior | Desktop uses a sidebar and 12-column workspace. Mobile uses horizontal metric and insight carousels, a two-column compact planner and a collapsible generated result. |
| Evidence used | User-provided project-management dashboard reference for hierarchy, pale surfaces, compact charts and mobile/desktop coexistence; current repository data and teacher workflows for product language. |
| Forbidden defaults | No marketing hero, fake KPI data, decorative gradients, nested card stacks, oversized headings, inert controls or endless single-column mobile stacking. |
| Acceptance criteria | Real CSV data powers both charts and recommendations; course plan can be generated and copied; all six primary views work; no horizontal viewport overflow at 320-1920px; keyboard focus is visible; browser console has no application errors. |

## Visualization Contract

- Analytical question: where does the library already have classroom evidence, and which learner levels have the strongest coverage?
- Takeaway: teachers can see strong and thin areas before choosing source material.
- Chart choices: sorted horizontal bar for five long subject-area labels; doughnut for a small, mutually exclusive high-level learner composition.
- Data: `data/cases.csv`; no synthetic values.
- Palette: blue, cyan, lavender, mint and coral; labels and tooltips provide non-color identification.
- Runtime: local vendored Chart.js so the charts do not depend on a public CDN.
