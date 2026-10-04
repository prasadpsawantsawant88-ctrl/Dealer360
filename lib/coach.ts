export const OBJECTIVES = ["Empathy", "Needs discovery", "Objection handling", "Expectation management", "Value communication"];
export type Turn = { customer: string; objective: string; options: { text: string; score: number; note: string }[] };
export type Bank = { title: string; opening: string; context: string; turns: Turn[] };

const o = (text: string, score: number, note: string) => ({ text, score, note });

export const BANKS: Record<string, Bank> = {
  delivery: {
    title: "Delivery promise broken", opening: "You told me delivery would take two weeks. Now you are saying four weeks. Why?", context: "The customer is price-sensitive and interested in the Nexus EV.",
    turns: [
      { customer: "You told me delivery would take two weeks. Now you are saying four weeks. Why?", objective: "Empathy", options: [o("I understand why that is frustrating. I should have confirmed the date before promising it. Let me explain exactly what happened.", 86, "Acknowledged the concern and owned the promise."), o("That is the supplier's fault, not ours. These delays happen all the time.", 52, "Deflected blame; no acknowledgement."), o("Four weeks is standard for this model.", 60, "Generic answer that ignores the earlier promise.")] },
      { customer: "I took leave to collect the car next week. I cannot plan around this.", objective: "Needs discovery", options: [o("Which day matters most to you? Let me check whether a loaner car or an earlier slot could cover the gap.", 84, "Clarified the real need and offered options."), o("You will have to adjust your plans.", 45, "Dismissed the customer's constraint."), o("I will try my best to get it sooner.", 63, "Vague commitment with no basis.")] },
      { customer: "Honestly, I am thinking of cancelling and going to another dealer.", objective: "Objection handling", options: [o("That is fair. Before you decide, let me tell you what I can commit to in writing today, and what I cannot.", 85, "Welcomed the objection and reset trust."), o("Our competitors have longer waits, trust me.", 55, "Unsupported claim."), o("Cancelling means you will lose the booking amount.", 40, "Threatening tone; escalates the conflict.")] },
      { customer: "So what exactly can you promise me now?", objective: "Expectation management", options: [o("Dispatch is confirmed for the 18th and delivery is planned for the 24th. I will message you on the 15th with a status.", 87, "Specific, verifiable, with a follow-up step."), o("It should be around three to four weeks, maybe less.", 58, "Still a range, not a commitment."), o("I will definitely deliver in two weeks.", 35, "Repeats an unsupported promise.")] },
      { customer: "Is the Nexus EV even worth the wait compared to cheaper options?", objective: "Value communication", options: [o("Let us compare running cost for your daily commute against the cheaper option, then you can decide if the wait is worth it.", 86, "Consultative, tied to the customer's use."), o("Yes, it is the best car in its class.", 62, "Claim without evidence."), o("The cheaper options are poor quality.", 48, "Pushy and negative.")] },
    ],
  },
  pricing: {
    title: "Surprise add-ons at billing", opening: "The final price is higher than the quote. I never agreed to these add-ons.", context: "The customer feels pushed into upgrades on a Terra SUV.",
    turns: [
      { customer: "The final price is higher than the quote. I never agreed to these add-ons.", objective: "Empathy", options: [o("I can see why that is upsetting. Let us go through the bill line by line and fix anything you did not agree to.", 86, "Acknowledged and offered to correct."), o("They were all in the paperwork you signed.", 48, "Defensive; ignores the feeling."), o("Add-ons are standard on this variant.", 58, "Generic answer.")] },
      { customer: "I only wanted the base car. Nobody asked what I needed.", objective: "Needs discovery", options: [o("What matters most to you in the car: budget, range or features? I will recommend only what fits that.", 85, "Re-opened discovery."), o("Most buyers take the accessory pack.", 50, "Pushy, not needs-based."), o("I can remove one item if you sign today.", 57, "Pressure tactic.")] },
      { customer: "I think I should go to another dealer for a cleaner quote.", objective: "Objection handling", options: [o("That is reasonable. Let me give you a written price breakup with every item optional marked, and you compare.", 86, "Welcomed comparison, built trust."), o("Other dealers add hidden charges too.", 52, "Unsupported claim."), o("This quote expires today.", 40, "False urgency.")] },
      { customer: "What will the on-road price actually be?", objective: "Expectation management", options: [o("The on-road price is the ex-showroom plus registration and insurance only. I will send it in writing before you decide.", 87, "Specific and written."), o("Around the same, give or take.", 55, "Vague."), o("Do not worry, it will be fine.", 35, "No information.")] },
      { customer: "Why should I pay more for the higher variant?", objective: "Value communication", options: [o("Let us compare what you would actually use, then see if the extra cost pays back for you.", 85, "Consultative."), o("It is simply better.", 55, "No evidence."), o("Most people regret the base model.", 45, "Pushy.")] },
    ],
  },
  product: {
    title: "Confusing product answers", opening: "Last time I was told two different things about the Nexus EV battery. Which is true?", context: "The customer is comparing the Nexus EV with a petrol alternative.",
    turns: [
      { customer: "Last time I was told two different things about the Nexus EV battery. Which is true?", objective: "Empathy", options: [o("I am sorry you got mixed answers. Let me give you one clear answer and show it in the spec sheet.", 86, "Owned the inconsistency."), o("Whoever told you that was mistaken.", 55, "Blames a colleague."), o("The battery is fine, do not worry.", 50, "Dismissive.")] },
      { customer: "I drive about 60 km a day, mostly in the city.", objective: "Needs discovery", options: [o("Do you have home charging? That decides which variant suits you better.", 85, "Asked the question that matters."), o("Then you need the top variant.", 52, "Assumes without asking."), o("Most people charge once a week.", 58, "Generic.")] },
      { customer: "I still think a petrol car is safer. EVs are unproven.", objective: "Objection handling", options: [o("That is a common worry. Here is the warranty and what is covered, and you can speak to an owner of this model.", 86, "Acknowledged and offered evidence."), o("Petrol cars are outdated.", 45, "Dismissive."), o("You will not find any problems.", 38, "Overpromise.")] },
      { customer: "What will it cost me to run, honestly?", objective: "Expectation management", options: [o("For 60 km a day, charging at home should cost roughly a third of petrol. I will show the calculation so you can check it.", 87, "Quantified with a method."), o("Much cheaper, trust me.", 52, "No basis."), o("It depends on many things.", 56, "Non-answer.")] },
      { customer: "Is the higher variant worth the extra money?", objective: "Value communication", options: [o("For your daily use the base battery covers you; the extra cost only pays back if you travel long distances.", 86, "Honest and needs-based."), o("Always go for the top one.", 46, "Pushy upsell."), o("It has more features.", 58, "Vague.")] },
    ],
  },
};
export const THEME_BANK: Record<string, string> = { "delivery expectations": "delivery", "follow-up": "delivery", communication: "delivery", "pricing communication": "pricing", "finance explanation": "pricing", "product knowledge": "product", service: "delivery" };
export const SESSION_KEY = "d360_session";
export type Session = { spId: string; bank: string; scores: number[]; picks: number[]; avg: number };
