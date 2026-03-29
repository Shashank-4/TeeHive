import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, Loader2, CheckCircle2, X, FileIcon } from "lucide-react";
import api from "../../api/axios";

interface UploadDesignModalProps {
    onClose: () => void;
    onUploadComplete: (design: {
        id: string;
        title: string;
        imageUrl: string;
    }) => void;
}

type UploadStatus = "idle" | "uploading" | "success";

const UploadDesignModal: React.FC<UploadDesignModalProps> = ({
    onClose,
    onUploadComplete,
}) => {
    const [file, setFile] = useState<File | null>(null);
    const [designName, setDesignName] = useState("");
    const [status, setStatus] = useState<UploadStatus>("idle");
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const droppedFile = acceptedFiles[0];
        if (droppedFile) {
            setFile(droppedFile);
            setDesignName(droppedFile.name.split(".").slice(0, -1).join("."));
            setError(null);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { "image/*": [".png", ".jpg", ".jpeg", ".svg"] },
        maxFiles: 1,
        multiple: false,
    });

    const handleSubmit = async () => {
        if (!file || !designName.trim()) {
            setError("Source file and ID tag are required.");
            return;
        }

        setError(null);

        try {
            setStatus("uploading");

            const formData = new FormData();
            formData.append("file", file);
            formData.append("title", designName);

            const { data } = await api.post("/api/designs/upload", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
                onUploadProgress: (progressEvent) => {
                    const total = progressEvent.total || 1;
                    const percent = Math.round(
                        (progressEvent.loaded * 100) / total
                    );
                    setProgress(percent);
                },
            });

            setStatus("success");
            setTimeout(() => {
                onUploadComplete(data.data.design);
                onClose();
            }, 800);
        } catch (err: any) {
            console.error("Upload failed:", err);
            setError(err.response?.data?.message || "Transmission Error: Hive node unreachable.");
            setStatus("idle");
            setProgress(0);
        }
    };

    const isUploading = status === "uploading";

    return (
        <div className="fixed inset-0 bg-neutral-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 text-neutral-black">
            <div className="bg-white border-[3px] border-neutral-black rounded-[8px] shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] w-full max-w-xl overflow-hidden relative">
                {/* Header */}
                <div className="bg-neutral-black p-6 flex justify-between items-center text-white">
                    <div className="flex items-center gap-3">
                        <Upload className="w-6 h-6 text-primary" />
                        <h3 className="font-display text-[16px] font-black uppercase tracking-[2px]">Initialize Asset Upload</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 hover:rotate-90 transition-transform duration-300"
                        disabled={isUploading}
                    >
                        <X className="w-6 h-6 text-neutral-g2 hover:text-white" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-8 space-y-8">
                    {/* Dropzone Area */}
                    <div
                        {...getRootProps()}
                        className={`border-[2px] border-dashed rounded-[6px] p-12 text-center transition-all cursor-pointer relative group
                        ${isDragActive
                                ? "border-primary bg-primary/5 shadow-inner"
                                : "border-neutral-black bg-neutral-g1 hover:bg-white hover:border-primary active:translate-x-[2px] active:translate-y-[2px]"
                            }`}
                    >
                        <input {...getInputProps()} disabled={isUploading} />
                        {file ? (
                            <div className="flex flex-col items-center gap-4">
                                <div className="w-16 h-16 bg-white border-[2px] border-neutral-black rounded-[4px] flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                    <FileIcon className="w-8 h-8 text-primary" />
                                </div>
                                <div className="space-y-1">
                                    <p className="font-display text-[14px] font-black uppercase">{file.name}</p>
                                    <p className="font-display text-[10px] font-bold text-neutral-g4 uppercase">
                                        {(file.size / 1024 / 1024).toFixed(2)} MB Source Data
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="w-16 h-16 bg-white border-[2px] border-neutral-black rounded-full flex items-center justify-center mx-auto shadow-[4px_4px_0px_0px_rgba(255,222,0,1)] group-hover:bg-primary transition-colors">
                                    <Upload className="w-8 h-8 text-neutral-black" />
                                </div>
                                <div className="space-y-1">
                                    <p className="font-display text-[13px] font-black uppercase tracking-[1px]">Drag & Drop Asset Here</p>
                                    <p className="font-display text-[10px] font-bold text-neutral-g4 uppercase tracking-tighter">PNG, JPG, OR SVG (MAX 10MB)</p>
                                </div>
                            </div>
                        )}
                        {isUploading && (
                            <div className="absolute inset-0 bg-white/90 flex items-center justify-center p-12">
                                <div className="w-full space-y-4">
                                    <div className="flex justify-between items-end">
                                        <div className="flex items-center gap-3">
                                            <Loader2 className="w-6 h-6 text-primary animate-spin" />
                                            <span className="font-display text-[14px] font-black uppercase tracking-[2px]">Uploading...</span>
                                        </div>
                                        <span className="font-display text-[24px] font-black text-neutral-black">{progress}%</span>
                                    </div>
                                    <div className="w-full h-6 bg-neutral-g1 border-[2px] border-neutral-black rounded-full overflow-hidden p-[3px]">
                                        <div
                                            className="h-full bg-primary border-[1px] border-neutral-black rounded-full transition-all duration-300"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {status === "success" && (
                            <div className="absolute inset-0 bg-primary flex items-center justify-center gap-4 text-neutral-black">
                                <CheckCircle2 className="w-12 h-12 stroke-[3px]" />
                                <span className="font-display text-[24px] font-black uppercase tracking-[3px]">Upload Verified</span>
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className="p-4 bg-danger/10 border-[2px] border-danger rounded-[4px] flex items-center gap-3">
                            <span className="text-[20px]">🚫</span>
                            <p className="font-display text-[11px] font-black text-danger uppercase leading-none">{error}</p>
                        </div>
                    )}

                    {/* Design Name Input */}
                    <div className="space-y-3">
                        <label
                            htmlFor="designName"
                            className="font-display text-[10px] font-black uppercase tracking-[2px] text-neutral-black flex items-center gap-2"
                        >
                            <span className="w-1.5 h-1.5 bg-primary rounded-full" /> Asset Tag Identity
                        </label>
                        <input
                            id="designName"
                            type="text"
                            value={designName}
                            onChange={(e) => setDesignName(e.target.value)}
                            placeholder="e.g., COSMIC_V7_FINAL"
                            className="w-full px-5 py-4 bg-neutral-g1 border-[2px] border-neutral-black rounded-[4px] font-display text-[14px] font-black uppercase tracking-[1px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:translate-x-[2px] focus:translate-y-[2px] focus:shadow-none outline-none transition-all placeholder:text-neutral-g3"
                            disabled={isUploading}
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 bg-neutral-g1 border-t-[2px] border-neutral-black flex justify-end items-center gap-4">
                    <button
                        onClick={onClose}
                        className="px-8 py-3 border-[2px] border-neutral-black rounded-[4px] font-display text-[12px] font-black uppercase tracking-[1px] hover:bg-white transition-all disabled:opacity-50"
                        disabled={isUploading}
                    >
                        Abort
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="px-10 py-3 bg-primary border-[2px] border-neutral-black rounded-[4px] font-display text-[12px] font-black uppercase tracking-[1px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                        disabled={!file || !designName.trim() || isUploading}
                    >
                        Commit Asset
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UploadDesignModal;
