import { useVoiceStore } from '@/lib/voiceStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Settings } from 'lucide-react';

export default function SettingsModal() {
  const { useMurf, setUseMurf } = useVoiceStore();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10" data-testid="button-settings">
          <Settings className="w-5 h-5 text-muted-foreground" />
        </Button>
      </DialogTrigger>
      <DialogContent className="glass-panel border-white/10 text-white sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Voice Configuration
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          
          {/* Toggle */}
          <div className="flex items-center justify-between space-x-2">
            <div className="flex flex-col gap-1">
              <Label htmlFor="murf-mode" className="text-base font-medium">Enable Murf AI Voice</Label>
              <span className="text-xs text-muted-foreground">Use ultra-realistic "Falcon" voice powered by backend TTS service.</span>
            </div>
            <Switch 
              id="murf-mode" 
              checked={useMurf} 
              onCheckedChange={setUseMurf}
              data-testid="switch-murf-ai" 
            />
          </div>

          <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-200">
            <strong>Note:</strong> Murf AI requires the MURF_API_KEY environment variable to be configured on the server.
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}
