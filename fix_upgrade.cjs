const fs = require('fs');
let code = fs.readFileSync('src/TaskView.tsx', 'utf8');

const oldLogic = `                    onClick={async () => {
                      if (!currentUser) return;
                      
                      try {
                        const price = Number(selectedPlanForUpgrade.price) || 0;
                        const currentEarnings = Number(currentUser.earnings) || 0;
                        
                        // Allow upgrade even if earnings is less (to prevent blocking users during testing/recharge), or calculate new earnings
                        const newEarnings = currentEarnings >= price ? Number((currentEarnings - price).toFixed(2)) : currentEarnings;`;

const newLogic = `                    onClick={async () => {
                      if (!currentUser) return;
                      
                      const price = Number(selectedPlanForUpgrade.price) || 0;
                      const currentEarnings = Number(currentUser.earnings) || 0;

                      if (currentEarnings < price) {
                        triggerNotification("عفواً، رصيدك الحالي غير كافٍ للاشتراك في هذه الباقة. يرجى الإيداع وتعبئة الرصيد أولاً.");
                        setSelectedPlanForUpgrade(null);
                        return;
                      }

                      try {
                        const newEarnings = Number((currentEarnings - price).toFixed(2));`;

code = code.replace(oldLogic, newLogic);

const oldFallback = `                      } catch (err: any) {
                        console.error("Upgrade action error:", err);
                        // Even if an error happens, force local update so user is never blocked
                        try {
                          const updatedUser = {
                            ...currentUser,
                            vipTier: selectedPlanForUpgrade.name,
                            effectiveDays: 365,
                            vipStartDate: new Date().toISOString(),
                            hasDeposited: true
                          };
                          setCurrentUser(updatedUser);
                          localStorage.setItem('user_session', JSON.stringify(updatedUser));
                          triggerNotification(\`🎉 تهانينا! تم ترقية حسابك إلى \${selectedPlanForUpgrade.name} بنجاح!\`);
                        } catch (fallbackErr) {
                          triggerNotification("حدث خطأ أثناء محاولة الترقية.");
                        }
                      } finally {`;

const newFallback = `                      } catch (err: any) {
                        console.error("Upgrade action error:", err);
                        triggerNotification("حدث خطأ أثناء محاولة الترقية، يرجى المحاولة لاحقاً.");
                      } finally {`;

code = code.replace(oldFallback, newFallback);

fs.writeFileSync('src/TaskView.tsx', code);
