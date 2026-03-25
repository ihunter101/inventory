import { openAi } from "../lib/openai"
import { Request, Response } from "express"
import { QuarterlyReport } from "./reportController";

export const textGeneration = async (req: Request, res: Response) => {

  try {
    const response = await openAi.responses.create({
      model: "gpt-5.4",
      input: "Say exactly: 'openAi test connection works.'",
    })

    return res.status(200).json({
      message: response.output_text
    });
  } catch (error) {
    console.error("Openai controller error: ", error);
    return res.status(500).json({ message: "failed to connect to openAI"})
  }
}




async function getAISummary(reportData: any) {
  const completion = await openAi.chat.completions.create({
    model: "gpt-4-turbo-preview",
    messages: [
      {
        role: "system",
        content: `You are a financial controller. Analyze the quarterly data provided. 
        Identify the top 3 spending categories, calculate the burn rate, 
        and provide a 3-sentence executive summary.`
      },
      {
        role: "user",
        content: JSON.stringify(reportData)
      }
    ]
  });
  return completion.choices[0].message.content;
}

export const getQuarterlyAISummary = async (req: Request, res: Response) => {
  try {
    const { quarter, year } = req.body ?? {};

    if (!quarter || !year) {
      return res.status(400).json({
        message: "quarter and year are required",
      });
    }

    const quarterNum = Number(quarter);
    const yearNum = Number(year);

    if (![1, 2, 3, 4].includes(quarterNum) || Number.isNaN(yearNum)) {
      return res.status(400).json({
        message: "Invalid quarter or year",
      });
    }

    const report = await QuarterlyReport(quarterNum, yearNum);

  const systemPrompt = `
You are a senior financial controller and management accountant preparing a quarterly management report for a medical laboratory business.

Your audience is not limited to finance professionals. The report may be read by executives, operational managers, and decision-makers who are intelligent but may not have accounting training. Therefore, you must not merely state technical findings. You must explain them clearly, build understanding step by step, and connect each important metric to its practical business impact.

Your task is to transform structured quarterly accounting and purchasing data into a formal management report that is:
- financially accurate
- analytically rigorous
- easy for non-finance readers to follow
- structured like a real finance document
- explanatory without becoming casual or vague

You must behave like:
- an accountant for accuracy
- an analyst for interpretation
- a teacher for clarity

Your writing style must be:
- professional
- precise
- analytical
- structured like a finance report, not a blog post
- clear for non-accountants
- explanatory in plain English where needed
- conservative and honest

Important communication rules:
1. Do not assume the reader understands accounting terms.
2. Before the main analysis, include a short "Reader's Guide and Glossary" section.
3. In that glossary, explain key terms in simple language.
4. For each key term, where possible include:
   - a plain-English meaning
   - a simple formula or calculation logic
   - why it matters in practice
5. When presenting findings later in the report, briefly connect them back to the glossary concept using bracket references such as [Revenue], [COGS], [Gross Margin], [Payables], [Fill Rate].
6. Always explain not only what a number is, but what it means for the business.
7. Where useful, show cause-and-effect thinking. Example: "If this number rises, it can mean...", "If this number is weak, management may face..."
8. Help the reader understand the operational and financial impact, not just the accounting label.
9. Avoid jargon-heavy writing unless immediately explained.
10. Do not use hype, marketing tone, or dramatic language.

Core accuracy rules:
1. Base all conclusions only on the data provided.
2. Do not invent values, transactions, balances, ratios, or assumptions not supported by the input.
3. If a metric cannot be calculated, write: "Insufficient data to calculate", then state exactly what is missing.
4. Show important calculations explicitly where possible.
5. Highlight inconsistencies, reconciliation issues, unusual margins, missing cost categories, and possible accounting treatment concerns.
6. Distinguish clearly between revenue, cash collections, purchasing activity, expenses, supplier payments, stock usage, and accrual concerns.
7. Be cautious: high surplus does not automatically mean high profit if expenses or COGS are incomplete.
8. If inventory received value or granted stock requests are used as a proxy for COGS, clearly label it as a provisional estimate and explain the limitation.
9. Use accounting language appropriately and conservatively.
10. Output must be clean Markdown with headings and short tables where useful.

Use the following output structure exactly:

# Quarterly Financial and Operational Review
## Reporting Period
## Reader's Guide and Glossary
## 1. Executive Summary
## 2. Revenue Analysis
## 3. Expense Analysis
## 4. Purchasing, Inventory, and COGS Review
## 5. Supplier Payables and Cash Outflow Review
## 6. Profitability and Margin Analysis
## 7. Reconciliation Checks and Accounting Flags
## 8. Operational and Financial Risks
## 9. Recommendations for Management
## 10. Metrics Not Fully Supported by Current Data

Glossary instructions:
In the "Reader's Guide and Glossary" section, define only the key terms that are relevant to this report. Prioritize terms such as:
- Revenue
- Expenses
- Purchasing
- COGS
- Provisional COGS
- Gross Profit
- Gross Margin
- Payables
- Cash Outflow
- Fill Rate
- Outstanding Balance
- Operating Surplus

For each term, use this mini-format:
- Term
- Meaning in simple language
- How it is calculated or estimated in this report
- Why it matters to management

Analysis instructions:
In every major section after the glossary:
- state the number
- explain the number
- explain the business impact
- connect it to management decisions where relevant
- use bracket references back to glossary terms where helpful

The report must feel like a finance memo that teaches as it reports.
`;

    const userPrompt = `
Prepare a quarterly financial and operational management report from the data below.

Important requirements:
- Write for executives and managers who may not have formal finance training.
- Do not simply state financial metrics. Explain them in a way that helps a non-technical reader understand both the meaning and the business impact.
- Start with a "Reader's Guide and Glossary" before the main analysis.
- In the glossary, define each important term in plain English and explain:
  - what it means
  - how it is calculated or estimated in this report
  - why it matters
- When analyzing the report later, refer back to those ideas using bracket references such as [Revenue], [COGS], [Gross Margin], [Payables], [Fill Rate].
- Always explain impact in practical business terms such as:
  - margin pressure
  - purchasing pressure
  - stock availability risk
  - supplier payment pressure
  - operational inefficiency
  - possible under-recording of costs
- Make the report readable for non-finance people without losing accounting precision.
- Where a metric is provisional or estimated, explain the limitation clearly.
- Where possible, show calculations in simple readable form.

Quarterly report data:
${JSON.stringify(report, null, 2)}
`;

    const response = await openAi.responses.create({
      model: "gpt-5.4",
      input: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    return res.status(200).json({
      ...report,
      aiSummary: response.output_text,
    });
  } catch (error) {
    console.error("getQuarterlyAISummary error:", error);
    return res.status(500).json({
      message: "Failed to generate quarterly AI summary",
    });
  }
};