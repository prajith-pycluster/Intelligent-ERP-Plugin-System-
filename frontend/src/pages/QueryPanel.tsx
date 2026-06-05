import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sparkles, Send, Paperclip, User, Bot, X, Clock, MessageSquare } from "lucide-react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  attachment?: string;
}

const QueryPanel = () => {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatItemId, setChatItemId] = useState(() => localStorage.getItem("lastChatItemId") || "");
  const [recentItems, setRecentItems] = useState<string[]>([]);
  const [attachment, setAttachment] = useState<File | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/explore/recents")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setRecentItems(data);
      })
      .catch(err => console.error("Error fetching recents:", err));
  }, []);

  useEffect(() => {
    const id = chatItemId.trim().toUpperCase();
    if (!id) {
      setChatMessages([]);
      return;
    }
    
    // Persist to local storage
    localStorage.setItem("lastChatItemId", id);
    
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/get_chat?item_id=${id}`);
        if (res.ok) {
          const loaded = await res.json();
          setChatMessages(loaded);
          setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
        }
      } catch (err) {
        console.error("Failed to load history for item", id);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [chatItemId]);

  const handleChatSend = async () => {
    if (!chatInput.trim() && !attachment) return;

    const userMsg: ChatMessage = {
      role: "user",
      content: chatInput,
      attachment: attachment?.name,
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput("");
    setAttachment(null);
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);

    let reply = "";
    const itemId = chatItemId.trim().toUpperCase();

    if (!itemId) {
      reply = "Please enter an Item ID above to start exploring product data.";
    } else {
      try {
        const res = await fetch("/api/explore", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ item_id: itemId, question: userMsg.content }),
        });
        
        if (!res.ok) {
           if (res.status === 404) reply = `Product "${itemId}" not found in inventory. Please check the ID and try again.`;
           else reply = "An error occurred while analyzing the product data.";
        } else {
           const data = await res.json();
           reply = data.response || "I could not generate a response for that query.";
           
           if (!recentItems.includes(itemId)) {
             setRecentItems((prev) => [itemId, ...prev]);
           }
        }
      } catch (err) {
        reply = "Network error communicating with the AI service.";
      }
    }

    const assistantMsg: ChatMessage = { role: "assistant", content: reply };
    setChatMessages((prev) => [...prev, assistantMsg]);
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">Exploratory Insight</h2>
        <p className="text-muted-foreground text-sm">Run AI-powered queries on inventory data</p>
      </div>

      <div className="w-full bg-card rounded-xl border border-border shadow-sm flex h-[600px] overflow-hidden">
        {/* Recents Sidebar */}
        <div className="w-64 border-r border-border bg-muted/10 flex flex-col hidden md:flex shrink-0">
          <div className="px-5 py-4 border-b border-border font-semibold flex items-center gap-2 text-foreground bg-muted/20">
            <Clock className="w-4 h-4 text-primary" /> Recent Chats
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            {recentItems.length === 0 ? (
               <div className="text-xs text-muted-foreground p-3 text-center">No recent chats</div>
            ) : (
               recentItems.map(item => (
                 <button 
                   key={item} 
                   onClick={() => setChatItemId(item)}
                   className={`w-full text-left px-3 py-2.5 rounded-lg text-sm flex items-center gap-2.5 transition-colors ${chatItemId.toUpperCase() === item ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted text-card-foreground"}`}
                 >
                   <MessageSquare className={`w-3.5 h-3.5 ${chatItemId.toUpperCase() === item ? "text-primary" : "text-muted-foreground"}`} />
                   {item}
                 </button>
               ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Chat Header */}
          <div className="px-5 py-4 border-b border-border flex items-center gap-3 bg-muted/20 shrink-0">
            <div className="p-2 rounded-lg bg-primary/10 hidden sm:flex">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <span className="font-semibold text-card-foreground">AI Inventory Explorer</span>
            <div className="ml-auto flex items-center gap-3">
              <span className="text-sm font-medium text-muted-foreground hidden lg:inline-block">Target Product:</span>
              <Input
                placeholder="Item ID"
                value={chatItemId}
                onChange={(e) => setChatItemId(e.target.value.toUpperCase())}
                className="h-9 w-32 font-medium bg-background"
              />
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6">
            {chatMessages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground px-4 text-center">
                <Sparkles className="h-12 w-12 mb-4 text-primary/30" />
                <p className="text-lg font-medium text-foreground">Ask anything about {chatItemId || "your inventory"}.</p>
                <p className="text-sm mt-2 max-w-sm">Enter an Item ID above, then ask a question. The AI will remember your conversation.</p>
              </div>
            )}
            {chatMessages.map((msg, i) => (
              <div key={i} className={`flex gap-4 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "assistant" && (
                  <div className="shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center mt-1">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div className={`max-w-[85%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed shadow-sm ${msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-tr-sm"
                  : "bg-muted/30 border border-border text-foreground rounded-tl-sm"
                  }`}>
                  {msg.attachment && (
                    <p className="text-xs opacity-90 mb-2 flex items-center gap-1.5 bg-background/20 rounded p-1.5 w-fit">
                      <Paperclip className="h-3.5 w-3.5" /> {msg.attachment}
                    </p>
                  )}
                  <p className="whitespace-pre-line">{msg.content}</p>
                </div>
                {msg.role === "user" && (
                  <div className="shrink-0 h-8 w-8 rounded-full bg-primary flex items-center justify-center mt-1 shadow-sm">
                    <User className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-border px-5 py-4 bg-muted/10 shrink-0">
            {attachment && (
              <div className="mb-3 flex items-center gap-2 text-xs font-medium text-foreground bg-background border border-border rounded-lg px-3 py-2 w-fit shadow-sm">
                <Paperclip className="h-3.5 w-3.5 text-muted-foreground" /> {attachment.name}
                <button onClick={() => setAttachment(null)} className="ml-2 hover:bg-muted p-0.5 rounded-sm transition-colors text-muted-foreground"><X className="h-3.5 w-3.5" /></button>
              </div>
            )}
            <div className="flex gap-3">
              <input ref={fileInputRef} type="file" className="hidden" accept=".csv,.png,.jpg,.jpeg,.pdf,.doc,.docx" onChange={(e) => setAttachment(e.target.files?.[0] || null)} />
              <Button variant="outline" size="icon" className="shrink-0 h-11 w-11 rounded-xl shadow-sm bg-background" onClick={() => fileInputRef.current?.click()}>
                <Paperclip className="h-4 w-4 text-muted-foreground" />
              </Button>
              <Input
                placeholder={chatItemId ? `Ask a question about ${chatItemId}...` : "Select or type an Item ID first..."}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleChatSend()}
                className="flex-1 h-11 rounded-xl shadow-sm px-4 bg-background"
                disabled={!chatItemId}
              />
              <Button size="icon" onClick={handleChatSend} disabled={(!chatInput.trim() && !attachment) || !chatItemId} className="h-11 w-11 rounded-xl shadow-sm">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QueryPanel;
