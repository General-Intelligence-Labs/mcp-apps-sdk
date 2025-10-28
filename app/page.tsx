'use client';

import { useChat } from '@ai-sdk/react';
import { useState } from 'react';
import AssistantAppEmbed from '@/components/AssistantAppEmbed';

export default function Chat() {
  const [input, setInput] = useState('');
  const { messages, sendMessage } = useChat();
  
  return (
    <div className="flex flex-col w-full max-w-2xl py-24 mx-auto stretch">
      {messages.map(message => (
        <div key={message.id} className="whitespace-pre-wrap mb-4">
          <div className="font-semibold mb-1">
            {message.role === 'user' ? 'User: ' : 'AI: '}
          </div>
          {message.parts.map((part, i) => {
            if (part.type === 'text') {
              return <div key={`${message.id}-${i}`}>{part.text}</div>;
            }
            
            if (part.type.startsWith('tool-')) {
              const toolPart = part as any;

              if (
                toolPart.state === 'input-streaming' ||
                toolPart.state === 'input-available'
              ) {
                return (
                  <div
                    key={`${message.id}-${i}`}
                    className="text-sm text-zinc-500 dark:text-zinc-400 italic"
                  >
                    Calling tool...
                  </div>
                );
              }

              if (toolPart.state === 'output-error') {
                return (
                  <div
                    key={`${message.id}-${i}`}
                    className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg"
                  >
                    {toolPart.errorText || 'Tool call failed.'}
                  </div>
                );
              }

              if (toolPart.state === 'output-available' && toolPart.output) {
                const result = toolPart.output;
                const hasWidget =
                  result?.widgetHtml && result?.metadata?.['openai/widgetAccessible'];

                return (
                  <div key={`${message.id}-${i}`}>
                    {hasWidget ? (
                      <AssistantAppEmbed
                        html={result.widgetHtml}
                        toolOutput={result.structuredContent}
                        toolResponseMetadata={result.metadata}
                      />
                    ) : (
                      <div className="text-sm text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 p-3 rounded-lg">
                        {result?.text || JSON.stringify(result)}
                      </div>
                    )}
                  </div>
                );
              }
            }
            
            return null;
          })}
        </div>
      ))}

      <form
        onSubmit={e => {
          e.preventDefault();
          sendMessage({ text: input });
          setInput('');
        }}
      >
        <input
          className="fixed dark:bg-zinc-900 bottom-0 w-full max-w-2xl p-2 mb-8 border border-zinc-300 dark:border-zinc-800 rounded shadow-xl"
          value={input}
          placeholder="Say something..."
          onChange={e => setInput(e.currentTarget.value)}
        />
      </form>
    </div>
  );
}
