import type React from 'react';
import { Input } from '@/components/ui/input';
import StepHeading from './StepHeading';

interface NameStepProps {
  userName: string;
  setUserName: (val: string) => void;
  onNext?: () => void;
}

export default function NameStep({ userName, setUserName, onNext }: NameStepProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userName.trim().length >= 2 && onNext) {
      onNext();
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto flex h-full w-full max-w-[800px] flex-col justify-center gap-6"
    >
      <StepHeading eyebrow="Step 1 of 6" title="Name your character" className="text-center">
        Enter a name for your campaign's star character.
      </StepHeading>

      <div className="focus-google-border rounded-2xl transition-all duration-300">
        <Input
          type="text"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          placeholder="Enter character name"
          maxLength={50}
          className="h-16 text-xl text-center font-bold tracking-tight rounded-2xl border border-border/80 bg-card focus:border-transparent focus-visible:ring-0 focus-visible:outline-none transition-all duration-300 placeholder:text-muted-foreground/40"
          autoFocus
        />
      </div>
    </form>
  );
}
