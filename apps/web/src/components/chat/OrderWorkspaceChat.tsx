'use client';

import React, { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import confetti from 'canvas-confetti';
import { io, Socket } from 'socket.io-client';
import {
  MessageSquare,
  Send,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Paperclip,
  Check,
  Palette,
  FileCheck2,
  Clock,
  ShieldCheck,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import {
  fetchOrderMessagesApi,
  approveSketchApi,
  requestRevisionApi,
  uploadFileToStorage,
} from '@/lib/api';

export interface OrderWorkspaceChatProps {
  orderCode: string;
  orderId: string;
  customerId: string;
  currentUser?: {
    id?: string;
    name?: string;
    email?: string;
    role?: 'ARTIST' | 'CUSTOMER';
    avatarUrl?: string | null;
    backendToken?: string;
  } | null;
  orderStatus: string;
  revisionCount: number;
  freeSketchRevisions?: number;
  sketchApprovedAt?: string | null;
  onOrderUpdated?: (updatedOrder: any) => void;
}

export function OrderWorkspaceChat({
  orderCode,
  orderId,
  customerId,
  currentUser,
  orderStatus,
  revisionCount: initialRevisionCount,
  freeSketchRevisions = 2,
  sketchApprovedAt,
  onOrderUpdated,
}: OrderWorkspaceChatProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [attachedUrls, setAttachedUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSketchProposal, setIsSketchProposal] = useState(false);

  // Revision & Approval state
  const [revisionCount, setRevisionCount] = useState(initialRevisionCount);
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [revisionNotes, setRevisionNotes] = useState('');
  const [revisionSubmitting, setRevisionSubmitting] = useState(false);

  const [showApproveModal, setShowApproveModal] = useState(false);
  const [approveNotes, setApproveNotes] = useState('');
  const [approveSubmitting, setApproveSubmitting] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isArtist = currentUser?.role === 'ARTIST';
  const remainingFreeRevisions = Math.max(0, freeSketchRevisions - revisionCount);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 1. Initial Load Message History
  useEffect(() => {
    let isMounted = true;
    const loadMessages = async () => {
      try {
        setLoading(true);
        const data = await fetchOrderMessagesApi(orderCode);
        if (isMounted) {
          setMessages(data);
        }
      } catch (err) {
        console.warn('Failed to load initial order messages:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadMessages();
    return () => {
      isMounted = false;
    };
  }, [orderCode]);

  // 2. Connect Realtime WebSocket
  useEffect(() => {
    const socketUrl =
      process.env.NEXT_PUBLIC_SOCKET_URL ||
      process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') ||
      'http://localhost:4000';

    const socket = io(socketUrl, {
      auth: { token: currentUser?.backendToken },
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setSocketConnected(true);
      socket.emit('join_order', {
        orderCode,
        token: currentUser?.backendToken,
      });
    });

    socket.on('disconnect', () => {
      setSocketConnected(false);
    });

    socket.on('new_message', (newMsg: any) => {
      setMessages((prev) => {
        // Prevent duplicate messages
        if (prev.some((m) => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });
      setTimeout(scrollToBottom, 100);
    });

    socket.on('order_updated', (payload: any) => {
      if (payload.revisionCount !== undefined) {
        setRevisionCount(payload.revisionCount);
      }
      if (onOrderUpdated) {
        onOrderUpdated(payload);
      }
    });

    return () => {
      socket.emit('leave_order', { orderCode });
      socket.disconnect();
    };
  }, [orderCode, currentUser?.backendToken, onOrderUpdated]);

  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  // Handle file attachment upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (file.size > 15 * 1024 * 1024) {
      alert('Kích thước ảnh tối đa là 15MB. Vui lòng chọn ảnh nhỏ hơn.');
      return;
    }

    try {
      setIsUploading(true);
      const uploadedUrl = await uploadFileToStorage(file);
      setAttachedUrls((prev) => [...prev, uploadedUrl]);
    } catch (err: any) {
      alert(err.message || 'Tải ảnh lên thất bại. Vui lòng thử lại.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Send message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!inputText.trim() && attachedUrls.length === 0) || sending) return;

    setSending(true);

    const messageType = isArtist && isSketchProposal ? 'SKETCH_PROPOSAL' : 'TEXT';

    if (socketRef.current) {
      socketRef.current.emit(
        'send_message',
        {
          orderCode,
          content: inputText.trim(),
          attachmentUrls: attachedUrls,
          messageType,
          token: currentUser?.backendToken,
        },
        (ack: any) => {
          setSending(false);
          if (ack?.status === 'success') {
            setInputText('');
            setAttachedUrls([]);
            setIsSketchProposal(false);
          } else if (ack?.message) {
            alert(ack.message);
          }
        },
      );
    } else {
      setSending(false);
    }
  };

  // Customer approves sketch
  const handleConfirmApprove = async () => {
    try {
      setApproveSubmitting(true);
      const res = await approveSketchApi(orderCode, approveNotes, currentUser?.backendToken);

      confetti({
        particleCount: 160,
        spread: 85,
        origin: { y: 0.6 },
      });

      setShowApproveModal(false);
      setApproveNotes('');
      if (onOrderUpdated && res.order) {
        onOrderUpdated(res.order);
      }
    } catch (err: any) {
      alert(err.message || 'Lỗi khi phê duyệt phác thảo');
    } finally {
      setApproveSubmitting(false);
    }
  };

  // Customer requests revision
  const handleConfirmRevision = async () => {
    if (!revisionNotes.trim()) {
      alert('Vui lòng nhập mô tả các điểm cần chỉnh sửa để họa sĩ nắm bắt rõ.');
      return;
    }

    try {
      setRevisionSubmitting(true);
      const res = await requestRevisionApi(orderCode, revisionNotes, currentUser?.backendToken);

      setShowRevisionModal(false);
      setRevisionNotes('');
      setRevisionCount(res.revisionCount);
      if (onOrderUpdated && res.order) {
        onOrderUpdated(res.order);
      }
    } catch (err: any) {
      alert(err.message || 'Lỗi khi yêu cầu chỉnh sửa');
    } finally {
      setRevisionSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden flex flex-col h-[640px]">
      {/* Chat Workspace Header */}
      <div className="p-4 sm:px-6 bg-[#FAF9F6] border-b border-zinc-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#18181B] text-white flex items-center justify-center font-serif font-bold text-sm">
            QT
          </div>
          <div>
            <h4 className="font-serif text-lg font-medium text-zinc-900 leading-tight">
              Phòng Trao Đổi & Phác Thảo
            </h4>
            <span className="text-[11px] text-zinc-500 font-sans block">
              Không gian sáng tác giữa Họa sĩ và Khách hàng &bull; #{orderCode}
            </span>
          </div>
        </div>

        {/* Real-time Socket Indicator */}
        <div className="flex items-center gap-2 text-xs">
          <span
            className={`inline-block w-2.5 h-2.5 rounded-full ${
              socketConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'
            }`}
          />
          <span className="text-zinc-500 text-[11px] hidden sm:inline">
            {socketConnected ? 'Kết nối trực tiếp' : 'Đang kết nối lại...'}
          </span>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-zinc-50/50">
        {loading ? (
          <div className="h-full flex items-center justify-center text-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-[#3E5C6E] mx-auto" />
            <p className="text-xs text-zinc-400 mt-2">Đang tải lịch sử trao đổi...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-12 text-zinc-400 space-y-2">
            <MessageSquare className="w-10 h-10 stroke-[1.2] text-zinc-300" />
            <p className="text-xs font-serif text-zinc-600 text-sm">
              Chưa có tin nhắn nào trong phòng làm việc này.
            </p>
            <p className="text-[11px] text-zinc-400 max-w-sm">
              Bạn có thể gửi ảnh tham chiếu chi tiết, trao đổi về gam màu hoặc họa sĩ sẽ gửi bản phác thảo tại đây.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            // 1. Render SYSTEM_EVENT
            if (msg.messageType === 'SYSTEM_EVENT') {
              return (
                <div key={msg.id} className="flex justify-center my-3">
                  <div className="max-w-xl bg-white border border-zinc-200/90 rounded-full px-4 py-1.5 shadow-sm flex items-center gap-2 text-[11px] text-zinc-600">
                    <Sparkles className="w-3.5 h-3.5 text-[#B45309] shrink-0" />
                    <span>{msg.content}</span>
                    <span className="text-zinc-400 text-[10px] ml-1">
                      {new Date(msg.createdAt).toLocaleTimeString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              );
            }

            // 2. Render SKETCH_PROPOSAL
            if (msg.messageType === 'SKETCH_PROPOSAL') {
              return (
                <div
                  key={msg.id}
                  className="bg-gradient-to-br from-amber-50/70 to-white border-2 border-amber-300/80 rounded-2xl p-5 shadow-sm space-y-3.5 my-4"
                >
                  <div className="flex items-center justify-between border-b border-amber-200/60 pb-3">
                    <div className="flex items-center gap-2">
                      <Palette className="w-4 h-4 text-amber-700" />
                      <span className="text-xs uppercase tracking-wider font-bold text-amber-900">
                        Bản Phác Thảo Ý Tưởng Từ Họa Sĩ
                      </span>
                    </div>
                    <span className="text-[10px] text-amber-700 font-mono">
                      {new Date(msg.createdAt).toLocaleString('vi-VN')}
                    </span>
                  </div>

                  <p className="text-xs text-zinc-800 leading-relaxed font-light">
                    {msg.content}
                  </p>

                  {/* Sketch Image Attachments */}
                  {msg.attachmentUrls && msg.attachmentUrls.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      {msg.attachmentUrls.map((url: string, i: number) => (
                        <a
                          key={i}
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="relative aspect-video rounded-xl overflow-hidden border border-amber-200 group bg-zinc-900"
                        >
                          <Image
                            src={url}
                            alt={`Phác thảo ${i + 1}`}
                            fill
                            sizes="(max-width: 768px) 100vw, 400px"
                            className="object-contain group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
                        </a>
                      ))}
                    </div>
                  )}

                  {/* Customer Action Buttons on Sketch */}
                  {orderStatus !== 'PAINTING' &&
                    orderStatus !== 'DELIVERING' &&
                    orderStatus !== 'COMPLETED' &&
                    orderStatus !== 'CANCELLED' && (
                      <div className="pt-3 border-t border-amber-200/60 flex flex-wrap items-center justify-between gap-3">
                        <div className="text-[11px] text-amber-800">
                          <span>Chính sách chỉnh sửa: </span>
                          <strong className="font-semibold">
                            Còn {remainingFreeRevisions} lượt miễn phí
                          </strong>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setShowRevisionModal(true)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-amber-600 text-amber-900 hover:bg-amber-100 rounded-xl text-xs font-semibold transition-colors"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Yêu Cầu Chỉnh Sửa</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setShowApproveModal(true)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#3E5C6E] text-white hover:bg-[#2F4858] rounded-xl text-xs font-semibold shadow-sm transition-colors"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                            <span>Phê Duyệt Bản Phác Thảo</span>
                          </button>
                        </div>
                      </div>
                    )}
                </div>
              );
            }

            // 3. Render Standard TEXT Message
            const isMe =
              currentUser?.id &&
              (msg.senderId === currentUser.id || msg.sender?.id === currentUser.id);

            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                {!isMe && (
                  <div className="w-8 h-8 rounded-full bg-zinc-200 text-zinc-700 font-semibold text-xs flex items-center justify-center shrink-0">
                    {msg.sender?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}

                <div
                  className={`max-w-[80%] sm:max-w-md rounded-2xl p-3.5 space-y-2 text-xs shadow-sm ${
                    isMe
                      ? 'bg-[#18181B] text-white rounded-tr-none'
                      : 'bg-white text-zinc-800 border border-zinc-200 rounded-tl-none'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 text-[10px] pb-1 border-b border-zinc-200/20">
                    <span
                      className={`font-semibold ${
                        msg.sender?.role === 'ARTIST'
                          ? 'text-amber-400 font-bold'
                          : isMe
                          ? 'text-zinc-300'
                          : 'text-zinc-600'
                      }`}
                    >
                      {msg.sender?.name || 'Thành viên'}
                      {msg.sender?.role === 'ARTIST' && ' (Họa sĩ)'}
                    </span>
                    <span className="opacity-60">
                      {new Date(msg.createdAt).toLocaleTimeString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  {msg.content && (
                    <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  )}

                  {/* Attachment Images */}
                  {msg.attachmentUrls && msg.attachmentUrls.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      {msg.attachmentUrls.map((url: string, i: number) => (
                        <a
                          key={i}
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="relative aspect-square rounded-lg overflow-hidden border border-zinc-200 hover:opacity-90 transition-opacity"
                        >
                          <Image
                            src={url}
                            alt={`Đính kèm ${i + 1}`}
                            fill
                            sizes="180px"
                            className="object-cover"
                          />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Upload Preview Pills */}
      {attachedUrls.length > 0 && (
        <div className="px-4 py-2 bg-zinc-100/80 border-t border-zinc-200 flex items-center gap-2 overflow-x-auto text-xs">
          <span className="text-[11px] text-zinc-500 shrink-0">Ảnh đính kèm:</span>
          {attachedUrls.map((url, i) => (
            <div
              key={i}
              className="relative w-12 h-12 rounded-lg overflow-hidden border border-zinc-300 shrink-0 group"
            >
              <Image src={url} alt={`Upload ${i}`} fill sizes="48px" className="object-cover" />
              <button
                type="button"
                onClick={() => setAttachedUrls((prev) => prev.filter((_, idx) => idx !== i))}
                className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs font-bold transition-opacity"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input Message Form */}
      <form
        onSubmit={handleSendMessage}
        className="p-3 sm:p-4 bg-white border-t border-zinc-200 flex flex-col gap-2"
      >
        {isArtist && (
          <div className="flex items-center gap-2 px-1 text-xs text-amber-800">
            <input
              type="checkbox"
              id="isSketchProposal"
              checked={isSketchProposal}
              onChange={(e) => setIsSketchProposal(e.target.checked)}
              className="rounded text-amber-600 focus:ring-amber-500"
            />
            <label htmlFor="isSketchProposal" className="cursor-pointer font-medium">
              Gắn nhãn: Gửi bản phác thảo ý tưởng cho khách hàng duyệt
            </label>
          </div>
        )}

        <div className="flex items-center gap-2">
          {/* File Upload Button */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="p-2.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-colors disabled:opacity-50"
            title="Đính kèm ảnh tham khảo hoặc bản vẽ"
          >
            {isUploading ? (
              <Loader2 className="w-5 h-5 animate-spin text-[#3E5C6E]" />
            ) : (
              <ImageIcon className="w-5 h-5" />
            )}
          </button>

          {/* Text Input */}
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Nhắn tin trao đổi ý tưởng tác phẩm với họa sĩ..."
            className="flex-1 text-xs sm:text-sm px-4 py-2.5 bg-zinc-100/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3E5C6E] focus:bg-white transition-all text-zinc-900"
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={sending || (!inputText.trim() && attachedUrls.length === 0)}
            className="p-2.5 bg-[#3E5C6E] text-white hover:bg-[#2F4858] rounded-xl transition-colors disabled:opacity-40 disabled:hover:bg-[#3E5C6E]"
            title="Gửi tin nhắn"
          >
            {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
      </form>

      {/* Modal: Approve Sketch */}
      {showApproveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white max-w-md w-full rounded-2xl p-6 shadow-2xl border border-zinc-200 space-y-4">
            <div className="flex items-center gap-3 text-emerald-700">
              <CheckCircle2 className="w-6 h-6" />
              <h3 className="font-serif text-xl font-medium text-zinc-900">
                Phê Duyệt Bản Phác Thảo
              </h3>
            </div>
            <p className="text-xs text-zinc-600 leading-relaxed font-light">
              Sau khi xác nhận, đơn hàng sẽ chính thức chuyển sang giai đoạn **Sáng tác màu thực tế (PAINTING)**. Họa sĩ sẽ bắt đầu pha màu và hoàn thiện tác phẩm.
            </p>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Lời nhắn gửi họa sĩ (không bắt buộc):
              </label>
              <textarea
                rows={3}
                placeholder="Tôi rất ưng ý bố cục này, họa sĩ tiến hành vẽ nhé..."
                value={approveNotes}
                onChange={(e) => setApproveNotes(e.target.value)}
                className="w-full text-xs p-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3E5C6E]"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowApproveModal(false)}
                className="px-4 py-2 text-xs text-zinc-600 hover:text-zinc-900 font-medium"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={handleConfirmApprove}
                disabled={approveSubmitting}
                className="px-4 py-2 bg-[#3E5C6E] hover:bg-[#2F4858] text-white rounded-xl text-xs font-semibold transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                {approveSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                <span>Xác Nhận Phê Duyệt</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Request Revision */}
      {showRevisionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white max-w-md w-full rounded-2xl p-6 shadow-2xl border border-zinc-200 space-y-4">
            <div className="flex items-center gap-3 text-amber-700">
              <RefreshCw className="w-6 h-6" />
              <h3 className="font-serif text-xl font-medium text-zinc-900">
                Yêu Cầu Chỉnh Sửa Phác Thảo
              </h3>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/80 text-xs text-amber-900">
              {remainingFreeRevisions > 0 ? (
                <span>
                  Bạn hiện còn <strong>{remainingFreeRevisions} lượt chỉnh sửa miễn phí</strong> theo chính sách của xưởng.
                </span>
              ) : (
                <span className="text-amber-950 font-medium">
                  Đã hết lượt sửa miễn phí theo chính sách tiêu chuẩn ({freeSketchRevisions} lượt). Yêu cầu này có thể phát sinh phụ phí nhỏ theo thỏa thuận.
                </span>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Chi tiết các điểm cần chỉnh sửa:
              </label>
              <textarea
                rows={4}
                required
                placeholder="Ví dụ: Tôi muốn điều chỉnh nhánh cây bên trái gọn hơn, phối lại gam màu trời ngả về tím hoàng hôn..."
                value={revisionNotes}
                onChange={(e) => setRevisionNotes(e.target.value)}
                className="w-full text-xs p-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3E5C6E]"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowRevisionModal(false)}
                className="px-4 py-2 text-xs text-zinc-600 hover:text-zinc-900 font-medium"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmRevision}
                disabled={revisionSubmitting || !revisionNotes.trim()}
                className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-semibold transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                {revisionSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                <span>Gửi Yêu Cầu Chỉnh Sửa</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
