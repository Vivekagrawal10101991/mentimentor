import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  Maximize,
  MessageSquare,
  Mic,
  MicOff,
  Monitor,
  Phone,
  Send,
  Settings,
  Video,
  VideoOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type ChatSender = "mentor" | "student";

interface ChatMessage {
  sender: ChatSender;
  text: string;
  time: string;
}

function formatElapsed(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function timeNow(): string {
  return new Date().toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function VideoSessionPage() {
  const navigate = useNavigate();
  const { bookingId } = useParams<{ bookingId?: string }>();
  const [searchParams] = useSearchParams();

  const hasBookingParam = bookingId != null && bookingId.length > 0;
  const bookingValid = !hasBookingParam || UUID_RE.test(bookingId);

  const sessionTitle =
    searchParams.get("title")?.trim() || "Chemistry Session";
  const mentorName =
    searchParams.get("mentorName")?.trim() || "Dr. Anita Verma";
  const studentInitial =
    (searchParams.get("studentInitial")?.trim() || "Y").slice(0, 1).toUpperCase();
  const mentorInitial = mentorName.trim().slice(0, 1).toUpperCase() || "M";

  const videoShellRef = useRef<HTMLDivElement>(null);

  const [elapsed, setElapsed] = useState(34 * 60 + 12);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    { sender: "mentor", text: "Hi! Ready to start?", time: "3:59 PM" },
    { sender: "student", text: "Yes, let's begin!", time: "4:00 PM" },
  ]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setElapsed((s) => s + 1);
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  const toggleFullscreen = useCallback(() => {
    const el = videoShellRef.current;
    if (!el) {
      return;
    }
    if (!document.fullscreenElement) {
      void el.requestFullscreen().catch(() => {});
    } else {
      void document.exitFullscreen();
    }
  }, []);

  function sendChat() {
    const t = message.trim();
    if (!t) {
      return;
    }
    setMessages((prev) => [
      ...prev,
      { sender: "student", text: t, time: timeNow() },
    ]);
    setMessage("");
  }

  if (hasBookingParam && !bookingValid) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-gray-900 px-4 text-center">
        <p className="text-white">Invalid session link.</p>
        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          className="mt-4 text-sm text-indigo-300 hover:text-indigo-200"
        >
          Back to dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-gray-900">
      <div className="flex items-center justify-between bg-gray-800/50 px-4 py-3 backdrop-blur-sm">
        <div>
          <h1 className="font-semibold text-white">{sessionTitle}</h1>
          <p className="text-xs text-gray-300">with {mentorName}</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-white">
          <div className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
          <span className="tabular-nums">{formatElapsed(elapsed)}</span>
        </div>
      </div>

      <div
        ref={videoShellRef}
        className="relative flex-1 overflow-hidden bg-black"
      >
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-500">
              <span className="text-5xl font-bold text-white">{mentorInitial}</span>
            </div>
            <p className="text-lg font-medium text-white">{mentorName}</p>
            <p className="text-sm text-gray-400">Mentor</p>
          </div>
        </div>

        <div className="absolute right-4 top-4 h-40 w-32 overflow-hidden rounded-2xl border-2 border-gray-600 bg-gray-700 shadow-xl">
          <div className="flex h-full w-full items-center justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-500">
              <span className="text-2xl font-bold text-white">{studentInitial}</span>
            </div>
          </div>
          {isVideoOff ? (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900/90">
              <VideoOff className="h-8 w-8 text-gray-400" />
            </div>
          ) : null}
        </div>

        <button
          type="button"
          onClick={toggleFullscreen}
          className="absolute left-4 top-4 rounded-lg bg-gray-800/70 p-2 transition-colors hover:bg-gray-700/70"
          aria-label="Toggle fullscreen"
        >
          <Maximize className="h-5 w-5 text-white" />
        </button>

        {showChat ? (
          <div className="absolute inset-y-0 right-0 flex w-full flex-col bg-white shadow-2xl md:w-80">
            <div className="flex items-center justify-between bg-indigo-600 px-4 py-3">
              <h3 className="font-semibold text-white">Chat</h3>
              <button
                type="button"
                onClick={() => setShowChat(false)}
                className="text-white hover:text-gray-200"
                aria-label="Close chat"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {messages.map((msg, idx) => (
                <div
                  key={`${msg.time}-${idx}`}
                  className={`flex ${
                    msg.sender === "student" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                      msg.sender === "student"
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-100 text-gray-900"
                    }`}
                  >
                    <p className="text-sm">{msg.text}</p>
                    <p
                      className={`mt-1 text-xs ${
                        msg.sender === "student"
                          ? "text-indigo-200"
                          : "text-gray-500"
                      }`}
                    >
                      {msg.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-200 p-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Type a message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      sendChat();
                    }
                  }}
                />
                <Button
                  type="button"
                  size="icon"
                  className="bg-indigo-600 text-white hover:bg-indigo-700"
                  onClick={sendChat}
                  aria-label="Send message"
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <div className="bg-gray-800 px-4 py-4">
        <div className="mx-auto flex max-w-2xl items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setIsMuted(!isMuted)}
            className={`flex h-12 w-12 items-center justify-center rounded-full transition-all ${
              isMuted
                ? "bg-red-600 hover:bg-red-700"
                : "bg-gray-700 hover:bg-gray-600"
            }`}
            aria-label={isMuted ? "Unmute microphone" : "Mute microphone"}
          >
            {isMuted ? (
              <MicOff className="h-6 w-6 text-white" />
            ) : (
              <Mic className="h-6 w-6 text-white" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setIsVideoOff(!isVideoOff)}
            className={`flex h-12 w-12 items-center justify-center rounded-full transition-all ${
              isVideoOff
                ? "bg-red-600 hover:bg-red-700"
                : "bg-gray-700 hover:bg-gray-600"
            }`}
            aria-label={isVideoOff ? "Turn camera on" : "Turn camera off"}
          >
            {isVideoOff ? (
              <VideoOff className="h-6 w-6 text-white" />
            ) : (
              <Video className="h-6 w-6 text-white" />
            )}
          </button>

          <button
            type="button"
            className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-700 transition-all hover:bg-gray-600"
            aria-label="Share screen"
          >
            <Monitor className="h-6 w-6 text-white" />
          </button>

          <button
            type="button"
            onClick={() => setShowChat(!showChat)}
            className="relative flex h-12 w-12 items-center justify-center rounded-full bg-gray-700 transition-all hover:bg-gray-600"
            aria-label="Toggle chat"
          >
            <MessageSquare className="h-6 w-6 text-white" />
            {messages.length > 0 ? (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-xs text-white">
                {messages.length > 9 ? "9+" : messages.length}
              </span>
            ) : null}
          </button>

          <button
            type="button"
            className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-700 transition-all hover:bg-gray-600"
            aria-label="Settings"
          >
            <Settings className="h-6 w-6 text-white" />
          </button>

          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="ml-2 flex h-14 w-14 items-center justify-center rounded-full bg-red-600 shadow-lg transition-all hover:bg-red-700"
            aria-label="Leave call"
          >
            <Phone className="h-6 w-6 rotate-[135deg] text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
