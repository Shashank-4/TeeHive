import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import { Upload, Loader2, CheckCircle2 } from "lucide-react";
import api from "../../api/axios";

interface DesignUploaderProps {
    onUploadSuccess: (designUrl: string) => void;
}
type UploadStatus = "idle" | "getting_url" | "uploading" | "saving" | "success";

const DesignUploader: React.FC<DesignUploaderProps> = ({ onUploadSuccess }) => {
    const [status, setStatus] = useState<UploadStatus>("idle");
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const onDrop = useCallback(
        async (acceptedFiles: File[]) => {
            const file = acceptedFiles[0];
            if (!file) return;

            setError(null);
            try {
                //Get the presigned URL from our backend ---
                setStatus("getting_url");
                const { data: presignedData } = await api.get(
                    "/api/designs/upload-url",
                    {
                        params: { contentType: file.type },
                    }
                );
                const { uploadUrl, fileKey, finalUrl } = presignedData.data;
                setStatus("uploading");
                await axios.put(uploadUrl, file, {
                    headers: { "Content-Type": file.type },
                    onUploadProgress: (progressEvent) => {
                        const percentCompleted = Math.round(
                            (progressEvent.loaded * 100) /
                                (progressEvent.total || 1)
                        );
                        setProgress(percentCompleted);
                    },
                });
                setStatus("saving");
                await axios.post("/api/designs", {
                    title: file.name.split(".")[0],
                    imageUrl: finalUrl,
                    fileKey: fileKey,
                });
                setStatus("success");
                onUploadSuccess(finalUrl);
            } catch (err: any) {
                console.error("Upload failed:", err);
                setError("Upload failed. Please try again.");
                setStatus("idle");
            }
        },
        [onUploadSuccess]
    );
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { "image/*": [".png", ".jpg", ".jpeg", ".svg"] },
        maxFiles: 1,
        multiple: false,
    });
    const renderContent = () => {
        switch (status) {
            case "getting_url":
            case "saving":
                return (
                    <>
                        <Loader2 className="w-16 h-16 text-gray-400 mx-auto mb-4 animate-spin" />{" "}
                        <p>Preparing...</p>
                    </>
                );
            case "uploading":
                return (
                    <>
                        <Loader2 className="w-16 h-16 text-gray-400 mx-auto mb-4 animate-spin" />
                        <p>Uploading... {progress}%</p>
                        <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                            <div
                                className="bg-yellow-400 h-2.5 rounded-full"
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                    </>
                );
            case "success":
                return (
                    <>
                        <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />{" "}
                        <p>Upload Complete!</p>
                    </>
                );
            case "idle":
            default:
                return (
                    <>
                        <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-lg font-semibold text-gray-700 mb-2">
                            {isDragActive
                                ? "Drop the files here ..."
                                : "Click to upload or drag and drop"}
                        </p>
                        <p className="text-sm text-gray-500">
                            PNG, JPG, SVG up to 50MB
                        </p>
                    </>
                );
        }
    };

    return (
        <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-2xl p-12 text-center transition-colors cursor-pointer 
            ${
                isDragActive
                    ? "border-yellow-400 bg-yellow-50"
                    : "border-gray-300 bg-gray-50 hover:border-yellow-400"
            }`}
        >
            <input {...getInputProps()} />
            {renderContent()}
            {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        </div>
    );
};

export default DesignUploader;
