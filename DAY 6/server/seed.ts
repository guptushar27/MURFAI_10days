import { storage } from "./storage";

async function seed() {
  console.log("Seeding database with initial fraud cases...");
  
  const initialCases = [
    {
      userName: "John",
      securityIdentifier: "8821",
      cardEnding: "4242",
      status: "pending_review" as const,
      transactionName: "Super Luxury Watch Co.",
      transactionAmount: "$4,500.00",
      transactionTime: "2:30 AM",
      transactionCategory: "Luxury Goods",
      transactionSource: "Online Store (International)",
      securityQuestion: "What is your mother's maiden name?",
      securityAnswer: "Smith"
    },
    {
      userName: "Alice",
      securityIdentifier: "9912",
      cardEnding: "1234",
      status: "pending_review" as const,
      transactionName: "Unknown Tech Vendor",
      transactionAmount: "$12.99",
      transactionTime: "10:15 AM",
      transactionCategory: "Software",
      transactionSource: "Recurring Billing",
      securityQuestion: "What was the name of your first pet?",
      securityAnswer: "Fluffy"
    }
  ];

  for (const caseData of initialCases) {
    const existing = await storage.getFraudCaseByUserName(caseData.userName);
    if (!existing) {
      await storage.createFraudCase(caseData);
      console.log(`✓ Created fraud case for ${caseData.userName}`);
    } else {
      console.log(`- Fraud case for ${caseData.userName} already exists`);
    }
  }

  console.log("Seeding complete!");
  process.exit(0);
}

seed().catch(console.error);
