'use client';

import { useState } from 'react';
import { ChatButton } from './chat-button';
import { ChatPanel } from './chat-panel';

export function AIChat() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {!open && <ChatButton onClick={() => setOpen(true)} />}
      <ChatPanel open={open} onOpenChange={setOpen} />
    </>
  );
}

// Re-export components for external use
export { ChatButton } from './chat-button';
export { ChatPanel } from './chat-panel';
