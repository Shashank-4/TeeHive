import { useEffect, useState } from "react";
import { CheckCircle, XCircle, X } from "lucide-react";

interface ToastProps {
    message: string;
    type: "success" | "error";
    onClose: () => void;
    duration?: number;
}

export default function Toast({ message, type, onClose, duration = 3500 }: ToastProps) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        // Trigger entrance animation
        requestAnimationFrame(() => setVisible(true));
        const timer = setTimeout(() => {
            setVisible(false);
            setTimeout(onClose, 300);
        }, duration);
        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const Icon = type === "success" ? CheckCircle : XCircle;
    const bgColor = type === "success"
        ? "bg-success text-white border-success"
        : "bg-danger text-white border-danger";

    return (
        <div
            className={`fixed top-6 right-6 z-[9999] flex items-center gap-3 px-5 py-3.5 rounded-[4px] border-[2px] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] font-display text-[12px] font-black uppercase tracking-[1px] transition-all duration-300 ${bgColor} ${
                visible ? "translate-x-0 opacity-100" : "translate-x-8 opacity-0"
            }`}
        >
            <Icon className="w-5 h-5 shrink-0" />
            <span className="max-w-[280px] leading-tight">{message}</span>
            <button onClick={() => { setVisible(false); setTimeout(onClose, 300); }} className="ml-2 hover:opacity-70 transition-opacity">
                <X className="w-4 h-4" />
            </button>
        </div>
    );
}
