# Dealer360 data dictionary

Everything here is **simulated** by `scripts/generate-data.ts` (seeded, deterministic; `npm run generate-data` rebuilds all files). No figure in the UI is typed in by hand: the UI only reads these files.

## How the simulation chains together
1. **Dealer state** (dimension scores, complaint rate, stock ageing, trend) is sampled for 150 dealers and for 2,500 simulated "historical" dealer profiles.
2. **Weights**: a hidden true weighting generates a 12-month performance index for the history. A non-negative regression recovers the weights, and 150 bootstrap resamples give the confidence range. Health = weighted sum of the five dimension scores.
3. **Risk**: a logistic regression trained on the simulated history predicts the probability of becoming At-Risk within 90 days. Priority = Risk x Business Impact x Controllability, bucketed by score cut-offs.
4. **Salespeople**: competencies drive conversion (and complaint rate); a dealer's conversion is the unit-weighted mean of its team; the sales funnel is built to match.
5. **Complaints**: counts come from salesperson complaint rates (weak competency -> matching theme) plus dealer-level service/communication complaints. Dates skew recent for declining dealers; some complaints trigger repeats.
6. **Recovery**: every complaint walks six workflow stages with drop-off probabilities and elapsed times that depend on dealer health, severity and speed. The funnel, recovery rate and resolution time are measured from this.
7. **Pitch sessions**: nine minutes per salesperson, each minute testing one skill. Drops are minutes that fall 8+ points. Practice attempts follow a diminishing-returns curve; the conversion effect is recomputed from improved competencies.
8. **Interventions**: 300 treated and 300 control cases. Treated effects depend on whether the intervention matches the dealer's driver. The learning matrix and difference-in-differences are computed from these.
9. **Per-dealer insights** (for the intervention queue): diagnosis, 90-day plan and projected outcome, all derived from the dealer's own numbers and the learning matrix.
10. **Demo personas**: the top-ranked P1/P2 dealer with a flagged salesperson showing 2+ pitch drops is named **ABC Motors**, and that salesperson **Rahul Sharma**. Only names are assigned; all their numbers are simulated.

## Files
- **dealers.json (150)**: id, name, region, city, tier, health, healthExpert, status (Healthy >= 72, Watch 65-71, At-Risk < 65), risk, trendPerQuarter, dims {sales, csat, service, inventory, compliance}, businessImpact, controllability, priorityScore, rank, priority (P1/P2/P3/Monitor), driver, driverNarrative, unitsPerMonth, regionalPercentile, kpis {...}, funnel {leads, testDrives, quotes, orders, deliveries per quarter}.
- **dealer_monthly_metrics.json (3,600)**: dealerId x 24 months of health, units, conversion, CSI, complaints per 100, 90+ day stock share, days to sale, DSO, margin, payment delay.
- **salesperson.json (~540)**: id, name, dealerId, role, tenure, unitsSold12m, conversionPct, competencies, weakestCompetency, trainingHours12m, complaintRatePer100, complaintCount, complaintIncidenceVsPeer (vs network median), flaggedForCoaching (>= 1.5x), complaintThemes.
- **complaints.json (~4,400)**: id, dealer, date, customer, salesperson (null unless explicitly attached; service-type complaints are never attributed), model, text, category, theme, severity, journeyStage, isRepeat, resolutionDays, recoveryStage, closedOutcome (Recovered / Lost / Open).
- **inventory.json (2,400)**: dealer x segment x age bucket units, days to sale, unit value (INR lakh, illustrative).
- **interventions.json (600)**: group (treated/control), dealer, driver, type, baselineHealth, healthDelta, conversionLiftPct, complaintChangePct, agedStockChangePct, effective.
- **health_scores.json**, **model_outputs.json**: dimension weights (expert vs fitted, 95% range), fit R-squared, risk-model AUC and feature importance, exact SHAP-style contributions per dealer.
- **aggregates.json**: network KPIs, region status shares, network complaint matrix/funnel/stats, learning matrix, difference-in-differences, health trends, hero ids.
- **insights_complaints.json / insights_diagnosis.json / insights_plan.json**: per queued dealer complaint breakdowns, diagnosis frameworks, 90-day plan, checkpoints and projected outcome.
- **pitch_sessions.json**: per salesperson recorded pitch scores, drops, five practice attempts, theme coverage, conversion effect.

Prototype simulation: weights and risk probabilities are fitted on simulated history, not on validated real dealer outcomes.
