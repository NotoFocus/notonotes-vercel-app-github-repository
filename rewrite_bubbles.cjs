const fs = require('fs');
let code = fs.readFileSync('src/screens/AICompanionScreen.tsx', 'utf8');

const target1 = /\{\/\* Icon \/ Avatar \*\/\}.*?\{\/\* Chat Bubble \*\/\}/s;

const newMessagesRender = `            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              
              return (
                <div
                  key={msg.id}
                  className={\`flex \${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in duration-300 w-full mb-6\`}
                >
                  <div className={\`flex gap-4 max-w-3xl w-full \${isUser ? 'flex-row-reverse' : 'flex-row'}\`}>
                    
                    {/* Avatar */}
                    {!isUser && (
                      <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold border border-indigo-500/20 bg-indigo-500/10 text-indigo-400 mt-0.5">
                        <Bot size={18} />
                      </div>
                    )}

                    {/* Chat Bubble / Text */}
                    <div className={\`flex flex-col gap-1 w-full overflow-hidden \${isUser ? 'items-end' : 'items-start'}\`}>
                      <div className={\`text-[15px] leading-relaxed \${
                        isUser 
                          ? 'bg-slate-800 text-slate-200 rounded-[1.5rem] px-5 py-3.5 inline-block max-w-[85%]' 
                          : 'text-slate-200 prose prose-invert prose-p:leading-relaxed prose-pre:bg-slate-900 prose-pre:border prose-pre:border-slate-800/60 prose-a:text-indigo-400 max-w-none pt-1'
                      }\`}>
                        {isUser ? (
                          <div className="whitespace-pre-wrap">{msg.content}</div>
                        ) : (
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {msg.content}
                          </ReactMarkdown>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
`;

const replaceRegex = /\{messages\.map\(\(msg\) => \{[\s\S]*?\}\)\}/;
code = code.replace(replaceRegex, newMessagesRender);

// Also replace the loading indicator
const loadingRegex = /\{isLoading && \([\s\S]*?<div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-none p-4 flex items-center gap-1\.5">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*\)\}/;

const newLoading = `{isLoading && (
              <div className="flex justify-start animate-in fade-in duration-200 w-full mb-6">
                <div className="flex gap-4 max-w-3xl w-full">
                  <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mt-0.5">
                    <Bot size={18} />
                  </div>
                  <div className="pt-2 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-slate-600 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-slate-600 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-slate-600 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}`;

code = code.replace(loadingRegex, newLoading);

// Also replace the form to make the input bar floating or centered ChatGPT style
const formRegex = /<form[\s\S]*?<\/form>/;

const newForm = `<form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex-none p-4 md:p-6 pb-[calc(env(safe-area-inset-bottom)+16px)] w-full max-w-3xl mx-auto flex flex-col gap-2"
          >
            {/* Error Message banner inline */}
            {errorMsg && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-2.5 animate-in slide-in-from-bottom-2 mb-2">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <p className="text-xs text-red-300 font-medium leading-relaxed">{errorMsg}</p>
              </div>
            )}

            <div className="flex gap-2 items-end bg-slate-900/60 border border-slate-800 focus-within:border-indigo-500/50 focus-within:bg-slate-900 rounded-[1.5rem] p-1.5 transition-all shadow-sm">
              <button
                type="button"
                onClick={() => setShowNoteAttachModal(true)}
                className={\`p-3.5 rounded-full transition-all cursor-pointer shrink-0 \${
                  tempNoteContext 
                    ? 'text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20' 
                    : 'text-slate-400 hover:text-indigo-400 hover:bg-slate-800'
                }\`}
                title={lang === 'id' ? 'Lampirkan Catatan Berizin' : 'Attach Authorized Note'}
              >
                <FileText size={20} />
              </button>
              
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (!isLoading && inputText.trim()) handleSend();
                  }
                }}
                placeholder={lang === 'id' ? "Kirim pesan aman ke Noto AI..." : "Send a secure message to Noto AI..."}
                disabled={isLoading}
                rows={1}
                className="flex-1 bg-transparent border-none px-2 py-3.5 text-[15px] placeholder-slate-500 outline-none resize-none min-h-[52px] max-h-32 text-slate-100 no-scrollbar"
                style={{ overflowY: 'auto' }}
              />
              
              <button
                type="submit"
                disabled={isLoading || !inputText.trim()}
                className={\`p-3.5 rounded-full transition-all shrink-0 \${
                  inputText.trim() && !isLoading
                    ? 'bg-indigo-500 text-white shadow-md hover:bg-indigo-400 cursor-pointer'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }\`}
              >
                <Send size={18} />
              </button>
            </div>
            <div className="text-center text-[10px] text-slate-500 font-medium mt-1">
              {lang === 'id' ? 'Noto AI dapat membuat kesalahan. Harap periksa informasi penting.' : 'Noto AI can make mistakes. Please verify important information.'}
            </div>
          </form>`;

code = code.replace(formRegex, newForm);

// Remove the old error banner that was floating above
const oldErrorRegex = /\{\/\* Error Message banner \*\/\}\s*\{errorMsg && \([\s\S]*?<\/div>\s*\)\}/;
code = code.replace(oldErrorRegex, '');

fs.writeFileSync('src/screens/AICompanionScreen.tsx', code);
