'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  MessageCircle,
  Phone,
  ExternalLink,
  X,
  Send,
  Loader2,
  ArrowRight,
  Palette,
  Maximize2,
  CheckCircle2,
  HelpCircle,
  RotateCcw,
} from 'lucide-react';
import { aiChatApi, AiChatMessage, AiChatResponse } from '@/lib/api';

interface StudioConfig {
  artistName?: string;
  zaloUrl?: string;
  messengerUrl?: string;
  hotline?: string;
}

const DEFAULT_CONFIG: StudioConfig = {
  artistName: 'Họa sĩ Quốc Tuấn',
  zaloUrl: 'https://zalo.me/0987654321',
  messengerUrl: 'https://m.me/artistcommission',
  hotline: '0987654321',
};

const CHIP_PROMPTS = [
  'Tư vấn tranh sơn dầu phòng khách 1m2 x 80cm',
  'Chi phí vẽ bích họa tường quán cafe 15m²',
  'Gợi ý các mẫu tranh phong cảnh biển',
  'Chính sách duyệt phác thảo & cọc tranh',
];

export function FloatingContactDock() {
  const [isOpen, setIsOpen] = useState(false);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [config, setConfig] = useState<StudioConfig>(DEFAULT_CONFIG);

  // AI Chat state
  const [messages, setMessages] = useState<Array<AiChatMessage & { actionSuggestion?: any }>>([
    {
      role: 'assistant',
      content:
        'Kính chào Quý khách! Tôi là Trợ lý Nghệ thuật của Họa sĩ Quốc Tuấn. Tôi có thể hỗ trợ Quý khách tư vấn chất liệu (sơn dầu, acrylic, màu nước, tranh tường), dự toán chi phí hoặc gợi ý tác phẩm phù hợp với không gian.',
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch studio config on mount
  useEffect(() => {
    fetch('/api/v1/public/studio-config')
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error();
      })
      .then((data) => {
        if (data) {
          setConfig({
            artistName: data.artistName || DEFAULT_CONFIG.artistName,
            zaloUrl: data.zaloUrl || DEFAULT_CONFIG.zaloUrl,
            messengerUrl: data.messengerUrl || DEFAULT_CONFIG.messengerUrl,
            hotline: data.hotline || DEFAULT_CONFIG.hotline,
          });
        }
      })
      .catch(() => {
        // use default fallback
      });
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isAiOpen) {
      scrollToBottom();
    }
  }, [messages.length, isAiOpen]);

  // Handle Send AI message
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isAiLoading) return;

    const newMessages: Array<AiChatMessage & { actionSuggestion?: any }> = [
      ...messages,
      { role: 'user', content: text },
    ];
    setMessages(newMessages);
    setInputMessage('');
    setIsAiLoading(true);

    try {
      const apiPayload = newMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res: AiChatResponse = await aiChatApi(apiPayload);

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: res.reply,
          actionSuggestion: res.actionSuggestion,
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            err.message ||
            'Xin lỗi, kết nối tới máy chủ tư vấn tạm thời gián đoạn. Quý khách vui lòng thử lại sau giây lát hoặc nhắn tin qua Zalo.',
        },
      ]);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        role: 'assistant',
        content:
          'Kính chào Quý khách! Tôi là Trợ lý Nghệ thuật của Họa sĩ Quốc Tuấn. Tôi có thể hỗ trợ Quý khách tư vấn chất liệu, dự toán chi phí hoặc gợi ý tác phẩm phù hợp với không gian.',
      },
    ]);
  };

  return (
    <>
      {/* Floating Action Dock (Bottom Right) */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3 pointer-events-none">
        {/* Expanded Contact Options */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 15 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col items-end gap-2.5 pointer-events-auto mb-1"
            >
              {/* Option 1: AI Assistant */}
              <button
                type="button"
                onClick={() => {
                  setIsAiOpen(true);
                  setIsOpen(false);
                }}
                className="group flex items-center gap-3 bg-white hover:bg-[#FAF9F6] text-zinc-900 px-4 py-2.5 rounded-full shadow-lg border border-zinc-200/90 transition-all hover:shadow-xl"
              >
                <span className="text-xs font-semibold tracking-wide flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#B45309]"></span>
                  </span>
                  Trợ lý AI Tư vấn
                </span>
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#3E5C6E] to-[#18181B] text-white flex items-center justify-center shadow-sm">
                  <Sparkles className="w-4 h-4 text-amber-300" />
                </div>
              </button>

              {/* Option 2: Zalo */}
              <a
                href={config.zaloUrl}
                target="_blank"
                rel="noreferrer"
                className="group flex items-center gap-3 bg-white hover:bg-blue-50 text-zinc-900 px-4 py-2.5 rounded-full shadow-lg border border-zinc-200/90 transition-all hover:shadow-xl"
              >
                <span className="text-xs font-semibold tracking-wide">Chat Zalo Họa sĩ</span>
                <div className="w-8 h-8 rounded-full bg-[#0068FF] text-white flex items-center justify-center font-bold text-xs shadow-sm">
                  Z
                </div>
              </a>

              {/* Option 3: Facebook Messenger */}
              <a
                href={config.messengerUrl}
                target="_blank"
                rel="noreferrer"
                className="group flex items-center gap-3 bg-white hover:bg-sky-50 text-zinc-900 px-4 py-2.5 rounded-full shadow-lg border border-zinc-200/90 transition-all hover:shadow-xl"
              >
                <span className="text-xs font-semibold tracking-wide">Facebook Messenger</span>
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#00B2FF] to-[#006AFF] text-white flex items-center justify-center shadow-sm">
                  <MessageCircle className="w-4 h-4" />
                </div>
              </a>

              {/* Option 4: Direct Hotline */}
              <a
                href={`tel:${config.hotline}`}
                className="group flex items-center gap-3 bg-white hover:bg-emerald-50 text-zinc-900 px-4 py-2.5 rounded-full shadow-lg border border-zinc-200/90 transition-all hover:shadow-xl"
              >
                <span className="text-xs font-semibold tracking-wide">Hotline: {config.hotline}</span>
                <div className="w-8 h-8 rounded-full bg-[#18181B] text-white flex items-center justify-center shadow-sm">
                  <Phone className="w-4 h-4 text-emerald-400" />
                </div>
              </a>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Floating Trigger Button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="pointer-events-auto relative w-14 h-14 rounded-full bg-[#18181B] hover:bg-[#27272A] text-white shadow-2xl flex items-center justify-center transition-transform hover:scale-105 active:scale-95 border-2 border-white/20 group"
          aria-label="Liên hệ xưởng vẽ & Trợ lý AI"
          title="Liên hệ xưởng vẽ & Trợ lý AI"
        >
          {isOpen ? (
            <X className="w-6 h-6 text-white transition-transform duration-200 rotate-90" />
          ) : (
            <>
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-[#B45309] border-2 border-white"></span>
              </span>
              <Sparkles className="w-6 h-6 text-amber-300 group-hover:rotate-12 transition-transform" />
            </>
          )}
        </button>
      </div>

      {/* AI Assistant Drawer / Popover Panel */}
      <AnimatePresence>
        {isAiOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.96 }}
            transition={{ type: 'spring', damping: 25, stiffness: 280 }}
            className="fixed bottom-6 right-4 sm:right-6 z-50 w-[380px] sm:w-[440px] max-w-[95vw] h-[600px] max-h-[85vh] bg-[#FAF9F6] text-zinc-900 rounded-3xl shadow-2xl border border-zinc-200/90 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 bg-[#18181B] text-white flex items-center justify-between border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#3E5C6E] to-[#B45309] flex items-center justify-center text-white shadow-inner">
                  <Sparkles className="w-5 h-5 text-amber-200" />
                </div>
                <div>
                  <h3 className="font-serif text-base font-normal tracking-wide text-white leading-tight">
                    Trợ Lý Nghệ Thuật AI
                  </h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-sans font-medium">
                      Gemini Live Consultant
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 text-zinc-400">
                <button
                  type="button"
                  onClick={handleResetChat}
                  className="p-1.5 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                  title="Bắt đầu lại cuộc trò chuyện"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsAiOpen(false)}
                  className="p-1.5 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                  title="Đóng cửa sổ"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Conversation Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs font-sans">
              {messages.map((m, idx) => {
                const isUser = m.role === 'user';

                return (
                  <div
                    key={idx}
                    className={`flex flex-col gap-2 ${isUser ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[88%] rounded-2xl p-3.5 space-y-2 leading-relaxed ${
                        isUser
                          ? 'bg-[#3E5C6E] text-white rounded-tr-none shadow-sm'
                          : 'bg-white text-zinc-800 border border-zinc-200/80 rounded-tl-none shadow-sm'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{m.content}</p>
                    </div>

                    {/* Interactive Action Suggestion Card */}
                    {!isUser && m.actionSuggestion && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="w-[90%] bg-white border border-amber-300/80 rounded-2xl p-3.5 shadow-md space-y-2.5 text-zinc-800"
                      >
                        <div className="flex items-start justify-between gap-2 border-b border-zinc-100 pb-2">
                          <div>
                            <span className="text-[10px] uppercase font-bold tracking-wider text-[#B45309] block">
                              Gợi ý hành động từ AI
                            </span>
                            <h4 className="font-serif text-sm font-semibold text-zinc-900 leading-snug">
                              {m.actionSuggestion.title}
                            </h4>
                          </div>
                          {m.actionSuggestion.type === 'COMMISSION' ? (
                            <Palette className="w-4 h-4 text-[#3E5C6E] shrink-0" />
                          ) : (
                            <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                          )}
                        </div>

                        {m.actionSuggestion.subtitle && (
                          <p className="text-[11px] text-zinc-600 font-light">
                            {m.actionSuggestion.subtitle}
                          </p>
                        )}

                        {/* Optional thumbnail */}
                        {m.actionSuggestion.details?.imageUrl && (
                          <div className="relative aspect-video rounded-xl overflow-hidden border border-zinc-200">
                            <Image
                              src={m.actionSuggestion.details.imageUrl}
                              alt="Thumbnail"
                              fill
                              sizes="300px"
                              className="object-cover"
                            />
                          </div>
                        )}

                        <Link
                          href={m.actionSuggestion.url}
                          onClick={() => setIsAiOpen(false)}
                          className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#18181B] hover:bg-[#2F4858] text-white rounded-xl text-xs font-semibold transition-colors shadow-sm"
                        >
                          <span>Cấu hình & Đặt vẽ ngay</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </motion.div>
                    )}
                  </div>
                );
              })}

              {isAiLoading && (
                <div className="flex items-center gap-2 text-zinc-500 text-xs italic p-2 bg-white rounded-xl border border-zinc-200 w-fit">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#3E5C6E]" />
                  <span>Trợ lý AI đang tra cứu chất liệu & tính toán...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Prompt Chips */}
            <div className="px-4 py-2 border-t border-zinc-200/70 bg-white/70 overflow-x-auto flex gap-1.5 shrink-0 scrollbar-none">
              {CHIP_PROMPTS.map((chip, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSendMessage(chip)}
                  disabled={isAiLoading}
                  className="whitespace-nowrap text-[11px] bg-zinc-100 hover:bg-[#3E5C6E] hover:text-white text-zinc-700 px-3 py-1.5 rounded-full border border-zinc-200 transition-colors shrink-0 disabled:opacity-50"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="p-3 bg-white border-t border-zinc-200 flex items-center gap-2"
            >
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Hỏi về chất liệu, báo giá hoặc mẫu tranh..."
                disabled={isAiLoading}
                className="flex-1 text-xs px-3.5 py-2.5 bg-zinc-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3E5C6E] focus:bg-white text-zinc-900 transition-all disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={isAiLoading || !inputMessage.trim()}
                className="p-2.5 bg-[#3E5C6E] text-white hover:bg-[#2F4858] rounded-xl transition-colors disabled:opacity-40 shadow-sm"
                title="Gửi câu hỏi"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
