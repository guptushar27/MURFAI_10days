import { ShieldAlert, DollarSign, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { FraudCase } from '@shared/schema';

interface TransactionCardProps {
  data: FraudCase | null;
  isVisible: boolean;
}

export default function TransactionCard({ data, isVisible }: TransactionCardProps) {
  if (!data) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card className="glass-panel border-white/10 overflow-hidden relative" data-testid={`card-transaction-${data.userName}`}>
            {/* Ambient Background Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-mono text-muted-foreground uppercase tracking-wider">Suspicious Activity</CardTitle>
                <div className="px-2 py-1 rounded bg-red-500/10 text-red-400 text-xs font-bold border border-red-500/20 flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3" />
                  FLAGGED
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 relative z-10">
              
              <div className="flex items-start justify-between border-b border-white/5 pb-4">
                <div>
                  <h3 className="text-2xl font-display font-bold text-white" data-testid={`text-transaction-name-${data.userName}`}>{data.transactionName}</h3>
                  <p className="text-sm text-muted-foreground">{data.transactionCategory}</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-mono font-bold text-white block" data-testid={`text-transaction-amount-${data.userName}`}>{data.transactionAmount}</span>
                  <span className="text-xs text-muted-foreground">{data.transactionTime}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" /> Location
                  </span>
                  <p className="font-medium text-white">{data.transactionSource}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5" /> Card
                  </span>
                  <p className="font-medium text-white">•••• {data.cardEnding}</p>
                </div>
              </div>

            </CardContent>
            
            {/* Security Footer */}
            <div className="bg-black/20 p-3 text-xs text-center text-muted-foreground border-t border-white/5">
              Case ID: {data.securityIdentifier} • Pending Verification
            </div>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
