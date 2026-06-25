import type React from 'react';
import { Input } from '@/components/ui/input';
import StepHeading from './StepHeading';

interface NameStepProps {
  userName: string;
  setUserName: (val: string) => void;
}

export default function NameStep({ userName, setUserName }: NameStepProps) {
  return (
    <div className="mx-auto flex h-full w-full max-w-[800px] flex-col justify-center gap-6">
      <StepHeading eyebrow="Step 1 of 6" title="Personalize your campaign" className="text-center">
        Enter your name to personalize the generated advertisement.
      </StepHeading>

      <div className="focus-google-border rounded-2xl transition-all duration-300">
        <Input
          type="text"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          placeholder="Enter your name"
          maxLength={50}
          className="h-16 text-xl text-center font-bold tracking-tight rounded-2xl border border-border/80 bg-card focus:border-transparent focus-visible:ring-0 focus-visible:outline-none transition-all duration-300 placeholder:text-muted-foreground/40"
          autoFocus
        />
      </div>
    </div>
  );
}
