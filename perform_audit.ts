
import { getAllUsers, getAllDeposits } from './src/firebaseService.js';

async function performAudit() {
  console.log("Starting full system audit...");
  
  const [users, deposits] = await Promise.all([
      getAllUsers(),
      getAllDeposits()
  ]);
  
  console.log(`Auditing ${users.length} users and ${deposits.length} deposits.`);

  const report = {
    fakeAccounts: [] as any[],
    corruptData: [] as any[],
  };

  const depositPhones = new Set(deposits.map(d => d.phone));

  for (const user of users) {
    // 1. Corrupt data: missing phone or ID
    if (!user.phone || !user.id) {
        report.corruptData.push(user);
        continue;
    }

    // 2. Fake accounts: no deposit, no vipTier, no earnings
    const hasActivity = depositPhones.has(user.phone) || 
                        (user.vipTier && user.vipTier !== '' && user.vipTier !== 'العضوية العادية' && user.vipTier !== 'الباقة العادية') ||
                        (user.earnings > 0);
    
    if (!hasActivity) {
        report.fakeAccounts.push(user);
    }
  }
  
  console.log("--- Audit Report Summary ---");
  console.log(`Total Users: ${users.length}`);
  console.log(`Fake Accounts Identified (Inactive/No Activity): ${report.fakeAccounts.length}`);
  console.log(`Corrupt Data Identified (Missing fields): ${report.corruptData.length}`);
  console.log("----------------------------");
  console.log("Note: No deletions were performed.");
}

performAudit().catch(console.error);
