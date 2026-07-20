import re

with open('src/screens/AICompanionScreen.tsx', 'r') as f:
    content = f.read()

# 1. Add imports for react-markdown and remark-gfm
import_statement = "import ReactMarkdown from 'react-markdown';\nimport remarkGfm from 'remark-gfm';\n"
content = content.replace("import { generateId } from '../utils';", "import { generateId } from '../utils';\n" + import_statement)

# 2. Find the chat bubble rendering and replace it
# The old rendering is:
# // Handle formatting text inside bubbles (Markdown support)
# // We do a simple parse of **bold** and *italic*
# const formattedContent = msg.content
#   .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
#   .replace(/\*(.*?)\*/g, '<em>$1</em>')
#   .replace(/\n/g, '<br />');
#
# return (
#   <div
# ...
#   <p dangerouslySetInnerHTML={{ __html: formattedContent }} />
# </div>

# Let's replace the whole block inside the map
old_block_regex = r"// Handle formatting text inside bubbles \(Markdown support\).*?return \(\s*<div\s*key=\{msg\.id\}\s*className=\{\`flex \$\{isUser \? 'justify-end' : 'justify-start'\} animate-in fade-in slide-in-from-bottom-2 duration-150\`\}\s*>\s*<div className=\{\`flex gap-3 max-w-\[85%\] md:max-w-\[70%\] \$\{isUser \? 'flex-row-reverse' : 'flex-row'\}\`\}>\s*\{/\* Icon / Avatar \*/\}\s*<div className=\{\`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-xs font-bold \$\{\s*isUser \s*\? 'bg-slate-800 text-slate-300 border border-slate-700/50' \s*: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'\s*\}\`\}>\s*\{isUser \? 'ME' : <Bot size=\{16\} />\}\s*</div>\s*\{/\* Chat Bubble \*/\}\s*<div className=\"flex flex-col gap-1\">\s*<div className=\{\`rounded-2xl p-4 text-sm leading-relaxed \$\{\s*isUser \s*\? 'bg-indigo-600 text-white rounded-tr-none shadow-lg shadow-indigo-600/10' \s*: 'bg-slate-900 text-slate-200 rounded-tl-none border border-slate-800/80 shadow-md'\s*\}\`\}>\s*<p dangerouslySetInnerHTML=\{\{ __html: formattedContent \}\} />\s*</div>\s*<span className=\{\`text-\[9px\] text-slate-500 px-1 \$\{isUser \? 'text-right' : 'text-left'\}\`\}>\s*\{new Date\(msg\.timestamp\)\.toLocaleTimeString\(\[\], \{ hour: '2-digit', minute: '2-digit' \}\)\}\s*</span>\s*</div>\s*</div>\s*</div>\s*\);"

new_block = """              return (
                <div
                  key={msg.id}
                  className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-150 w-full mb-2`}
                >
                  <div className={`flex gap-3 max-w-[90%] md:max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                    
                    {/* Icon / Avatar */}
                    <div className={`w-8 h-8 rounded-2xl shrink-0 flex items-center justify-center text-xs font-bold shadow-sm mt-1 ${
                      isUser 
                        ? 'bg-slate-800 text-slate-300 border border-slate-700/50' 
                        : 'bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-indigo-400 border border-indigo-500/30'
                    }`}>
                      {isUser ? 'ME' : <Bot size={16} />}
                    </div>

                    {/* Chat Bubble */}
                    <div className="flex flex-col gap-1.5 w-full overflow-hidden">
                      <div className={`rounded-3xl p-4 text-[14px] leading-relaxed shadow-sm ${
                        isUser 
                          ? 'bg-indigo-600 text-white rounded-tr-sm' 
                          : 'bg-slate-900 text-slate-200 rounded-tl-sm border border-slate-800/80 prose prose-invert prose-p:leading-relaxed prose-pre:bg-slate-950 prose-pre:border prose-pre:border-slate-800 prose-a:text-indigo-400 max-w-none'
                      }`}>
                        {isUser ? (
                          <div className="whitespace-pre-wrap font-medium">{msg.content}</div>
                        ) : (
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {msg.content}
                          </ReactMarkdown>
                        )}
                      </div>
                      <span className={`text-[10px] text-slate-500 font-medium px-2 ${isUser ? 'text-right' : 'text-left'}`}>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                  </div>
                </div>
              );"""

content = re.sub(old_block_regex, new_block, content, flags=re.DOTALL)

with open('src/screens/AICompanionScreen.tsx', 'w') as f:
    f.write(content)

