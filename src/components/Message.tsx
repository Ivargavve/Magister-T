import { useState } from 'react'
import type { Message } from '../hooks/useChat'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface MessageBubbleProps {
  message: Message
}

// Copy button component for code blocks
function CopyButton({ text, title }: { text: string; title: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className="absolute top-2 right-2 p-1.5 rounded-md bg-gray-700/50 hover:bg-gray-600/70 text-gray-300 hover:text-white transition-colors"
      title={title}
    >
      {copied ? (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-magister-400">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
        </svg>
      )}
    </button>
  )
}

// Code block wrapper with copy button
function CodeBlock({ children, copyTitle }: { children: React.ReactNode; copyTitle: string }) {
  // Extract text content from children
  const getTextContent = (node: React.ReactNode): string => {
    if (typeof node === 'string') return node
    if (Array.isArray(node)) return node.map(getTextContent).join('')
    if (node && typeof node === 'object' && 'props' in node) {
      return getTextContent((node as React.ReactElement).props.children)
    }
    return ''
  }

  const codeText = getTextContent(children)

  return (
    <pre className="relative bg-gray-800/90 backdrop-blur-sm rounded-lg my-3 p-4 overflow-x-auto shadow-md group">
      <CopyButton text={codeText} title={copyTitle} />
      <code className="block text-gray-100 text-sm font-mono whitespace-pre">{codeText}</code>
    </pre>
  )
}

function MessageBubble({ message }: MessageBubbleProps) {
  const { user } = useAuth()
  const { t } = useLanguage()
  const isAssistant = message.role === 'assistant'
  const isStreaming = message.isStreaming
  const [showMenu, setShowMenu] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleCopyMessage = async () => {
    await navigator.clipboard.writeText(message.content)
    setCopied(true)
    setShowMenu(false)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      className={`flex ${isAssistant ? 'justify-start' : 'justify-end'} animate-fade-in mb-4`}
    >
      <div
        className={`max-w-[85%] md:max-w-[90%] transition-all duration-200 relative ${
          isAssistant
            ? 'px-0 md:px-5 py-2 md:py-4'
            : ''
        }`}
      >
        {/* Role indicator and menu */}
        <div className={`flex items-center gap-2 ${isAssistant ? 'mb-2' : 'mb-1 justify-end pr-3'}`}>
          {isAssistant ? (
            <>
              <span className="text-sm font-bold text-magister-600">Magister T</span>
              {isStreaming && (
                <div className="flex items-center gap-1 ml-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-magister-500 typing-dot" />
                  <span className="w-1.5 h-1.5 rounded-full bg-magister-500 typing-dot" />
                  <span className="w-1.5 h-1.5 rounded-full bg-magister-500 typing-dot" />
                </div>
              )}
              {/* Spacer to push menu to right */}
              <div className="flex-1" />
              {/* Three-dot menu for assistant messages */}
              {!isStreaming && (
                <div className="relative">
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="p-1 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-200/50 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
                    </svg>
                  </button>
                  {showMenu && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                      <div className="absolute right-0 top-full mt-1 z-20 bg-white rounded-lg shadow-xl py-1 min-w-[140px] border border-gray-200">
                        <button
                          onClick={handleCopyMessage}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          {copied ? (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-magister-500">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                            </svg>
                          )}
                          {copied ? t('copied') : t('copyText')}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </>
          ) : (
            <>
              {user?.profile_image ? (
                <img
                  src={user.profile_image}
                  alt={user.name || t('user')}
                  className="w-5 h-5 rounded-md object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-5 h-5 rounded-md bg-magister-500/20 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3 text-magister-600">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                </div>
              )}
              <span className="text-xs font-medium text-gray-700">{t('you')}</span>
            </>
          )}
        </div>

        {/* Message content */}
        <div
          className={`text-base leading-relaxed font-serif ${
            isAssistant
              ? 'text-gray-900 markdown-content'
              : 'bg-magister-600 text-white px-4 py-3 rounded-2xl rounded-tr-sm shadow-md whitespace-pre-wrap'
          }`}
        >
          {isAssistant ? (
            <>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  // Headings
                  h1: ({ children }) => <h1 className="text-xl font-bold mt-4 mb-2 text-gray-900">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-lg font-bold mt-3 mb-2 text-gray-900">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-base font-semibold mt-2 mb-1 text-gray-900">{children}</h3>,
                  // Paragraphs
                  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                  // Lists
                  ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                  li: ({ children }) => <li className="ml-2">{children}</li>,
                  // Code - only handles inline code now (block code handled by pre/CodeBlock)
                  code: ({ children }) => (
                    <code className="bg-amber-900/20 text-amber-900 px-1.5 py-0.5 rounded text-sm font-mono">
                      {children}
                    </code>
                  ),
                  pre: ({ children }) => <CodeBlock copyTitle={t('copyCode')}>{children}</CodeBlock>,
                  // Strong and emphasis
                  strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
                  em: ({ children }) => <em className="italic">{children}</em>,
                  // Links
                  a: ({ href, children }) => (
                    <a href={href} className="text-magister-600 hover:text-magister-500 underline" target="_blank" rel="noopener noreferrer">
                      {children}
                    </a>
                  ),
                  // Blockquotes
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-2 border-gray-500 pl-3 my-2 italic text-gray-700">
                      {children}
                    </blockquote>
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>
              {isStreaming && message.content && (
                <span className="inline-block w-0.5 h-4 ml-0.5 bg-magister-500 animate-cursor-blink align-middle" />
              )}
              {isStreaming && !message.content && (
                <span className="text-gray-600 flex items-center gap-1">
                  <span>{t('magisterTWriting')}</span>
                  <span className="animate-pulse">...</span>
                </span>
              )}
            </>
          ) : (
            message.content
          )}
        </div>
      </div>
    </div>
  )
}

export default MessageBubble
